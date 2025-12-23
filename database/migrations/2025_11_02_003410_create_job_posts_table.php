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
        Schema::create('job_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('city_id')->nullable()->constrained('cities')->nullOnDelete();
            $table->enum('work_type', ['full_time', 'part_time']);
            $table->foreignId('service_type_id')->constrained('service_types')->onDelete('cascade');
            $table->date('start_date')->nullable();
            $table->time('start_time')->nullable();
            $table->string('name');
            $table->string('phone');
            $table->text('address')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->text('special_requirements')->nullable();
            $table->decimal('estimated_salary', 10, 2)->nullable()->after('work_type');
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
        Schema::dropIfExists('job_posts');
    }
};
