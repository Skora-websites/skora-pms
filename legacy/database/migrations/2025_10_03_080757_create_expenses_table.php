<?php
/**
 * REPLACED BY: 2025_10_03_080256_create_incomes_table.php (now creates `transactions` table)
 * This file is intentionally a no-op — expenses are now stored in the `transactions` table.
 */

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // Intentionally empty — replaced by unified `transactions` table.
    }

    public function down(): void
    {
        // Nothing to reverse.
    }
};