<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class LogoutController extends Controller
{
    public function logout(Request $request)
    {
        Auth::guard('web')->logout(); 
        $request->session()->invalidate(); // session invalidate
        $request->session()->regenerateToken(); // CSRF token regenerate

        return redirect('/login'); // redirect to login
    }
}