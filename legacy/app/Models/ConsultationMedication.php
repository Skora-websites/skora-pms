<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConsultationMedication extends Model
{
    use HasFactory;

    protected $fillable = [
        'consultation_id', 'medicine_name', 'dose', 'frequency', 'when_to_take', 'duration', 'note', 'order'
    ];

    public function consultation() { return $this->belongsTo(Consultation::class); }
}