<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Available religion values:
     * - sunni_nazar_niyaz: Sunni (Nazar Niyaz)
     * - sunni_no_nazar_niyaz: Sunni (No Nazar Niyaz)
     * - shia: Shia
     * - christian: Christian
     */
    public function up(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->enum('religion', ['sunni_nazar_niyaz', 'sunni_no_nazar_niyaz', 'shia', 'christian'])->nullable()->after('gender');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->dropColumn('religion');
        });
    }
};
