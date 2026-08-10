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
        Schema::create('medicines', function (Blueprint $table) {
          $table->id();
            $table->string('name'); // e.g., "Levocetirizine 5mg Tablet"
            $table->string('strength')->nullable(); // e.g., "5mg" - for separate strength if needed
            $table->string('form')->default('Tablet')->nullable(); // e.g., "Tablet", "Capsule", "Syrup"
            $table->string('unit')->default('mg')->nullable(); // e.g., "mg", "ml", "tablet"
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medicines');
    }
};
