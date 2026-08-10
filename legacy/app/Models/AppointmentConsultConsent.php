<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppointmentConsultConsent extends Model
{
    protected $fillable = [
        'appointment_id', 'doctor_id', 'patient_id', 'slug', 'is_accepted', 'accepted_at',
        'is_rejected', 'rejected_at', 'consent_file'
    ];

    protected $casts = [
        'is_accepted' => 'boolean',
        'is_rejected' => 'boolean',
        'accepted_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }
}