<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

$roles = Role::all();
foreach ($roles as $role) {
    $permissions = $role->permissions->pluck('name')->toArray();
    
    // Manual parent ID lookup to avoid undefined relationship error
    $parentIds = Permission::whereIn('name', $permissions)
        ->whereNotNull('parent_id')
        ->pluck('parent_id')
        ->unique()
        ->toArray();
        
    $parents = Permission::whereIn('id', $parentIds)
        ->pluck('name')
        ->toArray();
    
    $final = array_unique(array_merge($permissions, $parents));
    $role->syncPermissions($final);
    echo "Updated role: {$role->name} - Added parents: " . implode(', ', $parents) . "\n";
}
echo "All roles synced successfully.\n";
