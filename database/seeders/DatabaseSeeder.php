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
        $this->call([
            CountrySeeder::class,
            CitySeeder::class,
            RolePermissionSeeder::class,
            UserSeeder::class,
            LanguageSeeder::class,
            ServiceTypeSeeder::class,
        ]);

        if (config('features.demo_seeders')) {
            $this->call([
                DummyUsersSeeder::class,
                ServiceRequestsSeeder::class,
                AdditionalDataSeeder::class,
            ]);
        }
    }
}
