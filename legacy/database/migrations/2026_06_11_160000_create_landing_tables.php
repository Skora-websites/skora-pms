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
        Schema::create('landing_sections', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->string('key')->unique();
            $blueprint->string('name');
            $blueprint->string('title')->nullable();
            $blueprint->text('subtitle')->nullable();
            $blueprint->boolean('is_active')->default(true);
            $blueprint->json('metadata')->nullable();
            $blueprint->timestamps();
        });

        Schema::create('landing_items', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->string('section_key');
            $blueprint->string('title')->nullable();
            $blueprint->text('description')->nullable();
            $blueprint->string('image')->nullable();
            $blueprint->string('icon')->nullable();
            $blueprint->string('badge')->nullable();
            $blueprint->string('link')->nullable();
            $blueprint->string('link_text')->nullable();
            $blueprint->decimal('price_monthly', 10, 2)->nullable();
            $blueprint->decimal('price_yearly', 10, 2)->nullable();
            $blueprint->decimal('price_original_monthly', 10, 2)->nullable();
            $blueprint->decimal('price_original_yearly', 10, 2)->nullable();
            $blueprint->json('features')->nullable();
            $blueprint->integer('stars')->nullable();
            $blueprint->integer('order')->default(0);
            $blueprint->boolean('is_active')->default(true);
            $blueprint->timestamps();

            $blueprint->foreign('section_key')->references('key')->on('landing_sections')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('landing_items');
        Schema::dropIfExists('landing_sections');
    }
};
