<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('user_chat_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('chat_room_id')->constrained('chat_rooms')->cascadeOnDelete();
            $table->boolean('muted')->default(false); // For mute
            $table->timestamp('last_cleared_at')->nullable(); // For clear
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('user_chat_settings');
    }
};