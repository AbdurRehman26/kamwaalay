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

        // Try multiple possible file paths (prioritize database/data for git-tracked files)
        $possiblePaths = [
            database_path('data/cities.json'),
            storage_path('app/data/locations/cities.json'),
            storage_path('app/data/cities.json'),
            storage_path('app/private/data/cities.json'),
            base_path('cities.json'),
        ];

        $jsonPath = null;
        foreach ($possiblePaths as $path) {
            if (File::exists($path)) {
                $jsonPath = $path;
                break;
            }
        }
        
        if (!$jsonPath) {
            $this->command->error('Cities JSON file not found. Tried:');
            foreach ($possiblePaths as $path) {
                $this->command->error('  - ' . $path);
            }
            return;
        }

        $this->command->info('Found cities file at: ' . $jsonPath);

        $citiesData = json_decode(File::get($jsonPath), true);

        if (!$citiesData || !is_array($citiesData)) {
            $this->command->error('Invalid JSON data in cities file.');
            return;
        }

        // Filter for Pakistan cities if country code is present
        $pakistanCities = [];
        foreach ($citiesData as $cityData) {
            // If country code exists, filter for Pakistan (PK)
            if (isset($cityData['country'])) {
                if (strtoupper($cityData['country']) === 'PK') {
                    $pakistanCities[] = $cityData;
                }
            } else {
                // If no country code, assume it's Pakistan (backward compatibility)
                $pakistanCities[] = $cityData;
            }
        }

        $this->command->info('Found ' . count($pakistanCities) . ' Pakistan cities out of ' . count($citiesData) . ' total cities.');
        $this->command->info('Importing ' . count($pakistanCities) . ' cities...');

        $imported = 0;
        $skipped = 0;

        foreach ($pakistanCities as $cityData) {
            try {
                if (!isset($cityData['name']) || empty($cityData['name'])) {
                    $skipped++;
                    continue;
                }

                // Extract state from admin1 if available
                $state = $cityData['admin1'] ?? $cityData['state'] ?? null;

                // Create or update city
                $city = City::updateOrCreate(
                    ['name' => $cityData['name']],
                    [
                        'name' => $cityData['name'],
                        'state' => $state,
                        'country_id' => $pakistan->id,
                        'is_active' => true,
                    ]
                );

                // Extract coordinates from different formats
                $latitude = null;
                $longitude = null;

                // Handle new format: lat/lng directly
                if (isset($cityData['lat']) && isset($cityData['lng'])) {
                    $latitude = is_numeric($cityData['lat']) ? (float)$cityData['lat'] : null;
                    $longitude = is_numeric($cityData['lng']) ? (float)$cityData['lng'] : null;
                }
                // Handle old format: geography object
                elseif (isset($cityData['geography']) && isset($cityData['geography']['lat']) && isset($cityData['geography']['lng'])) {
                    $latitude = is_numeric($cityData['geography']['lat']) ? (float)$cityData['geography']['lat'] : null;
                    $longitude = is_numeric($cityData['geography']['lng']) ? (float)$cityData['geography']['lng'] : null;
                }
                // Handle latitude/longitude format
                elseif (isset($cityData['latitude']) && isset($cityData['longitude'])) {
                    $latitude = is_numeric($cityData['latitude']) ? (float)$cityData['latitude'] : null;
                    $longitude = is_numeric($cityData['longitude']) ? (float)$cityData['longitude'] : null;
                }
                // Handle coordinates object
                elseif (isset($cityData['coordinates'])) {
                    $coords = $cityData['coordinates'];
                    $latitude = isset($coords['lat']) && is_numeric($coords['lat']) ? (float)$coords['lat'] : 
                               (isset($coords['latitude']) && is_numeric($coords['latitude']) ? (float)$coords['latitude'] : null);
                    $longitude = isset($coords['lng']) && is_numeric($coords['lng']) ? (float)$coords['lng'] : 
                                (isset($coords['longitude']) && is_numeric($coords['longitude']) ? (float)$coords['longitude'] : null);
                }

                // Create or update location with coordinates
                if ($latitude !== null && $longitude !== null) {
                    Location::updateOrCreate(
                        [
                            'city_id' => $city->id,
                            'area' => null, // City-level location doesn't have an area
                        ],
                        [
                            'city_id' => $city->id,
                            'area' => null,
                            'latitude' => $latitude,
                            'longitude' => $longitude,
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
