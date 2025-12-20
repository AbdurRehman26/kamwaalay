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
        Schema::table('service_listings', function (Blueprint $table) {
            $table->dropColumn(['service_types', 'locations']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('service_listings', function (Blueprint $table) {
            $table->json('service_types')->nullable()->after('profile_id');
            $table->json('locations')->nullable()->after('service_types');
        });
    }
};
