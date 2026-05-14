<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recurring_expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
            $table->string('description', 255);
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('THB');
            $table->enum('frequency', ['daily', 'weekly', 'monthly']);
            $table->date('start_date');
            $table->date('last_created_date')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index(['user_id', 'start_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recurring_expenses');
    }
};
