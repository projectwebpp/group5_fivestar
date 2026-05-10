<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Food',          'icon' => 'utensils',     'color' => '#FF6B6B'],
            ['name' => 'Transport',     'icon' => 'car',          'color' => '#4ECDC4'],
            ['name' => 'Housing',       'icon' => 'home',         'color' => '#FFE66D'],
            ['name' => 'Education',     'icon' => 'book',         'color' => '#95E1D3'],
            ['name' => 'Health',        'icon' => 'heart',        'color' => '#F38181'],
            ['name' => 'Entertainment', 'icon' => 'gamepad',      'color' => '#AA96DA'],
            ['name' => 'Shopping',      'icon' => 'shopping-bag', 'color' => '#FCBAD3'],
            ['name' => 'Utilities',     'icon' => 'zap',          'color' => '#A8D8EA'],
            ['name' => 'Business',      'icon' => 'briefcase',    'color' => '#C1D82F'],
            ['name' => 'Other',         'icon' => 'gift',         'color' => '#999999'],
        ];

        foreach ($categories as $category) {
            DB::table('categories')->insertOrIgnore(array_merge($category, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }
}
