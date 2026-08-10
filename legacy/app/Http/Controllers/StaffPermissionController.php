<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Http\Request;

class StaffPermissionController extends Controller
{
    public function index()
    {
        return view('doctor.staff-permissions');
    }

    public function getReceptionists()
    {

         $userId = Auth::id();
          $receptionists = User::where('reference_role_id', $userId)
            ->where('role', 'patient')
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        return response()->json($receptionists);
    }

    public function getPermissions($userId)
    {

        $userid = Auth::id();
        $receptionist = User::where('reference_role_id', $userid)
                            ->where('role', 'receptionist')
                            ->findOrFail($userId);

        // Sab permissions dynamically (Spatie ya custom dono chalega)
        $allPermissions = \Spatie\Permission\Models\Permission::all()
            ->groupBy(fn($p) => explode('.', $p->name)[0])
            ->sortKeys();

        return response()->json([
            'receptionist'     => $receptionist,
            'modules'          => $allPermissions,
            'user_permissions' => $receptionist->getPermissionNames()->toArray()
        ]);
    }

    public function savePermissions(Request $request, $userId)
    {
        $receptionist = User::where('doctor_id', auth()->id())
                            ->where('role', 'receptionist')
                            ->findOrFail($userId);

        $receptionist->syncPermissions($request->permissions ?? []);

        return response()->json(['success' => true, 'message' => 'Permissions Saved Successfully!']);
    }
}