<?php
// app/Models/BillingType.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BillingType extends Model
{
    use HasFactory;

    protected $fillable = [
        'doctor_id', 'name', 'default_amount', 'description', 'is_active'
    ];

    public function doctor()
    {
        return $this->belongsTo(User::class);
    }

    public function billings()
    {
        return $this->hasMany(Billing::class);
    }
}