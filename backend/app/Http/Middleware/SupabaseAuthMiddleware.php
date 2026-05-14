<?php

namespace App\Http\Middleware;

use App\Models\Category;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SupabaseAuthMiddleware
{
    public function handle(Request $request, Closure $next): mixed
    {
        $token = $request->bearerToken();

        if (! $token) {
            return response()->error('Token absent', [], 401);
        }

        try {
            $claims = $this->verifyToken($token);
        } catch (\Exception $e) {
            return response()->error($e->getMessage(), [], 401);
        }

        $email = $claims['email'] ?? null;
        if (! $email) {
            return response()->error('Token invalid', [], 401);
        }

        $user = User::firstOrCreate(
            ['email' => $email],
            ['name' => $email, 'password' => bcrypt(bin2hex(random_bytes(16)))]
        );

        if ($user->wasRecentlyCreated) {
            $this->seedCategories($user);
        }

        Auth::setUser($user);

        return $next($request);
    }

    private function verifyToken(string $token): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new \Exception('Token invalid');
        }

        [$headerB64, $payloadB64, $signatureB64] = $parts;

        $secret = config('supabase.jwt_secret');
        $expected = $this->base64url(hash_hmac('sha256', "$headerB64.$payloadB64", $secret, true));

        if (! hash_equals($expected, $signatureB64)) {
            throw new \Exception('Token invalid');
        }

        $claims = json_decode($this->base64urlDecode($payloadB64), true);

        if (($claims['exp'] ?? 0) < time()) {
            throw new \Exception('Token expired');
        }

        return $claims;
    }

    private function base64url(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64urlDecode(string $data): string
    {
        $padded = $data . str_repeat('=', (4 - strlen($data) % 4) % 4);
        return base64_decode(strtr($padded, '-_', '+/'));
    }

    private function seedCategories(User $user): void
    {
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

        foreach ($defaults as $cat) {
            Category::create(array_merge($cat, ['user_id' => $user->id]));
        }
    }
}
