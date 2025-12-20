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
            $table->text('pin_address')->nullable()->after('description');
            $table->decimal('pin_latitude', 10, 8)->nullable()->after('pin_address');
            $table->decimal('pin_longitude', 11, 8)->nullable()->after('pin_latitude');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('service_listings', function (Blueprint $table) {
            $table->dropColumn(['pin_address', 'pin_latitude', 'pin_longitude']);
        });
    }
};
