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
     * Returns markTestIncomplete stub until Task 2 provides the model.
     */
    private function seedRecurring(User $user, array $overrides = []): RecurringExpense
    {
        $this->markTestIncomplete('seedRecurring requires RecurringExpense model (Task 2)');
    }

    // ---------------------------------------------------------------------------
    // REC-01: Create template
    // ---------------------------------------------------------------------------

    public function test_store_creates_template(): void
    {
        $this->markTestIncomplete('POST /api/recurring — implement in Task 3');
    }

    // ---------------------------------------------------------------------------
    // REC-02: List templates
    // ---------------------------------------------------------------------------

    public function test_index_returns_templates(): void
    {
        $this->markTestIncomplete('GET /api/recurring — implement in Task 3');
    }

    // ---------------------------------------------------------------------------
    // REC-03: Update template
    // ---------------------------------------------------------------------------

    public function test_update_modifies_template(): void
    {
        $this->markTestIncomplete('PUT /api/recurring/{id} — implement in Task 3');
    }

    // ---------------------------------------------------------------------------
    // REC-04: Delete template
    // ---------------------------------------------------------------------------

    public function test_destroy_removes_template(): void
    {
        $this->markTestIncomplete('DELETE /api/recurring/{id} — implement in Task 3');
    }

    // ---------------------------------------------------------------------------
    // REC-05: processRecurring() creates due entry
    // ---------------------------------------------------------------------------

    public function test_process_creates_due_entry(): void
    {
        $this->markTestIncomplete('processRecurring() auto-creation — implement in Task 3');
    }

    // ---------------------------------------------------------------------------
    // REC-06: processRecurring() skips future template
    // ---------------------------------------------------------------------------

    public function test_process_skips_future_template(): void
    {
        $this->markTestIncomplete('processRecurring() skips future — implement in Task 3');
    }

    // ---------------------------------------------------------------------------
    // REC-07: processRecurring() creates only one entry (D-03: no backfill)
    // ---------------------------------------------------------------------------

    public function test_process_creates_only_one_entry(): void
    {
        $this->markTestIncomplete('processRecurring() one entry per load — implement in Task 3');
    }

    // ---------------------------------------------------------------------------
    // REC-08: Future start_date not processed
    // ---------------------------------------------------------------------------

    public function test_future_start_date_not_processed(): void
    {
        $this->markTestIncomplete('processRecurring() skips future start_date — implement in Task 3');
    }

    // ---------------------------------------------------------------------------
    // REC-09: Delete template keeps generated expenses
    // ---------------------------------------------------------------------------

    public function test_delete_template_keeps_expenses(): void
    {
        $this->markTestIncomplete('DELETE template preserves generated Expense rows — implement in Task 3');
    }

    // ---------------------------------------------------------------------------
    // REC-10: Ownership enforced
    // ---------------------------------------------------------------------------

    public function test_ownership_enforced(): void
    {
        $this->markTestIncomplete('Cross-user ownership guard — implement in Task 3');
    }

    // ---------------------------------------------------------------------------
    // REC-11: Auth gate
    // ---------------------------------------------------------------------------

    public function test_requires_auth(): void
    {
        $this->markTestIncomplete('All /api/recurring endpoints require JWT — implement in Task 3');
    }
}
