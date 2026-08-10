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
        Schema::create('doctor_clinics', function (Blueprint $table) {
            $table->id();
            
            // Doctor reference
            $table->unsignedBigInteger('doctor_id');
            
            // Clinic basic info
            $table->string('clinic_name');
            $table->enum('address_type', ['manual', 'map'])->default('manual');
            $table->text('address');
            $table->string('latitude')->nullable();
            $table->string('longitude')->nullable();
            $table->string('phone');
            $table->decimal('consultation_fee', 8, 2)->nullable();
            $table->string('clinic_logo')->nullable();
            
            // Status
            $table->boolean('is_active')->default(true);
            
            // Timestamps
            $table->timestamps();

            // Foreign key constraint
            $table->foreign('doctor_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade');

            // Indexes for better performance
            $table->index(['doctor_id', 'is_active']);
            $table->index(['address_type']);
            $table->index(['clinic_name']);
            $table->index(['is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('doctor_clinics');
    }
};









