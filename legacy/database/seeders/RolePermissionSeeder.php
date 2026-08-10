<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Safely truncate only if data exists
        if (Schema::hasTable('permissions') && Permission::count() > 0) {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            DB::table('role_has_permissions')->truncate();
            DB::table('model_has_roles')->truncate();
            DB::table('model_has_permissions')->truncate();
            Permission::truncate();
            Role::truncate();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        }

        // ─────────────────────────────────────────────────────────────────────
        // Define modules and their sub-permissions
        // Each key = parent module permission (used in @can('module') checks)
        // Each value[] = granular action permissions
        // ─────────────────────────────────────────────────────────────────────
        $modules = [

            // Dashboard
            'dashboard' => [
                'dashboard-view',
                'dashboard-income-view', 
                'dashboard-expense-view',  
                'dashboard-appointments-view',
                'dashboard-billing-view', 
                'dashboard-test-view',    
                'dashboard-home-visit-view',
            ],

            // Schedule
            'schedule' => [
                'schedule-list',
                'schedule-create',
                'schedule-edit',
                'schedule-delete',
            ],

            // Patient Registrations
            'registrations' => [
                'registrations-list',
                'registrations-create',
                'registrations-edit',
                'registrations-delete',
            ],

            // Appointments
            'appointments' => [
                'appointments-list',
                'appointments-create',
                'appointments-edit',
                'appointments-delete',
                'appointments-cancel',
                'appointments-complete',
            ],

            // Transactions (replaces old income-expense module)
            'income-expense' => [
                'income-expense-list',
                'income-expense-create',
                'income-expense-edit',
                'income-expense-delete',
                'income-expense-approve',        // NEW — can approve/unapprove transactions
                'income-expense-export',         // NEW — can export data
            ],

            // Home Visit
            'home-visit' => [
                'home-visit-list',
                'home-visit-create',
                'home-visit-edit',
                'home-visit-delete',
            ],

            // Test Booking
            'test-booking' => [
                'test-booking-list',
                'test-booking-create',
                'test-booking-edit',
                'test-booking-delete',
            ],

            // Billing
            'billing' => [
                'billing-list',
                'billing-create',
                'billing-edit',
                'billing-delete',
                'billing-print',
                'billing-approve',               // NEW — mark bill transaction approved/unapproved
            ],

            // Support
            'support' => [
                'support-view',
            ],

            // Chat
            'chat' => [
                'chat-view',
                'chat-send',
                'chat-delete',
            ],

            // Shop
            'shop' => [
                'shop-view',
            ],

            // Follow Up
            'follow-up' => [
                'follow-up-list',
                'follow-up-status-update',
            ],

            // Roles & Permissions management
            'roles-permissions' => [
                'roles-permissions-view',
                'roles-create',
                'roles-edit',
                'roles-delete',
                'staff-create',
                'staff-edit',
                'staff-delete',
            ],
        ];

        $allPermissions = [];

        foreach ($modules as $moduleName => $subPermissions) {
            // Create parent module permission
            $parentPermission = Permission::create([
                'name'      => $moduleName,
                'parent_id' => null,
                'guard_name'=> 'web',
            ]);
            $allPermissions[] = $parentPermission;

            // Create sub-permissions linked to parent
            foreach ($subPermissions as $subPermissionName) {
                $sub = Permission::create([
                    'name'      => $subPermissionName,
                    'parent_id' => $parentPermission->id,
                    'guard_name'=> 'web',
                ]);
                $allPermissions[] = $sub;
            }
        }

        // ── Roles ─────────────────────────────────────────────────────────────
        $superAdminRole  = Role::create(['name' => 'Super Admin',  'guard_name' => 'web']);
        $doctorRole      = Role::create(['name' => 'Doctor',       'guard_name' => 'web']);
        $receptionistRole= Role::create(['name' => 'Receptionist', 'guard_name' => 'web']);
        $nurseRole       = Role::create(['name' => 'Nurse',        'guard_name' => 'web']);
        $accountantRole  = Role::create(['name' => 'Accountant',   'guard_name' => 'web']);

        // Super Admin gets all permissions
        $superAdminRole->syncPermissions($allPermissions);

        // Doctor: NO role-level permissions (assigned directly to user model from UI)
        $doctorRole->syncPermissions([]);

        // Accountant default: income-expense and billing read access
        $accountantRole->syncPermissions(
            Permission::whereIn('name', [
                'income-expense', 'income-expense-list', 'income-expense-export',
                'billing',        'billing-list',        'billing-print',
            ])->get()
        );

        // Receptionist default: appointments + billing create
        $receptionistRole->syncPermissions(
            Permission::whereIn('name', [
                'appointments',   'appointments-list', 'appointments-create',
                'billing',        'billing-list',      'billing-create',
                'registrations',  'registrations-list','registrations-create',
            ])->get()
        );
    }
}
