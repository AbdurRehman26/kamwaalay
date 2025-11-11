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
            // Check if verified_at exists (new column name) or phone_verified_at (old column name)
            if (Schema::hasColumn('users', 'verified_at')) {
                $table->timestamp('profile_updated_at')->nullable()->after('verified_at');
            } else {
                $table->timestamp('profile_updated_at')->nullable()->after('phone_verified_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('profile_updated_at');
        });
    }
};
