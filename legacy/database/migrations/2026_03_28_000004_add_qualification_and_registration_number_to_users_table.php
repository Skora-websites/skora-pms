<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'qualification')) {
                $table->string('qualification')->nullable()->after('name');
            }
            if (!Schema::hasColumn('users', 'registration_number')) {
                $table->string('registration_number')->nullable()->after('qualification');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'qualification')) {
                $table->dropColumn('qualification');
            }
            if (Schema::hasColumn('users', 'registration_number')) {
                $table->dropColumn('registration_number');
            }
        });
    }
};
