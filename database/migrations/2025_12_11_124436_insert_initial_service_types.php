<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

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

        // Insert languages (if languages table exists)
        if (Schema::hasTable('languages')) {
            $languages = [
                ['name' => 'English', 'code' => 'en', 'sort_order' => 1, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['name' => 'Urdu', 'code' => 'ur', 'sort_order' => 2, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['name' => 'Punjabi', 'code' => 'pa', 'sort_order' => 3, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['name' => 'Sindhi', 'code' => 'sd', 'sort_order' => 4, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['name' => 'Pashto', 'code' => 'ps', 'sort_order' => 5, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['name' => 'Balochi', 'code' => 'bal', 'sort_order' => 6, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ];

            DB::table('languages')->insertOrIgnore($languages);
        }
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

        // Remove languages (if languages table exists)
        if (Schema::hasTable('languages')) {
            DB::table('languages')->whereIn('code', [
                'en',
                'ur',
                'pa',
                'sd',
                'ps',
                'bal',
            ])->delete();
        }
    }
};
