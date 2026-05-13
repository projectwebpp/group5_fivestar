<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'email' => 'a@b.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.token', fn ($token) => is_string($token) && strlen($token) > 0);

        $this->assertDatabaseHas('users', ['email' => 'a@b.com']);
    }

    public function test_register_rejects_duplicate_email(): void
    {
        User::factory()->create(['email' => 'dup@x.com']);

        $response = $this->postJson('/api/auth/register', [
            'email' => 'dup@x.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422);
    }

    public function test_register_rejects_short_password(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'email' => 'b@c.com',
            'password' => 'short',
            'password_confirmation' => 'short',
        ]);

        $response->assertStatus(422);
    }

    public function test_user_can_login(): void
    {
        User::factory()->create([
            'email' => 'l@x.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'l@x.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.token', fn ($token) => is_string($token) && strlen($token) > 0);
    }

    public function test_login_rejects_wrong_password(): void
    {
        User::factory()->create([
            'email' => 'l@x.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'l@x.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401)
            ->assertJson(['success' => false, 'message' => 'Invalid credentials']);
    }

    public function test_logout_invalidates_token(): void
    {
        $register = $this->postJson('/api/auth/register', [
            'email' => 'logout@x.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);
        $token = $register->json('data.token');

        $first = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/logout');
        $first->assertStatus(200);

        $second = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/logout');
        $second->assertStatus(401);
    }

    public function test_protected_route_rejects_unauthenticated(): void
    {
        $this->getJson('/api/auth/me')->assertStatus(401);
    }

    public function test_protected_route_accepts_valid_token(): void
    {
        $register = $this->postJson('/api/auth/register', [
            'email' => 'me@x.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);
        $token = $register->json('data.token');

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/me')
            ->assertStatus(200)
            ->assertJsonPath('data.email', 'me@x.com');
    }
}
