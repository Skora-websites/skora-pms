<?php
define('LARAVEL_START', microtime(true));
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Spatie\Permission\Models\Role;

try {
    $role = Role::where('name', 'Doctor')->first();
    if ($role) {
        $role->syncPermissions([]);
        echo "SUCCESS: Doctor role permissions cleared.\n";
    } else {
        echo "WARNING: Doctor role not found.\n";
    }
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
