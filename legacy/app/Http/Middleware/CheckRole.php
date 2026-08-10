<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

use Illuminate\Support\Facades\Auth;

class CheckRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();
        $userRole = $user->role;

        // Block deactivated users from accessing any protected route
        if ($user->status === 'inactive') {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Your account has been deactivated. Please contact the administrator.'
                ], 403);
            }

            return redirect('/login')->withErrors([
                'email' => 'Your account has been deactivated. Please contact the administrator.',
            ]);
        }

        // Check trial/subscription expiry for doctor and doctor staff
        if (in_array($userRole, ['doctor', 'receptionist', 'nurse', 'accountant'])) {
            $doctorId = $user->getDoctorIdContext();
            $doctor = ($doctorId === $user->id) ? $user : \App\Models\User::find($doctorId);

            if ($doctor && $doctor->role === 'doctor' && $doctor->trial_ends_at && now()->gt($doctor->trial_ends_at)) {
                if (!$request->is('logout')) {
                    if ($request->expectsJson() || !$request->isMethod('GET')) {
                        return response()->json([
                            'error' => 'subscription_expired',
                            'message' => 'Your trial has expired. Please contact the administrator for renewal.'
                        ], 403);
                    }
                }
            }
        }
        
        // Super Admin and Admin can access administrative routes
        if ($userRole === 'super_admin' || ($userRole === 'admin' && $role === 'super_admin')) {
            return $next($request);
        }

        // Allow staff/receptionists to access doctor portal routes
        if ($role === 'doctor' && in_array($userRole, ['receptionist', 'nurse', 'accountant'])) {
            return $next($request);
        }

        if ($userRole !== $role) {
            abort(403);
        }
        
        return $next($request);
    }
}
