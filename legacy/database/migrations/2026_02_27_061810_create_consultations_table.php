<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('consultations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained()->nullOnDelete();
            $table->dateTime('consultation_date')->default(now());
            $table->text('symptoms_note')->nullable();
            $table->text('examination_note')->nullable();
            $table->text('diagnosis_note')->nullable();
            $table->text('lab_note')->nullable();
            $table->text('medical_history')->nullable();
            $table->text('private_notes')->nullable();
            $table->text('medical_records')->nullable();
            $table->text('lab_results')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['patient_id', 'doctor_id']);
            $table->index('consultation_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consultations');
    }
};
