<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LoginController extends Controller
{
    public function showLoginForm()
    {
        return view('auth.login');
    }

    public function authenticate(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials)) {
            $user = Auth::user();

            // Check if user account is deactivated
            if ($user->status === 'inactive') {
                Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return back()->withErrors([
                    'email' => 'Your account has been deactivated by the administrator. Please contact support.',
                ]);
            }

            $request->session()->regenerate();
            
            return $this->authenticated($request, $user);
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match Skoracares.',
        ]);
    }

    protected function authenticated(Request $request, $user)
    {
        return match($user->role) {
            'patient' => redirect('/patient-dashboard'),
            'doctor' => redirect('/doctor-dashboard'),
            'receptionist' => redirect('/doctor-dashboard'),
            'admin' => redirect('/super-admin-dashboard'),
            'super_admin' => redirect('/super-admin-dashboard'),
            default => redirect('/doctor-dashboard'),
        };
    }


       public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('../');
    }


}