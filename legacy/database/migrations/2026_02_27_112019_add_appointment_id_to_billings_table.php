<?php
/**
 * NO-OP — appointment_id and consultation_id are now baked into
 * the consolidated create_billings_table migration.
 */

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void {}
    public function down(): void {}
};