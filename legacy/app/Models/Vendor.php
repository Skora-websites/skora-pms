<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vendor extends Model
{
    use HasFactory;

    protected $fillable = [
        'doctor_id',
        'name',
        'mobile',
        'email',
        'address',
        'status'
    ];

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }
}