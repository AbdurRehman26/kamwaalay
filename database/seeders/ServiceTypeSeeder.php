<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ServiceType;

class ServiceTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $serviceTypes = [
            ['slug' => 'maid', 'name' => 'Maid', 'icon' => '🧹', 'sort_order' => 1],
            ['slug' => 'cook', 'name' => 'Cook', 'icon' => '👨‍🍳', 'sort_order' => 2],
            ['slug' => 'babysitter', 'name' => 'Babysitter', 'icon' => '👶', 'sort_order' => 3],
            ['slug' => 'caregiver', 'name' => 'Caregiver', 'icon' => '👵', 'sort_order' => 4],
            ['slug' => 'cleaner', 'name' => 'Cleaner', 'icon' => '✨', 'sort_order' => 5],
            ['slug' => 'domestic_helper', 'name' => 'Domestic Helper', 'icon' => '🏠', 'sort_order' => 6],
            ['slug' => 'driver', 'name' => 'Driver', 'icon' => '🚗', 'sort_order' => 7],
            ['slug' => 'security_guard', 'name' => 'Security Guard', 'icon' => '🛡️', 'sort_order' => 8],
        ];

        foreach ($serviceTypes as $serviceType) {
            ServiceType::updateOrCreate(
                ['slug' => $serviceType['slug']],
                $serviceType
            );
        }
    }
}
