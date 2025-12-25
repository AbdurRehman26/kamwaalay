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
        Schema::create('service_listings', function (Blueprint $table) {
            $table->id();
            $table->enum('work_type', ['full_time', 'part_time']);
            $table->decimal('monthly_rate', 10, 2)->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('profile_id')->nullable()->constrained('profiles')->onDelete('cascade');
            $table->enum('status', ['active', 'paused', 'closed'])->default('active');
            $table->text('pin_address')->nullable();
            $table->decimal('pin_latitude', 10, 8)->nullable();
            $table->decimal('pin_longitude', 11, 8)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_listings');
    }
};
