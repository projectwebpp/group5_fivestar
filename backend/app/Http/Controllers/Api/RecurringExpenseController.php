<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RecurringExpense;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RecurringExpenseController extends Controller
{
    /**
     * GET /api/recurring
     * Returns all recurring expense templates for the authenticated user.
     */
    public function index()
    {
        $templates = RecurringExpense::where('user_id', Auth::id())
            ->with('category')
            ->orderBy('created_at', 'desc')
            ->get();

        $mapped = $templates->map(fn ($t) => $this->shape($t))->all();

        return response()->success($mapped, 'OK');
    }

    /**
     * POST /api/recurring
     * Create a new recurring expense template.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'description' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'amount'      => ['required', 'numeric', 'gt:0', 'regex:/^\d+(\.\d{1,2})?$/'],
            'currency'    => ['sometimes', 'string', 'size:3'],
            'frequency'   => ['required', 'in:daily,weekly,monthly'],
            'start_date'  => ['required', 'date_format:Y-m-d'],
        ]);

        $userId = Auth::id();

        // T-08-02: Category ownership check — prevents cross-user category injection
        $categoryExists = DB::table('categories')
            ->where('id', $data['category_id'])
            ->where('user_id', $userId)
            ->exists();

        if (! $categoryExists) {
            return response()->error('Category not found', [], 404);
        }

        $template = RecurringExpense::create([
            'user_id'     => $userId,
            'category_id' => $data['category_id'],
            'description' => $data['description'],
            'amount'      => $data['amount'],
            'currency'    => $data['currency'] ?? 'THB',
            'frequency'   => $data['frequency'],
            'start_date'  => $data['start_date'],
            // last_created_date intentionally absent (NULL) — first entry on next GET /expenses
        ]);

        return response()->success($this->shape($template->load('category')), 'Created', 201);
    }

    /**
     * PUT /api/recurring/{id}
     * Update an existing recurring expense template.
     */
    public function update(Request $request, $id)
    {
        // T-08-01: Ownership guard — 404 if not found or belongs to another user
        $template = RecurringExpense::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (! $template) {
            return response()->error('Recurring expense not found', [], 404);
        }

        $data = $request->validate([
            'description' => ['sometimes', 'string', 'max:255'],
            'category_id' => ['sometimes', 'integer', 'exists:categories,id'],
            'amount'      => ['sometimes', 'numeric', 'gt:0', 'regex:/^\d+(\.\d{1,2})?$/'],
            'frequency'   => ['sometimes', 'in:daily,weekly,monthly'],
            'start_date'  => ['sometimes', 'date_format:Y-m-d'],
        ]);

        $template->update($data);

        return response()->success($this->shape($template->fresh()->load('category')), 'Updated');
    }

    /**
     * DELETE /api/recurring/{id}
     * Remove a recurring expense template (generated expenses are preserved).
     */
    public function destroy($id)
    {
        // T-08-01: Ownership guard — 404 if not found or belongs to another user
        $template = RecurringExpense::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (! $template) {
            return response()->error('Recurring expense not found', [], 404);
        }

        $template->delete();

        return response()->success(null, 'Deleted');
    }

    /**
     * Shape a RecurringExpense model into the API response array.
     * Computes next_due from last_created_date (or start_date if null) + frequency.
     */
    private function shape(RecurringExpense $t): array
    {
        // Base date: last_created_date if set, otherwise start_date
        $base = $t->last_created_date
            ? Carbon::parse($t->last_created_date->format('Y-m-d'))
            : Carbon::parse($t->start_date->format('Y-m-d'));

        $nextDue = match ($t->frequency) {
            'daily'   => $base->copy()->addDay(),
            'weekly'  => $base->copy()->addWeek(),
            'monthly' => $base->copy()->addMonth(),
        };

        return [
            'id'                => $t->id,
            'description'       => $t->description,
            'category_id'       => $t->category_id,
            'category_name'     => $t->category?->name,
            'amount'            => (float) $t->amount,
            'currency'          => $t->currency,
            'frequency'         => $t->frequency,
            'start_date'        => $t->start_date->format('Y-m-d'),
            'last_created_date' => $t->last_created_date?->format('Y-m-d'),
            'next_due'          => $nextDue->toDateString(),
            'created_at'        => $t->created_at?->toIso8601String(),
            'updated_at'        => $t->updated_at?->toIso8601String(),
        ];
    }
}
