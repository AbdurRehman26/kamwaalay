<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Migrate service_types JSON data to pivot table
        $listings = DB::table('service_listings')
            ->whereNotNull('service_types')
            ->get();

        foreach ($listings as $listing) {
            $serviceTypes = json_decode($listing->service_types, true);
            
            if (is_array($serviceTypes)) {
                foreach ($serviceTypes as $serviceTypeSlug) {
                    // Find service type by slug
                    $serviceType = DB::table('service_types')
                        ->where('slug', $serviceTypeSlug)
                        ->first();
                    
                    if ($serviceType) {
                        // Insert into pivot table if not exists
                        DB::table('service_listing_service_types')->insertOrIgnore([
                            'service_listing_id' => $listing->id,
                            'service_type_id' => $serviceType->id,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }
        }

        // Migrate locations JSON data to pivot table
        $listingsWithLocations = DB::table('service_listings')
            ->whereNotNull('locations')
            ->get();

        foreach ($listingsWithLocations as $listing) {
            $locationIds = json_decode($listing->locations, true);
            
            if (is_array($locationIds)) {
                foreach ($locationIds as $locationId) {
                    // Verify location exists
                    $location = DB::table('locations')
                        ->where('id', $locationId)
                        ->first();
                    
                    if ($location) {
                        // Insert into pivot table if not exists
                        DB::table('service_listing_locations')->insertOrIgnore([
                            'service_listing_id' => $listing->id,
                            'location_id' => $locationId,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration only migrates data, so nothing to reverse
        // The data will be lost when JSON columns are removed
    }
};
