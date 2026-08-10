<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{


   public function up()
{
    Schema::create('consultation_symptoms', function (Blueprint $table) {
        $table->id();
        $table->foreignId('consultation_id')->constrained()->cascadeOnDelete();
        $table->string('symptom');
        $table->text('note')->nullable();
        $table->timestamps();
    });
}
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consultation_symptoms');
    }
};
