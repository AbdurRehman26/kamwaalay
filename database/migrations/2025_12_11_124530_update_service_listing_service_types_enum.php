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
        // Check if table exists before modifying
        if (Schema::hasTable('service_listing_service_types')) {
            // MySQL doesn't support ALTER ENUM directly, so we need to modify the column
            // Change the enum to include new values and remove all_rounder
            DB::statement("ALTER TABLE service_listing_service_types MODIFY COLUMN service_type ENUM('maid', 'cook', 'babysitter', 'caregiver', 'cleaner', 'domestic_helper', 'driver', 'security_guard') NOT NULL");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original enum values
        DB::statement("ALTER TABLE service_listing_service_types MODIFY COLUMN service_type ENUM('maid', 'cook', 'babysitter', 'caregiver', 'cleaner', 'all_rounder', 'houseboy', 'housegirl') NOT NULL");
    }
};
