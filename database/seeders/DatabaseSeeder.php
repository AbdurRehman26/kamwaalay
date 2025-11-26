<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed roles and permissions
        $this->call([
            CountrySeeder::class,
            CitySeeder::class,
            KarachiLocationsSeeder::class,
            RolePermissionSeeder::class,
            UserSeeder::class,
            DummyUsersSeeder::class,
            ServiceRequestsSeeder::class,
            AdditionalDataSeeder::class,
        ]);
    }
}
