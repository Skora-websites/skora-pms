<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;


return new class extends Migration {
    public function up(): void {
        Schema::create('chat_rooms', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type')->default('group');
            $table->timestamps();
        });

        // Seed default room
        \DB::table('chat_rooms')->insert(['name' => 'Doctors Group', 'type' => 'group']);
    }

    public function down(): void {
        Schema::dropIfExists('chat_rooms');
    }
};