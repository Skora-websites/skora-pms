<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointment_consult_consents', function (Blueprint $table) {
            if (!Schema::hasColumn('appointment_consult_consents', 'is_rejected')) {
                $table->boolean('is_rejected')->default(false)->after('is_accepted');
            }
            if (!Schema::hasColumn('appointment_consult_consents', 'rejected_at')) {
                $table->timestamp('rejected_at')->nullable()->after('is_rejected');
            }
            if (!Schema::hasColumn('appointment_consult_consents', 'consent_file')) {
                $table->string('consent_file')->nullable()->after('rejected_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('appointment_consult_consents', function (Blueprint $table) {
            $cols = [];
            if (Schema::hasColumn('appointment_consult_consents', 'is_rejected')) $cols[] = 'is_rejected';
            if (Schema::hasColumn('appointment_consult_consents', 'rejected_at')) $cols[] = 'rejected_at';
            if (Schema::hasColumn('appointment_consult_consents', 'consent_file')) $cols[] = 'consent_file';
            if (!empty($cols)) $table->dropColumn($cols);
        });
    }
};
