<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BudgetController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\RecurringExpenseController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\HealthController;
use Illuminate\Support\Facades\Route;

// Health check (Phase 1)
Route::get('/health', [HealthController::class, 'index']);

// Public auth endpoints (AUTH-01, AUTH-02)
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);
});

// Protected auth endpoints (AUTH-03)
Route::middleware('jwt.auth')->prefix('auth')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me',      [AuthController::class, 'me']);
});

// Protected API surface — jwt.auth guard (auth:api)
Route::middleware('auth:api')->group(function () {
    // Phase 3: Categories (CAT-01 through CAT-05)
    Route::get('categories',               [CategoryController::class, 'index']);
    Route::post('categories',              [CategoryController::class, 'store']);
    Route::put('categories/{category}',    [CategoryController::class, 'update']);
    Route::delete('categories/{category}', [CategoryController::class, 'destroy']);

    // Phase 4: Expenses (EXP-01 through EXP-06)
    Route::get   ('expenses',          [ExpenseController::class, 'index']);
    Route::post  ('expenses',          [ExpenseController::class, 'store']);
    // Phase 7: CSV Export (REQ-23) — MUST be before expenses/{id}
    Route::get   ('expenses/export',   [ExpenseController::class, 'export']);
    Route::get   ('expenses/{id}',     [ExpenseController::class, 'show']);
    Route::put   ('expenses/{id}',   [ExpenseController::class, 'update']);
    Route::patch ('expenses/{id}',   [ExpenseController::class, 'update']);
    Route::delete('expenses/{id}',   [ExpenseController::class, 'destroy']);

    // Phase 5: Analytics (REP-01 through REP-04)
    Route::get('analytics/summary', [AnalyticsController::class, 'summary']);

    // Phase 6: Budget Management (REQ-20, REQ-21, REQ-22)
    Route::get   ('budgets',      [BudgetController::class, 'index']);
    Route::post  ('budgets',      [BudgetController::class, 'store']);
    Route::put   ('budgets/{id}', [BudgetController::class, 'update']);
    Route::delete('budgets/{id}', [BudgetController::class, 'destroy']);

    // Phase 8: Recurring Expenses (REQ-24)
    Route::get   ('recurring',      [RecurringExpenseController::class, 'index']);
    Route::post  ('recurring',      [RecurringExpenseController::class, 'store']);
    Route::put   ('recurring/{id}', [RecurringExpenseController::class, 'update']);
    Route::delete('recurring/{id}', [RecurringExpenseController::class, 'destroy']);
});
