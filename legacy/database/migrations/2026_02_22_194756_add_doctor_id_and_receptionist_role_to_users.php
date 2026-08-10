<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'doctor_id')) {
                $table->foreignId('doctor_id')->nullable()->constrained('users')->onDelete('set null');
            }
        });

        // Only alter enum if 'receptionist' is not already in the enum
        // Check current column type
        if (Schema::hasColumn('users', 'role')) {
            $columns = DB::select("SHOW COLUMNS FROM users WHERE Field = 'role'");
            if (!empty($columns) && !str_contains($columns[0]->Type, 'receptionist')) {
                DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','super_admin','doctor','patient','receptionist') DEFAULT 'patient'");
            }
        }
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'doctor_id')) {
                $table->dropForeign(['doctor_id']);
                $table->dropColumn('doctor_id');
            }
        });

        if (Schema::hasColumn('users', 'role')) {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','super_admin','doctor','patient') DEFAULT 'patient'");
        }
    }
};