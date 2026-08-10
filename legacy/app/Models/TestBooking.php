<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TestBooking extends Model
{
    use HasFactory;

    protected $fillable = [
        'doctor_id',
        'patient_id', 
        'vendor_id',
        'tests',
        'total_amount',
        'payment_method',
        'payment_amount', 
        'payment_date',
        'payment_details',
        'booking_date',
        'booking_time',
        'status',
        'notes',
        'upload_link_token',
        'uploaded_file_path'
    ];

    protected $casts = [
        'tests' => 'array',
        'payment_details' => 'array',
        'total_amount' => 'decimal:2',
        'payment_amount' => 'decimal:2',
        'booking_date' => 'date',
        'payment_date' => 'date'
    ];

    // Relationships
    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function vendor()
    {
        return $this->belongsTo(Vendor::class, 'vendor_id');
    }

    // Remove the tests relationship since we're storing as JSON
    // public function tests()
    // {
    //     return $this->belongsToMany(Test::class, 'test_booking_test');
    // }

    // Accessor for formatted tests
    public function getTestNamesAttribute()
    {
        if ($this->tests && is_array($this->tests)) {
            return collect($this->tests)->pluck('name')->implode(', ');
        }
        return 'N/A';
    }

    // Get test IDs from JSON data
    public function getTestIdsAttribute()
    {
        if ($this->tests && is_array($this->tests)) {
            return collect($this->tests)->pluck('id')->toArray();
        }
        return [];
    }

    // Scope for doctor's bookings
    public function scopeForDoctor($query, $doctorId)
    {
        return $query->where('doctor_id', $doctorId);
    }

    // Get total amount formatted
    public function getFormattedTotalAmountAttribute()
    {
        return '₹' . number_format($this->total_amount, 2);
    }

    // Get payment amount formatted
    public function getFormattedPaymentAmountAttribute()
    {
        return '₹' . number_format($this->payment_amount, 2);
    }

    // Get status with badge class
    public function getStatusBadgeClassAttribute()
    {
        $classes = [
            'pending' => 'badge-pending',
            'in-progress' => 'badge-in-progress', 
            'completed' => 'badge-completed',
            'cancelled' => 'badge-cancelled'
        ];
        
        return $classes[$this->status] ?? 'badge-pending';
    }

    // Get formatted booking datetime
    public function getFormattedBookingDateTimeAttribute()
    {
        if ($this->booking_date) {
            $date = date('d M Y', strtotime($this->booking_date));
            $time = $this->booking_time ? date('h:i A', strtotime($this->booking_time)) : 'N/A';
            return $date . ' - ' . $time;
        }
        return 'N/A';
    }
}