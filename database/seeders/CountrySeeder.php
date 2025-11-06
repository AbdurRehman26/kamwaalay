<?php

namespace Database\Seeders;

use App\Models\Country;
use Illuminate\Database\Seeder;

class CountrySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Pakistan as the default country
        Country::firstOrCreate(
            ['name' => 'Pakistan'],
            [
                'name' => 'Pakistan',
                'code' => 'PK',
                'phone_code' => '+92',
                'is_active' => true,
            ]
        );

        $this->command->info('Default country (Pakistan) created successfully!');
    }
}
