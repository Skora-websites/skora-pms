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
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('trial_ends_at')->nullable()->after('status');
        });

        Schema::table('company_settings', function (Blueprint $table) {
            $table->integer('default_trial_days')->default(15)->after('currency_symbol');
        });

        // Pre-populate setting for existing row (if any)
        \DB::table('company_settings')->where('id', 1)->update(['default_trial_days' => 15]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('trial_ends_at');
        });

        Schema::table('company_settings', function (Blueprint $table) {
            $table->dropColumn('default_trial_days');
        });
    }
};
