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
        Schema::create('service_types', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique(); // e.g., 'maid', 'cook', etc.
            $table->string('name'); // e.g., 'Maid', 'Cook', etc.
            $table->string('icon')->nullable(); // Emoji or icon identifier
            $table->integer('sort_order')->default(0); // For ordering
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_types');
    }
};
