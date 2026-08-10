<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('consultation_prescription_uploads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consultation_id')->nullable()->constrained('consultations')->nullOnDelete(); // Link to main consultation (nullable if direct upload)
            $table->foreignId('patient_id')->constrained('users')->cascadeOnDelete(); // Always required for patient association
            $table->foreignId('doctor_id')->constrained('users')->cascadeOnDelete(); // Doctor who uploaded
            $table->string('file_path'); // Path to uploaded file (e.g., 'uploads/prescriptions/abc.pdf')
            $table->string('file_type')->nullable(); // e.g., 'image', 'pdf' for filtering
            $table->text('notes')->nullable(); // Additional notes for this upload
            $table->timestamps();
            $table->softDeletes();

            // Indexes for faster queries (e.g., by patient/doctor)
            $table->index(['patient_id', 'doctor_id']);
            $table->index('consultation_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('consultation_prescription_uploads');
    }
};