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

        // Read Karachi areas from JSON file
        $jsonPath = storage_path('app/data/locations/areas/karachi-locations.json');
        
        if (!File::exists($jsonPath)) {
            $this->command->error('Karachi locations JSON file not found at: ' . $jsonPath);
            return;
        }

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
                if (!isset($areaData['name']) || empty($areaData['name'])) {
                    $skipped++;
                    continue;
                }

                // Create location for this area
                Location::firstOrCreate(
                    [
                        'city_id' => $karachi->id,
                        'area' => $areaData['name'],
                    ],
                    [
                        'city_id' => $karachi->id,
                        'area' => $areaData['name'],
                        'is_active' => true,
                    ]
                );

                $imported++;
            } catch (\Exception $e) {
                $skipped++;
                $this->command->warn('Failed to import area: ' . ($areaData['name'] ?? 'Unknown') . ' - ' . $e->getMessage());
            }
        }

        $this->command->info("Import completed: {$imported} areas imported for Karachi, {$skipped} skipped.");
    }
}
