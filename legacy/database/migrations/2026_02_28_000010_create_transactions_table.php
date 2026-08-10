<?php
/**
 * REPLACES: create_incomes_table + create_expenses_table
 * Unified transactions table for all monetary flows (income & expense).
 * Soft deletes + comprehensive indexing for high-traffic performance.
 */

use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();

            // Doctor (owner of the transaction)
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');

            // type: 1 = Income, 2 = Expense  (TransactionType enum)
            $table->tinyInteger('type')->unsigned();

            // Category pointers — only one is populated depending on type
            $table->foreignId('income_type_id')
                  ->nullable()
                  ->constrained('income_types')
                  ->onDelete('set null');

            $table->foreignId('expense_type_id')
                  ->nullable()
                  ->constrained('expense_types')
                  ->onDelete('set null');

            // Financial fields
            $table->decimal('amount', 12, 2);
            $table->date('date');

            // Status: approved | unapproved | pending  (TransactionStatus enum)
            // Only "approved" rows count in dashboard totals.
            $table->enum('status', ['approved', 'unapproved', 'pending'])
                  ->default('approved');

            // Billing link — when a bill generates income automatically
            $table->foreignId('billing_id')
                  ->nullable()
                  ->constrained('billings')
                  ->onDelete('cascade');   // deleting a bill removes its income automatically

            $table->string('reference_number', 100)->nullable();   // bill number / cheque no
            $table->string('payment_method', 50)->nullable();
            $table->text('description')->nullable();               // notes / subcategory label
            $table->string('created_by', 150);                     // auth user name snapshot
            $table->string('file_path')->nullable();               // receipt / proof file

            $table->softDeletes();
            $table->timestamps();

            // ── Indexes for fast queries ──────────────────────────────────────
            $table->index(['user_id', 'type'],            'idx_tx_user_type');
            $table->index(['user_id', 'date'],            'idx_tx_user_date');
            $table->index(['user_id', 'status'],          'idx_tx_user_status');
            $table->index(['billing_id'],                 'idx_tx_billing');
            // Composite: dashboard aggregation  (type + status + user)
            $table->index(['type', 'status', 'user_id'], 'idx_tx_type_status_user');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};