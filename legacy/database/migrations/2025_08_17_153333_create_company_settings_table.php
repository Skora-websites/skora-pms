<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('company_settings', function (Blueprint $table) {
            $table->id(); // we will always use id = 1
            $table->string('company_name')->nullable();
            $table->string('company_short_name')->nullable();
            $table->string('company_tagline')->nullable();
            $table->text('company_description')->nullable();

            $table->string('light_logo')->nullable();
            $table->string('dark_logo')->nullable();
            $table->string('favicon')->nullable();

            $table->string('company_email1')->nullable();
            $table->string('company_email2')->nullable();
            $table->string('company_mobile1')->nullable();
            $table->string('company_mobile2')->nullable();
            $table->string('company_whatsapp1')->nullable();
            $table->string('company_whatsapp2')->nullable();

            $table->string('facebook')->nullable();
            $table->string('twitter')->nullable();
            $table->string('linkedin')->nullable();
            $table->string('instagram')->nullable();
            $table->string('pintrest')->nullable();
            $table->string('map')->nullable();

            $table->text('company_address1')->nullable();
            $table->text('company_address2')->nullable();

            $table->string('currency_name')->nullable();
            $table->string('currency_symbol')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_settings');
    }
};
