<?php

namespace App\Providers;

use Illuminate\Support\Facades\Response;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Response::macro('success', function (mixed $data = null, string $message = 'Success', int $status = 200) {
            return Response::json([
                'success' => true,
                'data'    => $data,
                'message' => $message,
            ], $status);
        });

        Response::macro('error', function (string $message = 'Error', array $errors = [], int $status = 400) {
            return Response::json([
                'success' => false,
                'message' => $message,
                'errors'  => $errors,
            ], $status);
        });
    }
}
