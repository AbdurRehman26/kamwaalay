<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\Location;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class KarachiLocationsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Find Karachi city
        $karachi = City::where('name', 'Karachi')->first();

        if (!$karachi) {
            $this->command->error('Karachi city not found. Please run CitySeeder first.');
            return;
        }

        // Try multiple possible file paths (prioritize database/data for git-tracked files)
        $possiblePaths = [
            database_path('data/locations/areas/karachi_locations.json'),
            database_path('data/karachi_locations.json'),
            storage_path('app/data/locations/areas/karachi_locations.json'),
            storage_path('app/data/locations/areas/karachi-locations.json'),
            storage_path('app/private/data/karachi_locations.json'),
            base_path('karachi_locations.json'),
        ];

        $jsonPath = null;
        foreach ($possiblePaths as $path) {
            if (File::exists($path)) {
                $jsonPath = $path;
                break;
            }
        }
        
        if (!$jsonPath) {
            $this->command->error('Karachi locations JSON file not found. Tried:');
            foreach ($possiblePaths as $path) {
                $this->command->error('  - ' . $path);
            }
            return;
        }

        $this->command->info('Found Karachi locations file at: ' . $jsonPath);

        $areasData = json_decode(File::get($jsonPath), true);

        if (!$areasData || !is_array($areasData)) {
            $this->command->error('Invalid JSON data in Karachi locations file.');
            return;
        }

        $this->command->info('Importing ' . count($areasData) . ' areas for Karachi...');

        $imported = 0;
        $skipped = 0;

        foreach ($areasData as $areaData) {
            try {
                // Handle different JSON structures
                $areaName = $areaData['name'] ?? $areaData['area'] ?? $areaData['location'] ?? null;
                
                if (empty($areaName)) {
                    $skipped++;
                    $this->command->warn('Skipping entry with no name/area/location field');
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
                        'city_id' => $karachi->id,
                        'area' => $areaName,
                    ],
                    [
                        'city_id' => $karachi->id,
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
                $this->command->warn('Failed to import area: ' . ($areaName ?? 'Unknown') . ' - ' . $e->getMessage());
            }
        }

        $this->command->info("Import completed: {$imported} areas imported for Karachi, {$skipped} skipped.");
    }
}
