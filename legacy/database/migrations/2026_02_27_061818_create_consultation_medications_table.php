<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

   public function up()
{
    Schema::create('consultation_medications', function (Blueprint $table) {
        $table->id();
        $table->foreignId('consultation_id')->constrained()->cascadeOnDelete();
        $table->string('medicine_name');
        $table->string('dose')->nullable();           // Unit/Dose
        $table->string('frequency')->nullable();
        $table->string('when_to_take')->nullable();   // Before/After food
        $table->string('duration')->nullable();
        $table->text('note')->nullable();
        $table->integer('order')->default(0);
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consultation_medications');
    }
};
