<?php
// app/Models/Billing.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Billing extends Model
{
    use HasFactory;

    protected $fillable = [
        'bill_number', 'patient_id', 'doctor_id', 'billing_type_id',
        'total_amount', 'received_amount', 'pending_amount', 'payment_method',
        'payment_details', 'status', 'notes', 'bill_date','appointment_id','consultation_id'
    ];

    protected $casts = [
        'payment_details' => 'array',
        'bill_date' => 'date'
    ];

    public function patient()
    {
        return $this->belongsTo(User::class);
    }

    public function doctor()
    {
        return $this->belongsTo(User::class);
    }

    public function billingType()
    {
        return $this->belongsTo(BillingType::class);
    }

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($billing) {
            $billing->bill_number = 'BILL-' . date('Ymd') . '-' . str_pad(static::count() + 1, 4, '0', STR_PAD_LEFT);
        });
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    public function consultation()
    {
        return $this->belongsTo(Consultation::class);
    }

}