<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    private function registerAndGetToken(string $email = 'test@example.com'): array
    {
        $res = $this->postJson('/api/auth/register', [
            'email'                 => $email,
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);
        $token = $res->json('data.token');
        $user  = User::where('email', $email)->first();
        return [$user, $token];
    }

    // CAT-01: Registration seeds 10 default categories for the new user
    public function test_register_seeds_default_categories(): void
    {
        [$user, $token] = $this->registerAndGetToken();

        $this->assertDatabaseCount('categories', 10);
        $this->assertDatabaseHas('categories', ['name' => 'Food',  'user_id' => $user->id]);
        $this->assertDatabaseHas('categories', ['name' => 'Other', 'user_id' => $user->id]);
    }

    // CAT-05: List endpoint returns only authenticated user's categories
    public function test_list_returns_only_own_categories(): void
    {
        [$user1, $token1] = $this->registerAndGetToken('user1@example.com');
        [$user2, $token2] = $this->registerAndGetToken('user2@example.com');

        $res = $this->withToken($token1)->getJson('/api/categories');
        $res->assertStatus(200)->assertJson(['success' => true]);

        $ids = collect($res->json('data'))->pluck('user_id')->unique()->values();
        $this->assertCount(1, $ids);
        $this->assertEquals($user1->id, $ids[0]);
    }

    // CAT-05: Unauthenticated request returns 401
    public function test_unauthenticated_request_returns_401(): void
    {
        $this->getJson('/api/categories')->assertStatus(401);
    }

    // CAT-02: Authenticated user can create a category
    public function test_user_can_create_category(): void
    {
        [$user, $token] = $this->registerAndGetToken();

        $res = $this->withToken($token)->postJson('/api/categories', [
            'name'  => 'Gym',
            'icon'  => 'dumbbell',
            'color' => '#FF6B6B',
        ]);

        $res->assertStatus(201)->assertJson(['success' => true]);
        $this->assertDatabaseHas('categories', ['name' => 'Gym', 'user_id' => $user->id]);
    }

    // CAT-02: Duplicate category name for same user returns 422
    public function test_duplicate_category_name_returns_422(): void
    {
        [$user, $token] = $this->registerAndGetToken();

        $payload = ['name' => 'Gym', 'icon' => 'dumbbell', 'color' => '#FF6B6B'];
        $this->withToken($token)->postJson('/api/categories', $payload)->assertStatus(201);
        $this->withToken($token)->postJson('/api/categories', $payload)->assertStatus(422);
    }

    // CAT-03: User can update own category
    public function test_user_can_update_category(): void
    {
        [$user, $token] = $this->registerAndGetToken();
        $category = Category::where('user_id', $user->id)->first();

        $res = $this->withToken($token)->putJson("/api/categories/{$category->id}", [
            'name'  => 'Updated Name',
            'icon'  => 'car',
            'color' => '#4ECDC4',
        ]);

        $res->assertStatus(200)->assertJson(['success' => true]);
        $this->assertDatabaseHas('categories', ['id' => $category->id, 'name' => 'Updated Name']);
    }

    // CAT-03: User cannot update another user's category (returns 404)
    public function test_user_cannot_update_other_users_category(): void
    {
        [$user1, $token1] = $this->registerAndGetToken('user1@example.com');
        [$user2, $token2] = $this->registerAndGetToken('user2@example.com');

        $otherCategory = Category::where('user_id', $user2->id)->first();

        $this->withToken($token1)->putJson("/api/categories/{$otherCategory->id}", [
            'name'  => 'Hack',
            'icon'  => 'zap',
            'color' => '#FF6B6B',
        ])->assertStatus(404);
    }

    // CAT-04: Delete category with no expenses succeeds
    public function test_user_can_delete_category(): void
    {
        [$user, $token] = $this->registerAndGetToken();
        $category = Category::where('user_id', $user->id)->first();

        $this->withToken($token)
            ->deleteJson("/api/categories/{$category->id}")
            ->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    // CAT-04: Delete blocked when expense references the category
    public function test_delete_blocked_if_category_has_expenses(): void
    {
        [$user, $token] = $this->registerAndGetToken();
        $category = Category::where('user_id', $user->id)->first();

        // Insert a minimal expense row referencing this category (user_id required since Phase 4 migration)
        \DB::table('expenses')->insert([
            'user_id'      => $user->id,
            'amount'       => '10.00',
            'currency'     => 'THB',
            'category_id'  => $category->id,
            'description'  => 'test expense',
            'expense_date' => '2026-01-01',
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        $this->withToken($token)
            ->deleteJson("/api/categories/{$category->id}")
            ->assertStatus(422)
            ->assertJson(['success' => false]);
    }
}
