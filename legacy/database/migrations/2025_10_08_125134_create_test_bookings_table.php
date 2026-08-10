<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('test_bookings', function (Blueprint $table) {
            $table->id();
            
            // Foreign keys
            $table->foreignId('doctor_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('patient_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('vendor_id')->constrained('vendors')->onDelete('cascade');
            
            // Booking details
            $table->dateTime('booking_date')->default(DB::raw('CURRENT_TIMESTAMP'));

            $table->time('booking_time')->nullable();
            $table->json('tests'); // Store test details as JSON
            
            // Payment details
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->string('payment_method')->nullable();
            $table->decimal('payment_amount', 10, 2)->default(0);
            $table->date('payment_date')->nullable();
            $table->json('payment_details')->nullable();
            
            // Status
            $table->enum('status', ['pending', 'in-progress', 'completed', 'cancelled'])->default('pending');
            $table->text('notes')->nullable();
            
            $table->timestamps();
        });

        // Pivot table for many-to-many relationship with tests (optional)
        Schema::create('test_booking_test', function (Blueprint $table) {
            $table->id();
            $table->foreignId('test_booking_id')->constrained('test_bookings')->onDelete('cascade');
            $table->foreignId('test_id')->constrained('tests')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('test_booking_test');
        Schema::dropIfExists('test_bookings');
    }
};