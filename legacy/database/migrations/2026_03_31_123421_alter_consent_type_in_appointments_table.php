<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Only alter if 'email' is not already in the consent_type enum
        $columns = DB::select("SHOW COLUMNS FROM appointments WHERE Field = 'consent_type'");
        if (!empty($columns) && !str_contains($columns[0]->Type, 'email')) {
            DB::statement("ALTER TABLE appointments MODIFY consent_type ENUM('otp', 'consent', 'upload', 'skipped', 'email') NULL");
        }
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE appointments MODIFY consent_type ENUM('otp', 'consent', 'upload', 'skipped') NULL");
    }
};
