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
            // Helper-specific fields (nullable, only populated for users with helper role)
            $table->string('photo')->nullable()->after('address');
            $table->enum('service_type', ['maid', 'cook', 'babysitter', 'caregiver', 'cleaner', 'all_rounder'])->nullable()->after('photo');
            $table->text('skills')->nullable()->after('service_type');
            $table->integer('experience_years')->default(0)->after('skills');
            $table->string('city')->nullable()->after('experience_years');
            $table->string('area')->nullable()->after('city');
            $table->enum('availability', ['full_time', 'part_time', 'available'])->nullable()->after('area');
            $table->decimal('hourly_rate', 8, 2)->nullable()->after('availability');
            $table->text('bio')->nullable()->after('hourly_rate');
            $table->enum('verification_status', ['pending', 'verified', 'rejected'])->nullable()->default('pending')->after('bio');
            $table->boolean('police_verified')->default(false)->after('verification_status');
            $table->boolean('is_active')->default(true)->after('police_verified');
            $table->decimal('rating', 3, 2)->default(0.00)->after('is_active');
            $table->integer('total_reviews')->default(0)->after('rating');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'photo',
                'service_type',
                'skills',
                'experience_years',
                'city',
                'area',
                'availability',
                'hourly_rate',
                'bio',
                'verification_status',
                'police_verified',
                'is_active',
                'rating',
                'total_reviews',
            ]);
        });
    }
};
