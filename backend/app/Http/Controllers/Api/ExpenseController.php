<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Models\Expense;
use App\Models\RecurringExpense;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        // D-01: Auto-create any due recurring expense entries before fetching results.
        // Wrapped in try/catch — a broken template must NEVER propagate as a 500 (T-08-07).
        try {
            $this->processRecurring(Auth::id());
        } catch (\Throwable $e) {
            Log::warning('processRecurring failed: ' . $e->getMessage());
        }

        $request->validate([
            'date_from'   => ['sometimes', 'date_format:Y-m-d'],
            'date_to'     => ['sometimes', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'amount_min'  => ['sometimes', 'numeric', 'min:0'],
            'amount_max'  => ['sometimes', 'numeric', 'min:0', 'gte:amount_min'],
            'category_id' => ['sometimes', 'integer'],
        ]);

        $q = Expense::query()->where('user_id', Auth::id());

        if ($request->filled('category_id')) {
            $q->where('category_id', $request->integer('category_id'));
        }
        if ($request->filled('date_from')) {
            $q->whereDate('expense_date', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $q->whereDate('expense_date', '<=', $request->input('date_to'));
        }
        if ($request->filled('amount_min')) {
            $q->where('amount', '>=', (float) $request->input('amount_min'));
        }
        if ($request->filled('amount_max')) {
            $q->where('amount', '<=', (float) $request->input('amount_max'));
        }

        $perPage = 10; // D-07 fixed page size
        $page    = $q->orderBy('expense_date', 'desc')->orderBy('id', 'desc')->paginate($perPage);

        return response()->success([
            'items' => $page->getCollection()->map(fn ($e) => $this->shape($e))->all(),
            'meta'  => [
                'page'      => $page->currentPage(),
                'per_page'  => $perPage,
                'total'     => $page->total(),
                'last_page' => $page->lastPage(),
            ],
        ], 'OK');
    }

    public function store(StoreExpenseRequest $request)
    {
        $data = $request->validated();

        $expense = Expense::create([
            'user_id'      => Auth::id(),
            'amount'       => $data['amount'],
            'currency' => 'THB', // D-13 silent server-set
            'category_id'  => $data['category_id'],
            'description'  => $data['description'],
            'expense_date' => $data['date'],
            'notes'        => $data['notes'] ?? null,
        ]);

        return response()->success($this->shape($expense), 'Created', 201);
    }

    public function show(string $id)
    {
        $expense = Expense::where('user_id', Auth::id())->find($id);

        if (! $expense) {
            return response()->error('Expense not found', [], 404);
        }

        return response()->success($this->shape($expense), 'OK');
    }

    public function update(UpdateExpenseRequest $request, string $id)
    {
        $expense = Expense::where('user_id', Auth::id())->find($id);

        if (! $expense) {
            return response()->error('Expense not found', [], 404);
        }

        $data = $request->validated();

        if (isset($data['date'])) {
            $data['expense_date'] = $data['date'];
            unset($data['date']);
        }

        $expense->fill($data)->save();

        return response()->success($this->shape($expense->fresh()), 'Updated');
    }

    public function destroy(string $id)
    {
        $expense = Expense::where('user_id', Auth::id())->find($id);

        if (! $expense) {
            return response()->error('Expense not found', [], 404);
        }

        $expense->delete();

        return response()->success(['id' => (int) $id], 'Deleted');
    }

    public function export(): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $userId = Auth::id();

        $expenses = Expense::where('user_id', $userId)
            ->with('category')
            ->orderBy('expense_date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        $filename = 'expenses-' . now()->format('Y-m-d') . '.csv';

        return response()->streamDownload(function () use ($expenses) {
            $handle = fopen('php://output', 'w');

            // Header row — 7 columns per D-05 (date, category, description, amount, currency, notes)
            fputcsv($handle, ['date', 'category', 'description', 'amount', 'currency', 'notes']);

            // Data rows — empty $expenses produces header-only CSV per D-04
            foreach ($expenses as $expense) {
                fputcsv($handle, [
                    $expense->expense_date?->format('Y-m-d'),
                    $expense->category?->name ?? '',
                    $expense->description,
                    number_format((float) $expense->amount, 2, '.', ''),
                    $expense->currency,
                    $expense->notes ?? '',
                ]);
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /**
     * Auto-create one due expense entry per overdue recurring template.
     * D-01: Triggered on GET /expenses.
     * D-02: Deduplication via last_created_date.
     * D-03: At most 1 entry per template per call (no backfill).
     * T-08-03: user_id comes from $userId argument (Auth::id()), never from template or request.
     * T-08-07: Entire body wrapped in try/catch in index() — errors are logged, never exposed.
     */
    private function processRecurring(int $userId): void
    {
        $today     = Carbon::today();
        $templates = RecurringExpense::where('user_id', $userId)
            ->whereDate('start_date', '<=', $today)
            ->get();

        foreach ($templates as $template) {
            // Base date: last_created_date if set, otherwise start_date
            $base = $template->last_created_date
                ? Carbon::parse($template->last_created_date->format('Y-m-d'))
                : Carbon::parse($template->start_date->format('Y-m-d'));

            // Next due date per frequency (D-10)
            $nextDue = match ($template->frequency) {
                'daily'   => $base->copy()->addDay(),
                'weekly'  => $base->copy()->addWeek(),
                'monthly' => $base->copy()->addMonth(),
            };

            // Skip if not yet due (D-02)
            if ($today->lt($nextDue)) {
                continue;
            }

            // Create exactly one entry for the most recent due period (D-03)
            Expense::create([
                'user_id'      => $userId,
                'amount'       => $template->amount,
                'currency'     => $template->currency,
                'category_id'  => $template->category_id,
                'description'  => $template->description,
                'expense_date' => $nextDue->toDateString(),
                'is_recurring' => true,
                'recurring_id' => $template->id,
            ]);

            // CRITICAL: set to $nextDue (not today) to preserve recurrence anchoring (D-02, Pitfall 1)
            $template->update(['last_created_date' => $nextDue->toDateString()]);
        }
    }

    private function shape(Expense $expense): array
    {
        return [
            'id'          => $expense->id,
            'amount'      => (float) $expense->amount,
            'currency'    => $expense->currency,
            'category_id' => $expense->category_id,
            'description' => $expense->description,
            'date'        => $expense->expense_date?->format('Y-m-d'),
            'notes'       => $expense->notes,
            'created_at'  => $expense->created_at?->toIso8601String(),
            'updated_at'  => $expense->updated_at?->toIso8601String(),
        ];
    }
}
