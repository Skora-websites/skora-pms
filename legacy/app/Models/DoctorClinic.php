<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Session;

class DoctorClinic extends Model
{
    use HasFactory;

    protected $fillable = [
        'doctor_id', 'clinic_name', 'address_type', 'address', 
        'latitude', 'longitude', 'phone', 'consultation_fee', 'clinic_logo'
    ];

    public static function currentClinic()
    {
        $clinicId = Session::get('current_clinic_id');
        
        if ($clinicId) {
            return self::find($clinicId);
        }
        
        // Agar session me nahi hai, to doctor ki first clinic lelo
        if (auth()->check()) {
            $defaultClinic = self::where('doctor_id', auth()->id())->first();
            if ($defaultClinic) {
                self::setCurrentClinic($defaultClinic->id);
                return $defaultClinic;
            }
        }
        
        return null;
    }

    // Current Clinic Set karne ka method
    public static function setCurrentClinic($clinicId)
    {
        Session::put('current_clinic_id', $clinicId);
        Session::save();
    }

    // Check if clinic belongs to current doctor
    public function isOwnedByCurrentDoctor()
    {
        return $this->doctor_id === auth()->id();
    }

    // Get all clinics for current doctor
    public static function getMyClinics()
    {
        return self::where('doctor_id', auth()->id())->get();
    }

    // Switch clinic method
    public static function switchClinic($clinicId)
    {
        $clinic = self::where('id', $clinicId)
                    ->where('doctor_id', auth()->id())
                    ->first();
        
        if ($clinic) {
            self::setCurrentClinic($clinicId);
            return $clinic;
        }
        
        return null;
    }



    protected $casts = [
        'is_active' => 'boolean'
    ];

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }
  
    public function activeSchedules()
    {
        return $this->hasMany(DoctorSchedule::class)->where('is_active', true);
    }

    public function hasScheduleOn($day)
    {
        return $this->schedules()->where('day_of_week', $day)->where('is_active', true)->exists();
    }

      public function schedules()
    {
        return $this->hasMany(DoctorSchedule::class, 'doctor_clinic_id', 'id');
    }

    

}