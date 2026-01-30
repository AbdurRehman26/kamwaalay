<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Insert service types
        $serviceTypes = [
            ['slug' => 'maid', 'name' => 'Maid', 'icon' => '🧹', 'sort_order' => 1, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['slug' => 'cook', 'name' => 'Cook', 'icon' => '👨‍🍳', 'sort_order' => 2, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['slug' => 'babysitter', 'name' => 'Babysitter', 'icon' => '👶', 'sort_order' => 3, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['slug' => 'caregiver', 'name' => 'Caregiver', 'icon' => '👵', 'sort_order' => 4, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['slug' => 'cleaner', 'name' => 'Cleaner', 'icon' => '✨', 'sort_order' => 5, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['slug' => 'domestic_helper', 'name' => 'Domestic Helper', 'icon' => '🏠', 'sort_order' => 6, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['slug' => 'driver', 'name' => 'Driver', 'icon' => '🚗', 'sort_order' => 7, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['slug' => 'security_guard', 'name' => 'Security Guard', 'icon' => '🛡️', 'sort_order' => 8, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ];

        DB::table('service_types')->insertOrIgnore($serviceTypes);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove service types
        DB::table('service_types')->whereIn('slug', [
            'maid',
            'cook',
            'babysitter',
            'caregiver',
            'cleaner',
            'domestic_helper',
            'driver',
            'security_guard',
        ])->delete();
    }
};
