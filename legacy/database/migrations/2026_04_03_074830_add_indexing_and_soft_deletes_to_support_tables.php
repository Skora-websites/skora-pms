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
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->index('user_id');
            $table->index('status');
            $table->softDeletes();
        });

        Schema::table('support_ticket_messages', function (Blueprint $table) {
            $table->index('support_ticket_id');
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['status']);
            $table->dropSoftDeletes();
        });

        Schema::table('support_ticket_messages', function (Blueprint $table) {
            $table->dropIndex(['support_ticket_id']);
            $table->dropSoftDeletes();
        });
    }
};
