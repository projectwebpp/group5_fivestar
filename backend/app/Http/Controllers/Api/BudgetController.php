<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class BudgetController extends Controller
{
    /**
     * GET /api/budgets?month=M&year=Y
     * Returns all user categories with their budget limit and current-month spend.
     */
    public function index(Request $request)
    {
        $request->validate([
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'year'  => ['required', 'integer', 'min:2000'],
        ]);

        $userId = Auth::id();
        $month  = (int) $request->input('month');
        $year   = (int) $request->input('year');

        // Fetch all categories for this user
        $categories = DB::table('categories')
            ->where('user_id', $userId)
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        // Fetch budgets for this user/month/year
        $budgets = DB::table('budgets')
            ->where('user_id', $userId)
            ->where('month', $month)
            ->where('year', $year)
            ->select('id', 'category_id', 'amount')
            ->get()
            ->keyBy('category_id');

        // Aggregate current-month spend per category
        $spent = DB::table('expenses')
            ->where('user_id', $userId)
            ->whereRaw('MONTH(expense_date) = ?', [$month])
            ->whereRaw('YEAR(expense_date) = ?', [$year])
            ->select('category_id', DB::raw('SUM(amount) AS total_spent'))
            ->groupBy('category_id')
            ->get()
            ->keyBy('category_id');

        $rows = $categories->map(function ($cat) use ($budgets, $spent) {
            $budget    = $budgets->get($cat->id);
            $spentAmt  = $spent->get($cat->id)?->total_spent ?? 0;
            $spentAmt  = (float) $spentAmt;
            $limit     = $budget ? (float) $budget->amount : null;
            $remaining = $limit !== null ? round($limit - $spentAmt, 2) : null;

            return [
                'category_id'   => $cat->id,
                'category_name' => $cat->name,
                'budget_id'     => $budget?->id,
                'limit'         => $limit,
                'spent'         => round($spentAmt, 2),
                'remaining'     => $remaining,
            ];
        })->values()->all();

        return response()->success($rows, 'OK');
    }

    /**
     * POST /api/budgets
     * Create a new budget limit for a category/month/year.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'month'       => ['required', 'integer', 'min:1', 'max:12'],
            'year'        => ['required', 'integer', 'min:2000'],
            'amount'      => ['required', 'numeric', 'gt:0'],
        ]);

        $userId = Auth::id();

        // Verify category belongs to this user (T-06-01: ownership check)
        $categoryExists = DB::table('categories')
            ->where('id', $data['category_id'])
            ->where('user_id', $userId)
            ->exists();

        if (! $categoryExists) {
            return response()->error('Category not found', [], 404);
        }

        $budget = Budget::create([
            'user_id'     => $userId,
            'category_id' => $data['category_id'],
            'month'       => $data['month'],
            'year'        => $data['year'],
            'amount'      => $data['amount'],
        ]);

        return response()->success($budget, 'Budget created', 201);
    }

    /**
     * PUT /api/budgets/{id}
     * Update the amount on an existing budget row.
     */
    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'gt:0'],
        ]);

        // T-06-02: ownership check prevents editing another user's budget
        $budget = Budget::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (! $budget) {
            return response()->error('Budget not found', [], 404);
        }

        $budget->update(['amount' => $data['amount']]);

        return response()->success($budget, 'Budget updated');
    }

    /**
     * DELETE /api/budgets/{id}
     * Hard-delete a budget row (D-06: blank/delete removes row).
     */
    public function destroy($id)
    {
        // T-06-02: ownership check prevents deleting another user's budget
        $budget = Budget::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (! $budget) {
            return response()->error('Budget not found', [], 404);
        }

        $budget->delete();

        return response()->success(null, 'Budget deleted');
    }
}
