<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\Location;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class LocationsSeeder extends Seeder
{
    /**
     * Cities configuration with their coordinates
     */
    protected $cities = [
        'Karachi' => ['lat' => 24.8607, 'lng' => 67.0011],
        'Islamabad' => ['lat' => 33.6844, 'lng' => 73.0479],
        'Lahore' => ['lat' => 31.5204, 'lng' => 74.3587],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach ($this->cities as $cityName => $coords) {
            $this->seedCityLocations($cityName, $coords);
        }
    }

    protected function seedCityLocations(string $cityName, array $coords): void
    {
        $this->command->info("Processing {$cityName}...");

        // Find or create city (CitySeeder should ideally run first, but this is safe)
        $city = City::where('name', $cityName)->first();

        if (!$city) {
            $this->command->warn("City {$cityName} not found. Skipping.");
            return;
        }

        // Update city coordinates
        $city->update([
            'latitude' => $coords['lat'],
            'longitude' => $coords['lng'],
            'is_active' => true,
        ]);
        
        $this->command->info("Updated coordinates for {$cityName}.");

        // Determine file name
        $fileName = Str::lower($cityName) . '_locations.json';
        
        // Try multiple possible file paths
        $possiblePaths = [
            database_path("data/locations/areas/{$fileName}"),
            database_path("data/{$fileName}"),
            storage_path("app/data/locations/areas/{$fileName}"),
            base_path($fileName),
        ];

        $jsonPath = null;
        foreach ($possiblePaths as $path) {
            if (File::exists($path)) {
                $jsonPath = $path;
                break;
            }
        }
        
        if (!$jsonPath) {
            $this->command->warn("Locations file not found for {$cityName}. Expected: {$fileName}");
            return;
        }

        $this->command->info("Found locations file: {$jsonPath}");

        $areasData = json_decode(File::get($jsonPath), true);

        if (!$areasData || !is_array($areasData)) {
            $this->command->error("Invalid JSON data in {$fileName}.");
            return;
        }

        $this->command->info('Importing ' . count($areasData) . " areas for {$cityName}...");

        $imported = 0;
        $skipped = 0;

        foreach ($areasData as $areaData) {
            try {
                // Handle different JSON structures (name, area, location)
                $areaName = $areaData['name'] ?? $areaData['area'] ?? $areaData['location'] ?? null;
                
                if (empty($areaName)) {
                    $skipped++;
                    continue;
                }

                // Extract coordinates if available
                $latitude = null;
                $longitude = null;
                
                // Handle different coordinate formats
                if (isset($areaData['latitude']) && isset($areaData['longitude'])) {
                    $latitude = $areaData['latitude'];
                    $longitude = $areaData['longitude'];
                } elseif (isset($areaData['lat']) && isset($areaData['lng'])) {
                    $latitude = $areaData['lat'];
                    $longitude = $areaData['lng'];
                } elseif (isset($areaData['coordinates'])) {
                    $coords = $areaData['coordinates'];
                    $latitude = $coords['lat'] ?? $coords['latitude'] ?? null;
                    $longitude = $coords['lng'] ?? $coords['longitude'] ?? null;
                } elseif (isset($areaData['geography'])) {
                    $geo = $areaData['geography'];
                    $latitude = $geo['lat'] ?? $geo['latitude'] ?? null;
                    $longitude = $geo['lng'] ?? $geo['longitude'] ?? null;
                }

                // Create location for this area
                Location::updateOrCreate(
                    [
                        'city_id' => $city->id,
                        'area' => $areaName,
                    ],
                    [
                        'city_id' => $city->id,
                        'area' => $areaName,
                        'latitude' => $latitude,
                        'longitude' => $longitude,
                        'address' => $areaData['address'] ?? null,
                        'is_active' => true,
                    ]
                );

                $imported++;
            } catch (\Exception $e) {
                $skipped++;
                // $this->command->warn("Failed to import area: {$areaName}");
            }
        }

        $this->command->info("Completed {$cityName}: {$imported} imported, {$skipped} skipped.");
    }
}
