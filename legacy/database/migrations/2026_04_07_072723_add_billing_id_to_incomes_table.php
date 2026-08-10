<?php
/**
 * NO-OP — the `add_billing_id_to_incomes_table` was superseded
 * by the unified `transactions` table which has billing_id natively.
 */

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void {}
    public function down(): void {}
};
