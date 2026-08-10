<?php
/**
 * Consolidated billings table migration.
 * Includes all columns (original + appointment_id + consultation_id alters),
 * soft deletes, and proper indexing for high-traffic performance.
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billings', function (Blueprint $table) {
            $table->id();

            $table->string('bill_number', 50)->unique();

            $table->foreignId('patient_id')
                  ->constrained('users')
                  ->onDelete('cascade');

            $table->foreignId('doctor_id')
                  ->constrained('users')
                  ->onDelete('cascade');

            $table->foreignId('billing_type_id')
                  ->constrained('billing_types')
                  ->onDelete('cascade');

            // Appointment & consultation links (consolidated from alter migration)
            $table->foreignId('appointment_id')
                  ->nullable()
                  ->constrained('appointments')
                  ->nullOnDelete();

            $table->foreignId('consultation_id')
                  ->nullable()
                  ->constrained('consultations')
                  ->nullOnDelete();

            // Amounts
            $table->decimal('total_amount', 12, 2);
            $table->decimal('received_amount', 12, 2)->default(0);
            $table->decimal('pending_amount', 12, 2)->default(0);

            // Payment
            $table->enum('payment_method', ['upi', 'cash', 'card', 'netbanking'])->nullable();
            $table->json('payment_details')->nullable();

            // Bill status (payment status — not transaction approval status)
            $table->enum('status', ['pending', 'partial', 'paid'])->default('pending');

            $table->text('notes')->nullable();
            $table->date('bill_date');

            $table->softDeletes();
            $table->timestamps();

            // ── Indexes ───────────────────────────────────────────────────────
            $table->index(['doctor_id', 'bill_date'],  'idx_bill_doctor_date');
            $table->index(['patient_id'],              'idx_bill_patient');
            $table->index(['doctor_id', 'status'],     'idx_bill_doctor_status');
            $table->index(['appointment_id'],          'idx_bill_appointment');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billings');
    }
};