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
        // SQLite doesn't support MODIFY COLUMN, so we need to handle it differently
        if (DB::getDriverName() === 'sqlite') {
            // For SQLite, we need to recreate the table with the new enum values
            // First, update existing records
            DB::table('documents')
                ->where('document_type', 'aadhaar')
                ->update(['document_type' => 'other']);
            
            // For SQLite, drop and recreate the table with new enum values
            // SQLite enforces CHECK constraints, so we need to recreate the table
            DB::statement('CREATE TABLE documents_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                document_type TEXT NOT NULL CHECK(document_type IN (\'police_verification\', \'nic\', \'other\')) DEFAULT \'other\',
                document_number TEXT,
                file_path TEXT NOT NULL,
                status TEXT NOT NULL CHECK(status IN (\'pending\', \'verified\', \'rejected\')) DEFAULT \'pending\',
                admin_notes TEXT,
                created_at DATETIME,
                updated_at DATETIME,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )');
            
            DB::statement('INSERT INTO documents_new SELECT * FROM documents');
            DB::statement('DROP TABLE documents');
            DB::statement('ALTER TABLE documents_new RENAME TO documents');
        } else {
            // For MySQL/MariaDB, use MODIFY COLUMN
            DB::statement("ALTER TABLE documents MODIFY COLUMN document_type ENUM('police_verification', 'nic', 'other') DEFAULT 'other'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            // SQLite doesn't need to reverse this
            DB::table('documents')
                ->where('document_type', 'nic')
                ->update(['document_type' => 'other']);
        } else {
            // For MySQL/MariaDB, revert the enum
            DB::statement("ALTER TABLE documents MODIFY COLUMN document_type ENUM('police_verification', 'other') DEFAULT 'other'");
        }
    }
};
