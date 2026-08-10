<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Jetstream\HasProfilePhoto;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasRoles;
    
    const ROLE_PATIENT = 'patient';
    const ROLE_ADMIN = 'admin';
    const ROLE_SUPER_ADMIN = 'super_admin';



    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory;
    use HasProfilePhoto;
    use Notifiable;
    use TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
   protected $fillable = [
        'role',
        'reference_role_id',
        'registration_id',
        'referred_by',
        'name',
        'email',
        'gender',
        'phone',
        'dob',
        'address',
        'pincode',
        'city',
        'state',
        'street_address',
        'latitude',
        'longitude',
        'email_verified_at',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
        'current_team_id',
        'profile_photo_path',
        'password',
        'status',
        'qualification',
        'registration_number',
        'registration_id',
        'doctor_id',
        'salutation',
        'aadhaar_no',
        'trial_ends_at',
    ];

    /**
     * Get the effective Doctor ID for data queries.
     * Returns own ID for doctors, and reference_role_id for staff/receptionists.
     */
    public function getDoctorIdContext()
    {
        return in_array($this->role, ['receptionist', 'nurse', 'accountant']) 
            ? $this->reference_role_id 
            : $this->id;
    }

    
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'role' => 'string', // Add this
        'trial_ends_at' => 'datetime',
    ];


    
    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_recovery_codes',
        'two_factor_secret',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'profile_photo_url',
        'age',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }


    public function messages() {
    return $this->hasMany(Message::class, 'sender_id');
        }

        public function favorites() {
            return $this->hasMany(Favorite::class);
        }

        public function chatSettings() {
        return $this->hasMany(UserChatSetting::class);
    }

    /**
     * Get the doctor/clinic owner this user (patient or staff) is associated with.
     */
    public function doctor()
    {
        return $this->belongsTo(User::class, 'reference_role_id');
    }



    /**
     * Get the user's age based on DOB.
     */
    public function getAgeAttribute()
    {
        return $this->dob ? \Carbon\Carbon::parse($this->dob)->age : null;
    }

    /**
     * The "booted" method of the model.
     */
    protected static function booted()
    {
        static::created(function ($user) {
            // If the user being created is a doctor
            if ($user->role === 'doctor' || $user->role === 'admin') {
                // Assign the "Doctor" spatie role
                $user->assignRole('Doctor');
                
                // Assign a suite of default "Feature" permissions
                // This ensures the sidebar is not empty upon first login
                $defaultPermissions = [
                    'dashboard', 'dashboard-view',
                    'schedule', 'schedule-list', 'schedule-create', 'schedule-edit', 'schedule-delete',
                    'registrations', 'registrations-list', 'registrations-create', 'registrations-edit', 'registrations-delete',
                    'appointments', 'appointments-list', 'appointments-create', 'appointments-edit', 'appointments-delete', 'appointments-cancel', 'appointments-complete',
                    'income-expense', 'income-expense-list', 'income-expense-create', 'income-expense-edit', 'income-expense-delete',
                    'billing', 'billing-list', 'billing-create', 'billing-edit', 'billing-delete', 'billing-print',
                    'support', 'support-view',
                    'roles-permissions', 'roles-permissions-view',
                    'staff-create', 'staff-edit', 'staff-delete'
                ];
                
                $user->syncPermissions($defaultPermissions);
            }
        });
    }
}




