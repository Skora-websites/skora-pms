<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConsultationLabTest extends Model
{
    protected $fillable = ['consultation_id', 'lab_test_name', 'result', 'note', 'order'];
    
    public function consultation() { return $this->belongsTo(Consultation::class); }
}
