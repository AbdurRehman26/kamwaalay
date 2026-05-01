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
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_system_generated')->default(false)->after('is_active');
        });

        Schema::table('profiles', function (Blueprint $table) {
            $table->boolean('is_system_generated')->default(false)->after('is_active');
        });

        Schema::table('service_listings', function (Blueprint $table) {
            $table->boolean('is_system_generated')->default(false)->after('is_active');
        });

        Schema::table('job_posts', function (Blueprint $table) {
            $table->boolean('is_system_generated')->default(false)->after('admin_notes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_posts', function (Blueprint $table) {
            $table->dropColumn('is_system_generated');
        });

        Schema::table('service_listings', function (Blueprint $table) {
            $table->dropColumn('is_system_generated');
        });

        Schema::table('profiles', function (Blueprint $table) {
            $table->dropColumn('is_system_generated');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_system_generated');
        });
    }
};
