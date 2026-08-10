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
        Schema::create('doctor_schedules', function (Blueprint $table) {
            $table->id();
            
            $table->unsignedBigInteger('doctor_clinic_id');
            $table->enum('day_of_week', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
            $table->string('start_time')->nullable();
            $table->string('end_time')->nullable();
            $table->enum('session_type', ['morning', 'afternoon', 'evening', 'night', 'full_day']);
            $table->integer('max_patients')->default(10);
            $table->boolean('is_24_hours')->default(false);
            $table->string('break_start_time')->nullable();
            $table->string('break_end_time')->nullable();
            $table->integer('duration_hours')->default(0);
            $table->integer('duration_minutes')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->foreign('doctor_clinic_id')
                  ->references('id')
                  ->on('doctor_clinics')
                  ->onDelete('cascade');
            $table->index(['doctor_clinic_id', 'day_of_week']);
            $table->index(['is_active']);
            $table->index(['session_type']);
            $table->index(['is_24_hours']);
            $table->index(['day_of_week']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('doctor_schedules');
    }
};