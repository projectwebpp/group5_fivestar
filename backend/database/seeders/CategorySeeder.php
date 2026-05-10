<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        // Safety: after Phase 3 migration, categories.user_id is NOT NULL.
        // The seeder is a dev convenience only — AuthController::register() is the production path.
        // Skip silently when no users exist to avoid NOT NULL constraint violation.
        if (\App\Models\User::count() === 0) {
            return;
        }
        // If a developer creates a user first via tinker, the seeder is a no-op.
        // Registration is the canonical seeding path.
    }
}
