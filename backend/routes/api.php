<?php

use App\Http\Controllers\Api\AuthController;
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

// Protected API surface (AUTH-04) — populated in Phases 3-5
Route::middleware('jwt.auth')->group(function () {
    // Phase 3: category routes
    // Phase 4: expense routes
    // Phase 5: analytics routes
});
