<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DoctorConsultPdf extends Model
{
    protected $fillable = ['doctor_id', 'pdf_path'];

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }
}