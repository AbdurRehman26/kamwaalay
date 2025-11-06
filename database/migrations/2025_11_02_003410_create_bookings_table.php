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
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('service_type', ['maid', 'cook', 'babysitter', 'caregiver', 'cleaner', 'all_rounder']);
            $table->enum('work_type', ['full_time', 'part_time']);
            $table->string('city');
            $table->string('area');
            $table->date('start_date')->nullable();
            $table->time('start_time')->nullable();
            $table->string('name');
            $table->string('phone');
            $table->string('email');
            $table->text('address')->nullable();
            $table->text('special_requirements')->nullable();
            $table->enum('status', ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'])->default('pending');
            $table->text('admin_notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
