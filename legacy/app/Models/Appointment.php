<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    use HasFactory;

    /**
     * Mass Assignable Fields
     */
    protected $fillable = [
        'doctor_id',
        'patient_id',
        'patient_string',
        'clinic_id',
        'date',
        'time',
        'case_type',
        'blood_group',
        'bp',
        'weight',
        'height',
        'remarks',
        'note',
        'consent_type',
        'mobile_number',
        'consent_value',
        'consent_file',
        'status', 
    ];

    /**
     * Status Constants (Best Practice)
     */
    const STATUS_PENDING   = 'pending';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    /**
     * Relationships
     */
    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    /**
     * Scope for Pending
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Scope for Completed
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    public function consultConsent()
{
    return $this->hasOne(AppointmentConsultConsent::class);
}

}
