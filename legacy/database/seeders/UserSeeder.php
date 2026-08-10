<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    /**
     * Seed default Admin and Doctor accounts.
     */
    public function run(): void
    {
        // =============================================
        // 1. SUPER ADMIN ACCOUNT
        // =============================================
        $admin = User::updateOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name'              => 'Super Admin',
                'email'             => 'admin@gmail.com',
                'password'          => Hash::make('Admin@123'),
                'role'              => 'super_admin',
                'status'            => 'active',
                'email_verified_at' => now(),
            ]
        );

        // Assign Spatie 'Super Admin' role
        $superAdminRole = Role::where('name', 'Super Admin')->first();
        if ($superAdminRole && !$admin->hasRole('Super Admin')) {
            $admin->assignRole($superAdminRole);
        }

        // =============================================
        // 2. DOCTOR ACCOUNT
        // =============================================
        $doctor = User::updateOrCreate(
            ['email' => 'doctor@gmail.com'],
            [
                'name'              => 'Doctor',
                'email'             => 'doctor@gmail.com',
                'password'          => Hash::make('Admin@123'),
                'role'              => 'doctor',
                'status'            => 'active',
                'email_verified_at' => now(),
            ]
        );

        // Assign Spatie 'Doctor' role
        $doctorRole = Role::where('name', 'Doctor')->first();
        if ($doctorRole && !$doctor->hasRole('Doctor')) {
            $doctor->assignRole($doctorRole);
        }
    }
}
