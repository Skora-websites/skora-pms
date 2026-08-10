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
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
           $table->foreignId('doctor_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('patient_id')->nullable()->constrained('users')->onDelete('set null');
            $table->date('date');
            $table->string('time', 30);
            $table->enum('case_type', ['clinical_visit', 'home_visit', 'online_visit', 'on_call_visit'])->default('clinical_visit');
            $table->string('blood_group')->nullable();
            $table->string('bp')->nullable();
            $table->decimal('weight', 5, 2)->nullable();
            $table->decimal('height', 5, 2)->nullable();
            $table->text('remarks')->nullable();
            $table->text('note')->nullable();
            $table->enum('consent_type', ['otp', 'consent', 'upload','skipped'])->nullable();
            $table->string('consent_value')->nullable();
            $table->string('consent_file')->nullable();
           $table->enum('status', ['pending', 'pending_consent', 'confirmed', 'completed', 'cancelled'])->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
