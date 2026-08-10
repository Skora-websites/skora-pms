<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'latitude')) {
                $table->string('latitude')->nullable()->after('street_address');
            }
            if (!Schema::hasColumn('users', 'longitude')) {
                $table->string('longitude')->nullable()->after('latitude');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $cols = [];
            if (Schema::hasColumn('users', 'latitude')) $cols[] = 'latitude';
            if (Schema::hasColumn('users', 'longitude')) $cols[] = 'longitude';
            if (!empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};
