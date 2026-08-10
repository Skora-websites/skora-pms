<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupportVideo extends Model
{
    use HasFactory;
    
    protected $fillable = ['title', 'description', 'video_type', 'video_url', 'video_path'];
}
