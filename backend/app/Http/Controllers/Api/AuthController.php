<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|min:8|confirmed',
        ]);

        $user  = User::create($data);
        $token = auth()->login($user);

        return response()->success(['token' => $token], 'Registration successful', 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        if (! $token = auth()->attempt($credentials)) {
            return response()->error('Invalid credentials', [], 401);
        }

        return response()->success(['token' => $token], 'Login successful');
    }

    public function logout(): JsonResponse
    {
        auth()->logout();

        return response()->success(null, 'Logged out successfully');
    }

    public function me(): JsonResponse
    {
        return response()->success(auth()->user(), 'Authenticated user');
    }
}
