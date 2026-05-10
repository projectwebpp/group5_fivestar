<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|min:8|confirmed',
        ]);

        // D-02: seed 10 default categories per new user at registration (per-user copy)
        $defaults = [
            ['name' => 'Food',          'icon' => 'utensils',     'color' => '#FF6B6B'],
            ['name' => 'Transport',     'icon' => 'car',          'color' => '#4ECDC4'],
            ['name' => 'Housing',       'icon' => 'home',         'color' => '#FFE66D'],
            ['name' => 'Education',     'icon' => 'book',         'color' => '#95E1D3'],
            ['name' => 'Health',        'icon' => 'heart',        'color' => '#F38181'],
            ['name' => 'Entertainment', 'icon' => 'gamepad-2',    'color' => '#AA96DA'],
            ['name' => 'Shopping',      'icon' => 'shopping-bag', 'color' => '#FCBAD3'],
            ['name' => 'Utilities',     'icon' => 'zap',          'color' => '#A8D8EA'],
            ['name' => 'Business',      'icon' => 'briefcase',    'color' => '#C1D82F'],
            ['name' => 'Other',         'icon' => 'gift',         'color' => '#999999'],
        ];

        $user = DB::transaction(function () use ($data, $defaults) {
            $user = User::create($data);
            foreach ($defaults as $cat) {
                Category::create(array_merge($cat, ['user_id' => $user->id]));
            }
            return $user;
        });

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
