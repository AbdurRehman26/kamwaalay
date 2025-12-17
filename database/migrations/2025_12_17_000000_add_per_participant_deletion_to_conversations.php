<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds per-participant deletion tracking to conversations.
     * This allows each user to "delete" a conversation independently,
     * similar to Facebook/WhatsApp behavior where:
     * - User A deletes the chat, but User B still sees it
     * - If User B sends a new message, User A sees only messages from their deletion time onwards
     */
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->timestamp('user_one_deleted_at')->nullable()->after('last_message_at');
            $table->timestamp('user_two_deleted_at')->nullable()->after('user_one_deleted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropColumn(['user_one_deleted_at', 'user_two_deleted_at']);
        });
    }
};
