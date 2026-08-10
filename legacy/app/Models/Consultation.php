<?php

namespace App\Models;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;

class Consultation extends Model {
    use SoftDeletes;
    
    protected $fillable = [
        'patient_id', 'doctor_id', 'appointment_id', 'consultation_date',
        'symptoms_note', 'examination_note', 'diagnosis_note', 'lab_note',
        'medications_note', 'medical_history', 'private_notes', 'medical_records', 'lab_results',
        'additional_info', 'follow_up_date', 'additional_notes',
        'follow_up_status', 'follow_up_comment'
    ];

    protected $casts = [
        'additional_info' => 'array',
    ];

    public function patient() { return $this->belongsTo(User::class, 'patient_id'); }
    public function doctor()  { return $this->belongsTo(User::class, 'doctor_id'); }
    public function appointment() { return $this->belongsTo(Appointment::class); } // agar hai to

    public function symptoms()     { return $this->hasMany(ConsultationSymptom::class); }
    public function examinations() { return $this->hasMany(ConsultationExamination::class); }
    public function diagnoses()    { return $this->hasMany(ConsultationDiagnosis::class); }
    public function labTests()     { return $this->hasMany(ConsultationLabTest::class); }
    public function medications()  { return $this->hasMany(ConsultationMedication::class); }


    public function prescriptionUploads()  { return $this->hasMany(ConsultationPrescriptionUpload::class, 'consultation_id'); }

    public function billingtype() { return $this->hasOne(BillingType::class, 'consultation_id'); }
}
