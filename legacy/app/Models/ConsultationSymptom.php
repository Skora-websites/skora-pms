<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConsultationSymptom extends Model {

    protected $fillable = ['consultation_id', 'symptom', 'note', 'order'];
    
    public function consultation() { return $this->belongsTo(Consultation::class); }
}