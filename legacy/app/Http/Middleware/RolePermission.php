<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

use Illuminate\Support\Facades\Auth;

class RolePermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (!$user) {
            return redirect('/login');
        }

        // Block deactivated users
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
        if (in_array($user->role, ['doctor', 'receptionist', 'nurse', 'accountant'])) {
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

        // Super Admin bypass
        if ($user->role === 'super_admin') {
            return $next($request);
        }

        // Check permission using Spatie
        if ($user->hasPermissionTo($permission)) {
            return $next($request);
        }

        abort(403, 'Unauthorized action.');
    }
}
