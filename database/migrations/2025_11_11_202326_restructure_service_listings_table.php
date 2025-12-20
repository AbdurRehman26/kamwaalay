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
        // Modify service_listings table - add new columns first
        Schema::table('service_listings', function (Blueprint $table) {
            // Add new columns
            $table->foreignId('profile_id')->nullable()->after('id')->constrained('profiles')->onDelete('cascade');
            $table->json('service_types')->nullable()->after('profile_id');
            $table->json('locations')->nullable()->after('service_types');
        });

        // Migrate existing data if any
        // Get all service listings with their service types and locations
        $listings = DB::table('service_listings')->get();

        foreach ($listings as $listing) {
            // Get user's profile, create if doesn't exist
            $profile = DB::table('profiles')
                ->where('profileable_id', $listing->user_id)
                ->where('profileable_type', 'App\Models\User')
                ->first();

            if (!$profile) {
                // Create profile for user
                $profileId = DB::table('profiles')->insertGetId([
                    'profileable_id' => $listing->user_id,
                    'profileable_type' => 'App\Models\User',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $profile = (object)['id' => $profileId];
            }

            // Get service types
            $serviceTypes = DB::table('service_listing_service_types')
                ->where('service_listing_id', $listing->id)
                ->pluck('service_type')
                ->toArray();

            // Get locations (as location IDs - we'll need to find them)
            $serviceLocations = DB::table('service_listing_locations')
                ->where('service_listing_id', $listing->id)
                ->get();

            $locationIds = [];
            foreach ($serviceLocations as $sl) {
                // Find location by city and area
                $location = DB::table('locations')
                    ->join('cities', 'locations.city_id', '=', 'cities.id')
                    ->where('cities.name', $sl->city)
                    ->where('locations.area', $sl->area)
                    ->select('locations.id')
                    ->first();

                if ($location) {
                    $locationIds[] = $location->id;
                }
            }

            // Update the listing with profile_id and JSON data
            DB::table('service_listings')
                ->where('id', $listing->id)
                ->update([
                    'profile_id' => $profile->id,
                    'service_types' => json_encode($serviceTypes),
                    'locations' => json_encode($locationIds),
                ]);
        }

        // Now drop user_id and make profile_id required (not unique - multiple listings per profile allowed)
        Schema::table('service_listings', function (Blueprint $table) {
            // Drop user_id (after data migration)
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');

            // Make profile_id required (not nullable) - no unique constraint
            $table->foreignId('profile_id')->nullable(false)->change();
        });

        // Drop pivot tables
        Schema::dropIfExists('service_listing_service_types');
        Schema::dropIfExists('service_listing_locations');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate pivot tables
        Schema::create('service_listing_service_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_listing_id')->constrained('service_listings')->onDelete('cascade');
            $table->enum('service_type', ['maid', 'cook', 'babysitter', 'caregiver', 'cleaner', 'all_rounder']);
            $table->timestamps();
            $table->unique(['service_listing_id', 'service_type'], 'sl_service_types_unique');
        });

        Schema::create('service_listing_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_listing_id')->constrained('service_listings')->onDelete('cascade');
            $table->string('city');
            $table->string('area');
            $table->timestamps();
            $table->unique(['service_listing_id', 'city', 'area'], 'sl_locations_unique');
        });

        // Migrate data back to pivot tables
        $listings = DB::table('service_listings')->get();

        foreach ($listings as $listing) {
            // Get profile to find user_id
            $profile = DB::table('profiles')->where('id', $listing->profile_id)->first();
            $userId = $profile ? $profile->profileable_id : null;

            // Decode service types
            $serviceTypes = json_decode($listing->service_types ?? '[]', true);
            foreach ($serviceTypes as $serviceType) {
                DB::table('service_listing_service_types')->insert([
                    'service_listing_id' => $listing->id,
                    'service_type' => $serviceType,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Decode locations
            $locationIds = json_decode($listing->locations ?? '[]', true);
            foreach ($locationIds as $locationId) {
                $location = DB::table('locations')
                    ->join('cities', 'locations.city_id', '=', 'cities.id')
                    ->where('locations.id', $locationId)
                    ->select('cities.name as city', 'locations.area')
                    ->first();

                if ($location) {
                    DB::table('service_listing_locations')->insert([
                        'service_listing_id' => $listing->id,
                        'city' => $location->city,
                        'area' => $location->area ?? '',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        // Modify service_listings table back
        Schema::table('service_listings', function (Blueprint $table) {
            // Add user_id back
            $table->foreignId('user_id')->after('id')->constrained()->onDelete('cascade');

            // Drop new columns
            $table->dropForeign(['profile_id']);
            $table->dropColumn(['profile_id', 'service_types', 'locations']);
        });
    }
};
