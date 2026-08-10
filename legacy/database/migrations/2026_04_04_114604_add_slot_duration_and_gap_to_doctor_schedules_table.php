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
        Schema::table('doctor_schedules', function (Blueprint $table) {
            $table->integer('slot_duration')->nullable()->after('end_time')->comment('Duration in minutes');
            $table->integer('gap_duration')->nullable()->after('slot_duration')->comment('Gap in minutes between slots');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('doctor_schedules', function (Blueprint $table) {
            $table->dropColumn(['slot_duration', 'gap_duration']);
        });
    }
};
