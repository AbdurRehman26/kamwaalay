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
        // Migrate skills from profiles to service_listings
        // For each profile with skills, copy the skills to all its service listings
        $profiles = DB::table('profiles')
            ->whereNotNull('skills')
            ->where('skills', '!=', '')
            ->get();

        foreach ($profiles as $profile) {
            // Update all service listings for this profile
            DB::table('service_listings')
                ->where('profile_id', $profile->id)
                ->update(['skills' => $profile->skills]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration only migrates data, so nothing to reverse
        // The data will be lost when skills column is removed from profiles
    }
};
