<?php

namespace App\Models;

// use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug'];

    public function blogs(){
        return $this->hasMany(Blog::class);
    }
}
