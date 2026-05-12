<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function summary(Request $request)
    {
        $request->validate([
            'date_from' => ['sometimes', 'date_format:Y-m-d'],
            'date_to'   => ['sometimes', 'date_format:Y-m-d', 'after_or_equal:date_from'],
        ]);

        $userId   = Auth::id();
        $dateFrom = $request->input('date_from');
        $dateTo   = $request->input('date_to');

        $query = DB::table('expenses')
            ->join('categories', 'expenses.category_id', '=', 'categories.id')
            ->where('expenses.user_id', $userId)
            ->select(
                'categories.id',
                'categories.name',
                DB::raw('SUM(expenses.amount) AS category_total')
            );

        if ($dateFrom) {
            $query->whereDate('expenses.expense_date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('expenses.expense_date', '<=', $dateTo);
        }

        $rows  = $query->groupBy('categories.id', 'categories.name')
                       ->orderByDesc('category_total')
                       ->get();

        $total = (float) $rows->sum('category_total');

        // Daily average: total / days in range (minimum 1 day)
        $days = 1;
        if ($dateFrom && $dateTo) {
            $days = max(1, Carbon::parse($dateFrom)->diffInDays(Carbon::parse($dateTo)) + 1);
        }

        // Monthly average: total / distinct calendar months spanned (minimum 1)
        $months = 1;
        if ($dateFrom && $dateTo) {
            $start  = Carbon::parse($dateFrom)->startOfMonth();
            $end    = Carbon::parse($dateTo)->startOfMonth();
            $months = max(1, $start->diffInMonths($end) + 1);
        }

        $breakdown = $rows->map(fn ($r) => [
            'name'       => $r->name,
            'total'      => (float) $r->category_total,
            'percentage' => $total > 0
                ? round((float) $r->category_total / $total * 100, 2)
                : 0.0,
        ])->all();

        return response()->success([
            'date_from'          => $dateFrom,
            'date_to'            => $dateTo,
            'total'              => $total,
            'daily_avg'          => round($total / $days, 2),
            'monthly_avg'        => round($total / $months, 2),
            'category_breakdown' => $breakdown,
        ], 'OK');
    }
}
