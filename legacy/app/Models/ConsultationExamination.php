<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConsultationExamination extends Model
{
    protected $fillable = ['consultation_id', 'examination_name','note', 'order'];
    
    public function consultation() { return $this->belongsTo(Consultation::class); }
}
