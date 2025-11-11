<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, copy data from phone_verified_at to email_verified_at if email_verified_at is null
        DB::statement('UPDATE users SET email_verified_at = phone_verified_at WHERE email_verified_at IS NULL AND phone_verified_at IS NOT NULL');
        
        // Rename email_verified_at to verified_at
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('email_verified_at', 'verified_at');
        });
        
        // Drop phone_verified_at column
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('phone_verified_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Rename back to email_verified_at
            $table->renameColumn('verified_at', 'email_verified_at');
            
            // Add phone_verified_at back
            $table->timestamp('phone_verified_at')->nullable()->after('email_verified_at');
        });
    }
};
