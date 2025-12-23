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
        Schema::create('user_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->unsignedBigInteger('token_id')->nullable(); // Sanctum token ID
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('device_type', 50)->nullable(); // mobile, desktop, tablet
            $table->string('browser', 100)->nullable();
            $table->string('browser_version', 50)->nullable();
            $table->string('platform', 100)->nullable(); // OS name
            $table->string('platform_version', 50)->nullable();
            $table->boolean('is_mobile')->default(false);
            $table->string('location')->nullable(); // City/Country from IP (optional)
            $table->timestamp('last_activity')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'last_activity']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_sessions');
    }
};
