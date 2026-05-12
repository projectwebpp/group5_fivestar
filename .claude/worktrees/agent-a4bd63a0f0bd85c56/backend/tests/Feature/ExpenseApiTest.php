<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Expense;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpenseApiTest extends TestCase
{
    use RefreshDatabase;

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    /**
     * Register a user and return [$user, $token].
     */
    private function registerAndGetToken(string $email = 'test@example.com'): array
    {
        $res = $this->postJson('/api/auth/register', [
            'email'                 => $email,
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);
        $res->assertStatus(201);
        $token = $res->json('data.token');
        $user  = User::where('email', $email)->firstOrFail();
        return [$user, $token];
    }

    /**
     * Get (or create) a category owned by $user.
     * Registration seeds 10 default categories, so this just returns the first one.
     */
    private function seedCategory(User $user): Category
    {
        $cat = Category::where('user_id', $user->id)->first();
        if ($cat) {
            return $cat;
        }
        return Category::create([
            'user_id' => $user->id,
            'name'    => 'Test Category',
            'icon'    => 'tag',
            'color'   => '#FF6B6B',
        ]);
    }

    /**
     * Create an expense for $user, merging $overrides.
     */
    private function seedExpense(User $user, array $overrides = []): Expense
    {
        $category = $this->seedCategory($user);
        return Expense::create(array_merge([
            'user_id'      => $user->id,
            'amount'       => '100.00',
            'currency'     => 'THB',
            'category_id'  => $category->id,
            'description'  => 'Test expense',
            'expense_date' => '2026-05-10',
        ], $overrides));
    }

    // ---------------------------------------------------------------------------
    // EXP-01: Create expense
    // ---------------------------------------------------------------------------

    public function test_create_expense_success(): void
    {
        [$user, $token] = $this->registerAndGetToken();
        $category       = $this->seedCategory($user);

        $res = $this->withToken($token)->postJson('/api/expenses', [
            'amount'      => 250.00,
            'category_id' => $category->id,
            'description' => 'Lunch',
            'date'        => '2026-05-10',
        ]);

        $res->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.amount', 250.0)
            ->assertJsonPath('data.currency', 'THB')
            ->assertJsonPath('data.date', '2026-05-10');
    }

    public function test_create_expense_rejects_zero_amount(): void
    {
        [$user, $token] = $this->registerAndGetToken();
        $category       = $this->seedCategory($user);

        $res = $this->withToken($token)->postJson('/api/expenses', [
            'amount'      => 0,
            'category_id' => $category->id,
            'description' => 'Lunch',
            'date'        => '2026-05-10',
        ]);

        $res->assertStatus(422)
            ->assertJson(['success' => false]);

        $this->assertEquals('amount', $res->json('errors.0.field'));
    }

    public function test_create_expense_rejects_three_decimal_amount(): void
    {
        [$user, $token] = $this->registerAndGetToken();
        $category       = $this->seedCategory($user);

        $res = $this->withToken($token)->postJson('/api/expenses', [
            'amount'      => '10.123',
            'category_id' => $category->id,
            'description' => 'Lunch',
            'date'        => '2026-05-10',
        ]);

        $res->assertStatus(422);
    }

    public function test_create_expense_rejects_missing_category(): void
    {
        [$user, $token] = $this->registerAndGetToken();

        $res = $this->withToken($token)->postJson('/api/expenses', [
            'amount'      => 100.00,
            'description' => 'No category',
            'date'        => '2026-05-10',
        ]);

        $res->assertStatus(422);
    }

    public function test_create_expense_rejects_bad_date_format(): void
    {
        [$user, $token] = $this->registerAndGetToken();
        $category       = $this->seedCategory($user);

        $res = $this->withToken($token)->postJson('/api/expenses', [
            'amount'      => 100.00,
            'category_id' => $category->id,
            'description' => 'Bad date',
            'date'        => '05/10/2026',
        ]);

        $res->assertStatus(422);
    }

    // ---------------------------------------------------------------------------
    // EXP-02: Pagination
    // ---------------------------------------------------------------------------

    public function test_list_expenses_paginates_at_ten(): void
    {
        [$user, $token] = $this->registerAndGetToken();

        // Seed 25 expenses
        for ($i = 1; $i <= 25; $i++) {
            $this->seedExpense($user, ['description' => "Expense $i"]);
        }

        $res = $this->withToken($token)->getJson('/api/expenses');

        $res->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertCount(10, $res->json('data.items'));
        $this->assertEquals(25, $res->json('data.meta.total'));
        $this->assertEquals(3, $res->json('data.meta.last_page'));
        $this->assertEquals(10, $res->json('data.meta.per_page'));
    }

    // ---------------------------------------------------------------------------
    // EXP-03: Filters
    // ---------------------------------------------------------------------------

    public function test_list_expenses_filters_by_category(): void
    {
        [$user, $token] = $this->registerAndGetToken();
        $cat1           = $this->seedCategory($user);

        // Create a second category directly
        $cat2 = Category::create([
            'user_id' => $user->id,
            'name'    => 'Another Category',
            'icon'    => 'star',
            'color'   => '#4ECDC4',
        ]);

        $this->seedExpense($user, ['category_id' => $cat1->id, 'description' => 'Cat1 expense']);
        $this->seedExpense($user, ['category_id' => $cat2->id, 'description' => 'Cat2 expense']);

        $res = $this->withToken($token)->getJson("/api/expenses?category_id={$cat1->id}");

        $res->assertStatus(200);
        $items = $res->json('data.items');
        $this->assertCount(1, $items);
        $this->assertEquals($cat1->id, $items[0]['category_id']);
    }

    public function test_list_expenses_filters_by_date_range_and_amount_range(): void
    {
        [$user, $token] = $this->registerAndGetToken();

        // Seed 3 expenses: one in range, two outside
        $this->seedExpense($user, ['expense_date' => '2026-05-05', 'amount' => '50.00',  'description' => 'in range']);
        $this->seedExpense($user, ['expense_date' => '2026-04-01', 'amount' => '200.00', 'description' => 'wrong date']);
        $this->seedExpense($user, ['expense_date' => '2026-05-10', 'amount' => '600.00', 'description' => 'too expensive']);

        $res = $this->withToken($token)->getJson(
            '/api/expenses?date_from=2026-05-01&date_to=2026-05-31&amount_min=10&amount_max=500'
        );

        $res->assertStatus(200);
        $items = $res->json('data.items');
        $this->assertCount(1, $items);
        $this->assertEquals('in range', $items[0]['description']);
    }

    // ---------------------------------------------------------------------------
    // EXP-04: Show + Ownership
    // ---------------------------------------------------------------------------

    public function test_show_returns_404_when_owned_by_other_user(): void
    {
        [$userA, $tokenA] = $this->registerAndGetToken('userA@example.com');
        [$userB, $tokenB] = $this->registerAndGetToken('userB@example.com');

        $expense = $this->seedExpense($userB);

        // User A tries to access User B's expense
        $this->withToken($tokenA)
            ->getJson("/api/expenses/{$expense->id}")
            ->assertStatus(404);
    }

    // ---------------------------------------------------------------------------
    // EXP-05: Update (PUT / PATCH)
    // ---------------------------------------------------------------------------

    public function test_put_full_update(): void
    {
        [$user, $token] = $this->registerAndGetToken();
        $category       = $this->seedCategory($user);
        $expense        = $this->seedExpense($user);

        $res = $this->withToken($token)->putJson("/api/expenses/{$expense->id}", [
            'amount'      => 999.99,
            'category_id' => $category->id,
            'description' => 'Updated description',
            'date'        => '2026-05-15',
        ]);

        $res->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.amount', 999.99)
            ->assertJsonPath('data.description', 'Updated description')
            ->assertJsonPath('data.date', '2026-05-15');
    }

    public function test_patch_partial_update(): void
    {
        [$user, $token] = $this->registerAndGetToken();
        $expense        = $this->seedExpense($user, ['description' => 'Original']);

        $res = $this->withToken($token)->patchJson("/api/expenses/{$expense->id}", [
            'amount' => 99.99,
        ]);

        $res->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.amount', 99.99);

        // Description should be unchanged
        $this->assertEquals('Original', $res->json('data.description'));
    }

    // ---------------------------------------------------------------------------
    // EXP-06: Delete
    // ---------------------------------------------------------------------------

    public function test_delete_removes_owned_expense(): void
    {
        [$user, $token] = $this->registerAndGetToken();
        $expense        = $this->seedExpense($user);

        $this->withToken($token)
            ->deleteJson("/api/expenses/{$expense->id}")
            ->assertStatus(200)
            ->assertJson(['success' => true]);

        // Subsequent GET returns 404
        $this->withToken($token)
            ->getJson("/api/expenses/{$expense->id}")
            ->assertStatus(404);
    }

    public function test_delete_404_when_other_user_owns(): void
    {
        [$userA, $tokenA] = $this->registerAndGetToken('userA@example.com');
        [$userB, $tokenB] = $this->registerAndGetToken('userB@example.com');

        $expense = $this->seedExpense($userB);

        // User A tries to delete User B's expense
        $this->withToken($tokenA)
            ->deleteJson("/api/expenses/{$expense->id}")
            ->assertStatus(404);

        // Expense still exists
        $this->assertDatabaseHas('expenses', ['id' => $expense->id]);
    }

    // ---------------------------------------------------------------------------
    // Auth gate (T-04-01)
    // ---------------------------------------------------------------------------

    public function test_endpoints_require_jwt(): void
    {
        $this->getJson('/api/expenses')
            ->assertStatus(401);
    }
}
