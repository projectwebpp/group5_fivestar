<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->after('id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->dropUnique('categories_name_unique');
            $table->unique(['user_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            // 1. Drop composite unique before touching the FK column
            $table->dropUnique(['user_id', 'name']);
            // 2. Drop the FK
            $table->dropForeign(['user_id']);
            // 3. Drop the column
            $table->dropColumn('user_id');
            // 4. Re-adding single-column unique('name') is intentionally omitted:
            //    after Phase 3 data exists, duplicate names across users make this
            //    unsafe. This rollback is a destructive dev-only operation.
            // $table->unique('name');
        });
    }
};
