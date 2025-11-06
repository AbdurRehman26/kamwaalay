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
        Schema::create('service_listing_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_listing_id')->constrained('service_listings')->onDelete('cascade');
            $table->string('city');
            $table->string('area');
            $table->timestamps();

            // Ensure unique combination of service_listing_id, city, and area
            $table->unique(['service_listing_id', 'city', 'area'], 'sl_locations_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_listing_locations');
    }
};
