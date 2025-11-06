<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\Country;
use App\Models\Location;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class CitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get Pakistan (default country with ID 1)
        $pakistan = Country::firstOrCreate(
            ['name' => 'Pakistan'],
            [
                'name' => 'Pakistan',
                'code' => 'PK',
                'phone_code' => '+92',
                'is_active' => true,
            ]
        );

        // Read cities from JSON file
        $jsonPath = storage_path('app/data/locations/cities.json');
        
        if (!File::exists($jsonPath)) {
            $this->command->error('Cities JSON file not found at: ' . $jsonPath);
            return;
        }

        $citiesData = json_decode(File::get($jsonPath), true);

        if (!$citiesData || !is_array($citiesData)) {
            $this->command->error('Invalid JSON data in cities file.');
            return;
        }

        $this->command->info('Importing ' . count($citiesData) . ' cities...');

        $imported = 0;
        $skipped = 0;

        foreach ($citiesData as $cityData) {
            try {
                // Create or update city
                $city = City::firstOrCreate(
                    ['name' => $cityData['name']],
                    [
                        'name' => $cityData['name'],
                        'country_id' => $pakistan->id,
                        'is_active' => true,
                    ]
                );

                // Create or update location (1-1 relationship)
                if (isset($cityData['geography']) && isset($cityData['geography']['lat']) && isset($cityData['geography']['lng'])) {
                    Location::updateOrCreate(
                        ['city_id' => $city->id],
                        [
                            'city_id' => $city->id,
                            'latitude' => $cityData['geography']['lat'],
                            'longitude' => $cityData['geography']['lng'],
                            'is_active' => true,
                        ]
                    );
                }

                $imported++;
            } catch (\Exception $e) {
                $skipped++;
                $this->command->warn('Failed to import city: ' . ($cityData['name'] ?? 'Unknown') . ' - ' . $e->getMessage());
            }
        }

        $this->command->info("Import completed: {$imported} cities imported, {$skipped} skipped.");
    }
}
