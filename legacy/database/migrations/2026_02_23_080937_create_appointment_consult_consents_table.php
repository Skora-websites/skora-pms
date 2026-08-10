<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('appointment_consult_consents', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('appointment_id')->unique()->nullable();
            $table->unsignedBigInteger('doctor_id');
            $table->unsignedBigInteger('patient_id');

            $table->string('slug')->unique();

            $table->boolean('is_accepted')->default(false);
            $table->timestamp('accepted_at')->nullable();

            $table->enum('status', [
                'pending',
                'pending_consent',
                'confirmed',
                'completed',
                'cancelled'
            ])->default('pending');

            $table->timestamps();

            $table->foreign('appointment_id')
                ->references('id')
                ->on('appointments')
                ->onDelete('cascade');

            $table->foreign('doctor_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table->foreign('patient_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('appointment_consult_consents');
    }
};