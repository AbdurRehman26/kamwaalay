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
        // Remove all_rounder, houseboy, and housegirl
        DB::table('service_types')->whereIn('slug', ['all_rounder', 'houseboy', 'housegirl'])->delete();
        
        // Ensure domestic_helper exists
        DB::table('service_types')->updateOrInsert(
            ['slug' => 'domestic_helper'],
            [
                'name' => 'Domestic Helper',
                'icon' => '🏠',
                'sort_order' => 6,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Re-add the removed service types
        $serviceTypes = [
            ['slug' => 'all_rounder', 'name' => 'All Rounder', 'icon' => '🌟', 'sort_order' => 6, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['slug' => 'houseboy', 'name' => 'Houseboy', 'icon' => '🏠', 'sort_order' => 7, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['slug' => 'housegirl', 'name' => 'Housegirl', 'icon' => '🏠', 'sort_order' => 8, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ];
        
        DB::table('service_types')->insertOrIgnore($serviceTypes);
        
        // Remove domestic_helper
        DB::table('service_types')->where('slug', 'domestic_helper')->delete();
    }
};
