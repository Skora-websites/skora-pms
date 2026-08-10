<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_room_id')
                  ->nullable()
                  ->constrained('chat_rooms')
                  ->cascadeOnDelete();

            $table->foreignId('sender_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->text('content');

            $table->foreignId('doctor_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->timestamp('timestamp')->index();

            $table->softDeletes();
            $table->timestamps();
        });

        DB::statement('ALTER TABLE messages ADD FULLTEXT(content)');
    }

    public function down(): void {
        Schema::dropIfExists('messages');
    }
};
