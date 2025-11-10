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
            $table->dropColumn([
                'photo',
                'service_type',
                'skills',
                'experience_years',
                'city',
                'area',
                'availability',
                'bio',
                'verification_status',
                'police_verified',
                'rating',
                'total_reviews',
                // Note: 'is_active' is kept as it's used for general user status
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('photo')->nullable()->after('address');
            $table->enum('service_type', ['maid', 'cook', 'babysitter', 'caregiver', 'cleaner', 'all_rounder'])->nullable()->after('photo');
            $table->text('skills')->nullable()->after('service_type');
            $table->integer('experience_years')->default(0)->after('skills');
            $table->string('city')->nullable()->after('experience_years');
            $table->string('area')->nullable()->after('city');
            $table->enum('availability', ['full_time', 'part_time', 'available'])->nullable()->after('area');
            $table->text('bio')->nullable()->after('availability');
            $table->enum('verification_status', ['pending', 'verified', 'rejected'])->nullable()->default('pending')->after('bio');
            $table->boolean('police_verified')->default(false)->after('verification_status');
            $table->decimal('rating', 3, 2)->default(0.00)->after('is_active');
            $table->integer('total_reviews')->default(0)->after('rating');
        });
    }
};
