<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DoctorSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'doctor_clinic_id',
        'day_of_week',
        'start_time',
        'end_time',
        'session_type',
        'max_patients',
        'is_active',
        'is_24_hours',
        'break_start_time',
        'break_end_time',
        'duration_hours',
        'duration_minutes',
        'slot_duration',
        'gap_duration'
    ];

    protected $casts = [
        'start_time' => 'string',
        'end_time' => 'string',
        'break_start_time' => 'string',
        'break_end_time' => 'string',
        'is_24_hours' => 'boolean',
        'is_active' => 'boolean',
        'duration_hours' => 'integer',
        'duration_minutes' => 'integer'
    ];

    public function clinic()
    {
        return $this->belongsTo(DoctorClinic::class, 'doctor_clinic_id', 'id');
    }

    public function getDayNameAttribute()
    {
        return ucfirst($this->day_of_week);
    }

    public function getTimeSlotAttribute()
    {
        if ($this->is_24_hours) {
            return '24 Hours Open';
        }
        return $this->start_time . ' - ' . $this->end_time;
    }

    public function getSessionTypeNameAttribute()
    {
        $types = [
            'morning' => 'Morning Session',
            'afternoon' => 'Afternoon Session', 
            'evening' => 'Evening Session',
            'night' => 'Night Session',
            'full_day' => 'Full Day Session'
        ];
        return $types[$this->session_type] ?? $this->session_type;
    }

    public function getBreakTimeAttribute()
    {
        if ($this->break_start_time && $this->break_end_time) {
            return $this->break_start_time . ' - ' . $this->break_end_time;
        }
        return 'No Break';
    }

    public function hasBreakTime()
    {
        return !empty($this->break_start_time) && !empty($this->break_end_time);
    }

    public function getTotalDurationAttribute()
    {
        $totalMinutes = ($this->duration_hours * 60) + $this->duration_minutes;
        $hours = floor($totalMinutes / 60);
        $minutes = $totalMinutes % 60;
        
        if ($hours > 0 && $minutes > 0) {
            return "{$hours}h {$minutes}m";
        } elseif ($hours > 0) {
            return "{$hours}h";
        } else {
            return "{$minutes}m";
        }
    }
   

   

}