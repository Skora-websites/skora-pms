<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            if (!Schema::hasColumn('appointments', 'patient_string')) {
                $table->string('patient_string')->nullable()->after('patient_id');
            }
            if (!Schema::hasColumn('appointments', 'mobile_number')) {
                $table->string('mobile_number')->nullable()->after('consent_file');
            }
            if (!Schema::hasColumn('appointments', 'clinic_id')) {
                $table->unsignedBigInteger('clinic_id')->nullable()->after('status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            if (Schema::hasColumn('appointments', 'patient_string')) $table->dropColumn('patient_string');
            if (Schema::hasColumn('appointments', 'mobile_number')) $table->dropColumn('mobile_number');
            if (Schema::hasColumn('appointments', 'clinic_id')) $table->dropColumn('clinic_id');
        });
    }
};
