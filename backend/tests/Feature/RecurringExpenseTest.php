<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Expense;
use App\Models\RecurringExpense;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecurringExpenseTest extends TestCase
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
     * Create a RecurringExpense row for $user, merging $overrides.
     */
    private function seedRecurring(User $user, array $overrides = []): RecurringExpense
    {
        $category = $this->seedCategory($user);
        return RecurringExpense::create(array_merge([
            'user_id'           => $user->id,
            'category_id'       => $category->id,
            'description'       => 'Monthly Coffee',
            'amount'            => 150.00,
            'currency'          => 'THB',
            'frequency'         => 'monthly',
            'start_date'        => Carbon::today()->subMonth()->toDateString(),
            'last_created_date' => null,
        ], $overrides));
    }

    // ---------------------------------------------------------------------------
    // REC-01: Create template
    // ---------------------------------------------------------------------------

    public function test_store_creates_template(): void
    {
        [$user, $token] = $this->registerAndGetToken();
        $category       = $this->seedCategory($user);

        $res = $this->withToken($token)->postJson('/api/recurring', [
            'description' => 'Monthly Rent',
            'category_id' => $category->id,
            'amount'      => 5000.00,
            'currency'    => 'THB',
            'frequency'   => 'monthly',
            'start_date'  => '2026-05-01',
        ]);

        $res->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonPath('data.frequency', 'monthly')
            ->assertJsonPath('data.description', 'Monthly Rent');
    }

    // ---------------------------------------------------------------------------
    // REC-02: List templates
    // ---------------------------------------------------------------------------

    public function test_index_returns_templates(): void
    {
        [$user, $token] = $this->registerAndGetToken();

        $this->seedRecurring($user, ['description' => 'Coffee']);
        $this->seedRecurring($user, ['description' => 'Gym']);

        $res = $this->withToken($token)->getJson('/api/recurring');

        $res->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertCount(2, $res->json('data'));
    }

    // ---------------------------------------------------------------------------
    // REC-03: Update template
    // ---------------------------------------------------------------------------

    public function test_update_modifies_template(): void
    {
        [$user, $token] = $this->registerAndGetToken();
        $template       = $this->seedRecurring($user);

        $res = $this->withToken($token)->putJson("/api/recurring/{$template->id}", [
            'amount' => 200.00,
        ]);

        $res->assertStatus(200)
            ->assertJson(['success' => true]);

        // Use assertEquals (not assertJsonPath) to handle int/float JSON casting difference
        $this->assertEquals(200.0, (float) $res->json('data.amount'));
    }

    // ---------------------------------------------------------------------------
    // REC-04: Delete template
    // ---------------------------------------------------------------------------

    public function test_destroy_removes_template(): void
    {
        [$user, $token] = $this->registerAndGetToken();
        $template       = $this->seedRecurring($user);

        $this->withToken($token)
            ->deleteJson("/api/recurring/{$template->id}")
            ->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertNull(RecurringExpense::find($template->id));
    }

    // ---------------------------------------------------------------------------
    // REC-05: processRecurring() creates due entry
    // ---------------------------------------------------------------------------

    public function test_process_creates_due_entry(): void
    {
        [$user, $token] = $this->registerAndGetToken();
        $category       = $this->seedCategory($user);

        // Template with start_date = yesterday, last_created_date = null → due today
        $template = RecurringExpense::create([
            'user_id'           => $user->id,
            'category_id'       => $category->id,
            'description'       => 'Daily Coffee',
            'amount'            => 50.00,
            'currency'          => 'THB',
            'frequency'         => 'daily',
            'start_date'        => Carbon::yesterday()->toDateString(),
            'last_created_date' => null,
        ]);

        $this->withToken($token)->getJson('/api/expenses')->assertStatus(200);

        $this->assertTrue(
            Expense::where('recurring_id', $template->id)->exists(),
            'processRecurring() should have created an expense entry for the overdue template'
        );
    }

    // ---------------------------------------------------------------------------
    // REC-06: processRecurring() skips future template
    // ---------------------------------------------------------------------------

    public function test_process_skips_future_template(): void
    {
        [$user, $token] = $this->registerAndGetToken();
        $category       = $this->seedCategory($user);

        // Template with last_created_date = today → next_due = tomorrow (daily)
        $template = RecurringExpense::create([
            'user_id'           => $user->id,
            'category_id'       => $category->id,
            'description'       => 'Daily Skipped',
            'amount'            => 30.00,
            'currency'          => 'THB',
            'frequency'         => 'daily',
            'start_date'        => Carbon::today()->subDay()->toDateString(),
            'last_created_date' => Carbon::today()->toDateString(),
        ]);

        $this->withToken($token)->getJson('/api/expenses')->assertStatus(200);

        $this->assertFalse(
            Expense::where('recurring_id', $template->id)->exists(),
            'processRecurring() should NOT create an entry when next_due is in the future'
        );
    }

    // ---------------------------------------------------------------------------
    // REC-07: processRecurring() creates only one entry (D-03: no backfill)
    // ---------------------------------------------------------------------------

    public function test_process_creates_only_one_entry(): void
    {
        [$user, $token] = $this->registerAndGetToken();
        $category       = $this->seedCategory($user);

        // Template with last_created_date = 60 days ago (monthly) → many missed periods
        $template = RecurringExpense::create([
            'user_id'           => $user->id,
            'category_id'       => $category->id,
            'description'       => 'Monthly Rent',
            'amount'            => 5000.00,
            'currency'          => 'THB',
            'frequency'         => 'monthly',
            'start_date'        => Carbon::today()->subDays(60)->toDateString(),
            'last_created_date' => Carbon::today()->subDays(60)->toDateString(),
        ]);

        // First GET /expenses
        $this->withToken($token)->getJson('/api/expenses')->assertStatus(200);
        $countAfterFirst = Expense::where('recurring_id', $template->id)->count();
        $this->assertEquals(1, $countAfterFirst, 'Should create exactly 1 entry even after 60-day absence (D-03)');

        // Second GET /expenses — no duplicate
        $this->withToken($token)->getJson('/api/expenses')->assertStatus(200);
        $countAfterSecond = Expense::where('recurring_id', $template->id)->count();
        $this->assertEquals(1, $countAfterSecond, 'Should not create a second entry on second call (D-02 deduplication)');
    }

    // ---------------------------------------------------------------------------
    // REC-08: Future start_date not processed
    // ---------------------------------------------------------------------------

    public function test_future_start_date_not_processed(): void
    {
        [$user, $token] = $this->registerAndGetToken();
        $category       = $this->seedCategory($user);

        // Template with start_date = tomorrow → should not be processed yet
        $template = RecurringExpense::create([
            'user_id'           => $user->id,
            'category_id'       => $category->id,
            'description'       => 'Future Expense',
            'amount'            => 100.00,
            'currency'          => 'THB',
            'frequency'         => 'daily',
            'start_date'        => Carbon::tomorrow()->toDateString(),
            'last_created_date' => null,
        ]);

        $this->withToken($token)->getJson('/api/expenses')->assertStatus(200);

        $this->assertEquals(
            0,
            Expense::where('recurring_id', $template->id)->count(),
            'processRecurring() should skip templates with future start_date'
        );
    }

    // ---------------------------------------------------------------------------
    // REC-09: Delete template keeps generated expenses
    // ---------------------------------------------------------------------------

    public function test_delete_template_keeps_expenses(): void
    {
        [$user, $token] = $this->registerAndGetToken();
        $template       = $this->seedRecurring($user);

        // Force-create an expense generated by this template
        $category = $this->seedCategory($user);
        Expense::create([
            'user_id'      => $user->id,
            'category_id'  => $category->id,
            'description'  => 'Generated',
            'amount'       => 150.00,
            'currency'     => 'THB',
            'expense_date' => Carbon::today()->toDateString(),
            'is_recurring' => true,
            'recurring_id' => $template->id,
        ]);

        // Delete the template
        $this->withToken($token)
            ->deleteJson("/api/recurring/{$template->id}")
            ->assertStatus(200);

        // Template should be gone
        $this->assertNull(RecurringExpense::find($template->id));

        // Generated expense should still exist
        $this->assertTrue(
            Expense::where('recurring_id', $template->id)->exists(),
            'Deleting a template should not delete generated expense rows'
        );
    }

    // ---------------------------------------------------------------------------
    // REC-10: Ownership enforced
    // ---------------------------------------------------------------------------

    public function test_ownership_enforced(): void
    {
        [$userA, $tokenA] = $this->registerAndGetToken('userA@example.com');
        [$userB, $tokenB] = $this->registerAndGetToken('userB@example.com');

        // Seed template for userB
        $template = $this->seedRecurring($userB);

        // userA attempts PUT on userB's template → 404
        // Use actingAs to bypass JWT guard caching between two registered users
        $this->actingAs($userA, 'api')
            ->putJson("/api/recurring/{$template->id}", ['amount' => 999])
            ->assertStatus(404);

        // userA attempts DELETE on userB's template → 404
        $this->actingAs($userA, 'api')
            ->deleteJson("/api/recurring/{$template->id}")
            ->assertStatus(404);
    }

    // ---------------------------------------------------------------------------
    // REC-11: Auth gate
    // ---------------------------------------------------------------------------

    public function test_requires_auth(): void
    {
        // All /api/recurring endpoints must return 401 without a valid JWT (T-08-06)
        $this->getJson('/api/recurring')->assertStatus(401);
        $this->postJson('/api/recurring', [])->assertStatus(401);
        $this->putJson('/api/recurring/1', [])->assertStatus(401);
        $this->deleteJson('/api/recurring/1')->assertStatus(401);
    }
}
