<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleController extends Controller
{
    // Module icons mapping for the UI
    private $moduleIcons = [
        'dashboard' => 'layout-dashboard',
        'schedule' => 'calendar-time',
        'registrations' => 'user-plus',
        'appointments' => 'calendar-event',
        'income-expense' => 'cash',
        'home-visit' => 'home-heart',
        'test-booking' => 'test-pipe',
        'billing' => 'calculator',
        'support' => 'headset',
        'roles-permissions' => 'user-shield',
    ];

    public function index()
    {
        $user = auth()->user();
        if ($user->role === 'super_admin' || $user->role === 'admin') {
            $roles = Role::whereNull('doctor_id')->withCount('permissions')->get();
            $doctors = \App\Models\User::where('role', 'doctor')->select('id', 'name')->get();
            return view('super-admin.user-roles', compact('roles', 'doctors'));
        }

        $doctorId = $user->getDoctorIdContext();
        $roles = Role::where('doctor_id', $doctorId)->withCount('permissions')->get();
        return view('doctor.staff-permissions', compact('roles'));
    }

    public function create()
    {
        $user = auth()->user();
        $modules = $this->getModulesWithPermissions();
        $role = new Role();
        $rolePermissions = [];

        if ($user->role === 'super_admin' || $user->role === 'admin') {
            $roles = Role::whereNull('doctor_id')->withCount('permissions')->get();
            return view('super-admin.user-roles', compact('roles', 'modules', 'rolePermissions'));
        }

        return view('doctor.role-edit', compact('role', 'modules', 'rolePermissions'));
    }

    public function edit($id)
    {
        $user = auth()->user();
        $doctorId = $user->getDoctorIdContext();
        
        $role = Role::with('permissions')->findOrFail($id);

        // Protect system roles and other doctors' roles
        if (in_array($role->name, ['Super Admin', 'Doctor'])) {
            return redirect()->route('roles-permission')->with('error', 'System roles cannot be edited.');
        }

        // Prevent users from editing their own role to escalate privileges
        $user = auth()->user();
        if ($user->hasRole($role->name) && $user->role !== 'super_admin') {
            return redirect()->route('roles-permission')->with('error', 'You cannot edit your own assigned role.');
        }

        if ($user->role !== 'super_admin' && $user->role !== 'admin' && $role->doctor_id != $doctorId) {
            return redirect()->route('roles-permission')->with('error', 'Unauthorized access to role.');
        }

        $modules = $this->getModulesWithPermissions();
        $rolePermissions = $role->permissions->pluck('name')->toArray();

        return view('doctor.role-edit', compact('role', 'modules', 'rolePermissions'));
    }

    public function allPermissions()
    {
        // Get top-level modules (parent_id is null)
        $modules = Permission::whereNull('parent_id')->get();
        $allPermissions = Permission::all();
        $groupedModules = [];

        foreach ($modules as $module) {
            $children = $allPermissions->where('parent_id', $module->id)->values();
            if ($children->isEmpty()) {
                // If no children, treat the module itself as a permission
                $children = collect([$module]);
            }
            
            $groupedModules[] = [
                'id' => $module->id,
                'name' => $module->name,
                'permissions' => $children
            ];
        }

        return response()->json($groupedModules);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $doctorId = ($user->role === 'super_admin' || $user->role === 'admin') ? null : $user->getDoctorIdContext();

        $request->validate([
            'name' => [
                'required', 
                'string', 
                function ($attribute, $value, $fail) use ($doctorId) {
                    $exists = Role::where('name', $value)->where('doctor_id', $doctorId)->exists();
                    if ($exists) {
                        $fail('The role name has already been taken for this clinic.');
                    }
                },
            ],
            'permissions' => 'array'
        ]);

        $role = Role::create([
            'name' => $request->name, 
            'guard_name' => 'web',
            'doctor_id' => $doctorId
        ]);

        if ($request->has('permissions')) {
            $inputPermissions = $request->permissions;
            
            // 1. Get all potential parent module names
            $allModuleNames = Permission::whereNull('parent_id')->pluck('name')->toArray();
            
            // 2. Strip any module names that might have been sent from the UI checkboxes
            $featurePermissions = array_diff($inputPermissions, $allModuleNames);
            
            // 3. Only re-add module names if "list", "view", or "-permissions" is selected
            $visibilityTriggers = array_filter($featurePermissions, function($p) {
                return str_ends_with($p, '-list') || str_ends_with($p, '-view') || str_ends_with($p, '-permissions');
            });

            $parentIds = Permission::whereIn('name', $visibilityTriggers)
                ->whereNotNull('parent_id')
                ->pluck('parent_id')
                ->unique()
                ->toArray();
                
            $parents = Permission::whereIn('id', $parentIds)
                ->pluck('name')
                ->toArray();
                
            $finalPermissions = array_unique(array_merge($featurePermissions, $parents));
            $role->syncPermissions($finalPermissions);
        }

        if ($request->ajax() || $request->wantsJson()) {
            return response()->json(['success' => true, 'message' => 'Role created successfully!']);
        }

        return redirect()->route('roles-permission')->with('success', 'Role created successfully!');
    }

    public function show($id)
    {
        $role = Role::with('permissions')->findOrFail($id);

        return response()->json([
            'role' => $role,
            'permissions' => $role->permissions->pluck('name')->toArray()
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = auth()->user();
        $doctorId = ($user->role === 'super_admin' || $user->role === 'admin') ? null : $user->getDoctorIdContext();
        $role = Role::findOrFail($id);

        // Security check
        if ($user->role !== 'super_admin' && $user->role !== 'admin' && $role->doctor_id != $doctorId) {
             return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        // Prevent users from editing their own role
        if ($user->hasRole($role->name) && $user->role !== 'super_admin') {
            return response()->json(['success' => false, 'message' => 'You cannot edit your own assigned role.'], 403);
        }

        $request->validate([
            'name' => [
                'required', 
                'string', 
                function ($attribute, $value, $fail) use ($doctorId, $id) {
                    $exists = Role::where('name', $value)
                        ->where('doctor_id', $doctorId)
                        ->where('id', '!=', $id)
                        ->exists();
                    if ($exists) {
                        $fail('The role name has already been taken for this clinic.');
                    }
                },
            ],
            'permissions' => 'array'
        ]);

        $role->update(['name' => $request->name]);

        if ($request->has('permissions')) {
            $inputPermissions = $request->permissions;
            
            // 1. Get all potential parent module names
            $allModuleNames = Permission::whereNull('parent_id')->pluck('name')->toArray();
            
            // 2. Strip any module names that might have been sent from the UI checkboxes
            $featurePermissions = array_diff($inputPermissions, $allModuleNames);
            
            // 3. Only re-add module names if "list", "view", or "-permissions" is selected
            $visibilityTriggers = array_filter($featurePermissions, function($p) {
                return str_ends_with($p, '-list') || str_ends_with($p, '-view') || str_ends_with($p, '-permissions');
            });

            $parentIds = Permission::whereIn('name', $visibilityTriggers)
                ->whereNotNull('parent_id')
                ->pluck('parent_id')
                ->unique()
                ->toArray();
                
            $parents = Permission::whereIn('id', $parentIds)
                ->pluck('name')
                ->toArray();
                
            $finalPermissions = array_unique(array_merge($featurePermissions, $parents));
            
            if ($request->has('target_user_id') && !empty($request->target_user_id)) {
                $targetUser = \App\Models\User::findOrFail($request->target_user_id);
                $targetUser->syncPermissions($finalPermissions);
            } else {
                $role->syncPermissions($finalPermissions);
                
                // If it's the main Doctor role, we also want to ensure all doctors roles and permissions are clean
                if ($role->name === 'Doctor') {
                    // Get all doctors
                    $allDoctors = \App\Models\User::where('role', 'doctor')->get();
                    foreach ($allDoctors as $doc) {
                        // We optionally sync the same permissions to them as direct permissions
                        // OR we can clear their direct permissions so they strictly follow the role.
                        // Given the user wants "All Doctors" update to DEFINITELY work, we'll sync directly.
                        $doc->syncPermissions($finalPermissions);
                    }
                }
            }
        } else {
            if ($request->has('target_user_id') && !empty($request->target_user_id)) {
                $targetUser = \App\Models\User::findOrFail($request->target_user_id);
                $targetUser->syncPermissions([]);
            } else {
                $role->syncPermissions([]);
                
                if ($role->name === 'Doctor') {
                    \App\Models\User::where('role', 'doctor')->get()->each(function($doc) {
                        $doc->syncPermissions([]);
                    });
                }
            }
        }

        if ($request->ajax() || $request->wantsJson()) {
            $msg = (isset($targetUser)) 
                ? "Permissions updated successfully for " . $targetUser->name 
                : ($role->name === 'Doctor' ? "Permissions updated for ALL Doctors successfully!" : "Role updated successfully!");
            return response()->json(['success' => true, 'message' => $msg]);
        }

        return redirect()->route('roles-permission')->with('success', 'Role updated successfully!');
    }

    public function destroy($id)
    {
        $role = Role::findOrFail($id);

        if ($role->name === 'Super Admin' || $role->name === 'Doctor') {
            return response()->json(['success' => false, 'message' => 'Cannot delete system roles!'], 403);
        }

        $user = auth()->user();
        $doctorId = ($user->role === 'super_admin' || $user->role === 'admin') ? null : $user->getDoctorIdContext();
        if ($user->role !== 'super_admin' && $user->role !== 'admin' && $role->doctor_id != $doctorId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        if ($user->hasRole($role->name) && $user->role !== 'super_admin') {
            return response()->json(['success' => false, 'message' => 'You cannot delete your own assigned role.'], 403);
        }

        $role->delete();

        return response()->json(['success' => true, 'message' => 'Role deleted successfully!']);
    }

    /**
     * Get all modules with their child permissions and icons for the UI.
     * Filters by the logged-in user's own permissions to ensure they can only grant what they have.
     */
    private function getModulesWithPermissions()
    {
        $user = auth()->user();
        
        // Super Admin sees all system permissions
        if ($user->role === 'super_admin' || $user->role === 'admin') {
            $modules = Permission::whereNull('parent_id')->get();
            $allPermissions = Permission::all();
            $myPermissionNames = $allPermissions->pluck('name')->toArray();
        } else {
            // Doctors and others see only what they have been assigned
            $myPermissionNames = $user->getAllPermissions()->pluck('name')->toArray();
            
            // Get parents they have access to
            $modules = Permission::whereNull('parent_id')
                ->whereIn('name', $myPermissionNames)
                ->get();
                
            // Get all permissions they have access to
            $allPermissions = Permission::whereIn('name', $myPermissionNames)->get();
        }

        $result = [];
        foreach ($modules as $module) {
            $children = $allPermissions->where('parent_id', $module->id)->values()->map(function ($p) {
                return ['id' => $p->id, 'name' => $p->name];
            })->toArray();

            // Only add module if it has permissions or is explicitly allowed
            if (!empty($children) || in_array($module->name, $myPermissionNames)) {
                $result[] = [
                    'id' => $module->id,
                    'name' => $module->name,
                    'icon' => $this->moduleIcons[$module->name] ?? 'apps',
                    'permissions' => $children,
                ];
            }
        }

        return $result;
    }
}
