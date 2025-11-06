<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('service_listing_service_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_listing_id')->constrained('service_listings')->onDelete('cascade');
            $table->enum('service_type', ['maid', 'cook', 'babysitter', 'caregiver', 'cleaner', 'all_rounder']);
            $table->timestamps();

            // Ensure unique combination of service_listing_id and service_type
            $table->unique(['service_listing_id', 'service_type'], 'sl_service_types_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_listing_service_types');
    }
};
