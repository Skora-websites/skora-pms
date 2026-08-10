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
        Schema::table('support_videos', function (Blueprint $table) {
            $table->enum('video_type', ['upload', 'youtube'])->default('upload')->after('description');
            $table->string('video_url')->nullable()->after('video_type');
            $table->string('video_path')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('support_videos', function (Blueprint $table) {
            $table->dropColumn(['video_type', 'video_url']);
            $table->string('video_path')->nullable(false)->change();
        });
    }
};
