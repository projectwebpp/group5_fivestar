<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
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
