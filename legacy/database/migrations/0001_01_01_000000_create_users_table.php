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
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reference_role_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('name');
            $table->string('qualification')->nullable();
            $table->string('registration_number')->nullable();
            $table->string('registration_id')->unique()->nullable();
            $table->enum('role', ['admin','super_admin','doctor', 'patient', 'receptionist'])->default('patient'); 
            $table->string('email')->unique()->nullable();
            $table->string('password');
            $table->string('phone')->nullable();
            $table->string('profile_photo_path', 2048)->nullable();
            $table->string('address')->nullable();
            $table->string('gender')->nullable();

            $table->string('referred_by', 200)->nullable();
            $table->string('dob', 50)->nullable();
            $table->integer('pincode')->nullable();
            $table->string('state', 100)->nullable();
            $table->string('city', 100)->nullable();
            $table->string('street_address', 100)->nullable();
            $table->string('latitude')->nullable();
            $table->string('longitude')->nullable();

            $table->string('status')->default('active');
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->foreignId('current_team_id')->nullable();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
