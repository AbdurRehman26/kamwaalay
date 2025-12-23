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
        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            $table->morphs('profileable'); // Creates profileable_type and profileable_id
            $table->string('photo')->nullable();
            $table->integer('age')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->enum('religion', ['sunni_nazar_niyaz', 'sunni_no_nazar_niyaz', 'shia', 'christian'])->nullable();
            $table->text('skills')->nullable();
            $table->integer('experience_years')->default(0);
            $table->string('city')->nullable();
            $table->enum('availability', ['full_time', 'part_time', 'available'])->nullable();
            $table->text('bio')->nullable();
            $table->enum('verification_status', ['pending', 'verified', 'rejected'])->nullable()->default('pending');
            $table->boolean('police_verified')->default(false);
            $table->boolean('is_active')->default(true);
            $table->decimal('rating', 3, 2)->default(0.00);
            $table->integer('total_reviews')->default(0);
            $table->timestamps();

            // Ensure one profile per profileable
            $table->unique(['profileable_type', 'profileable_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};
