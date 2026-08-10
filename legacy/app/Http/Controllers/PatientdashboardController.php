<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PatientdashboardController extends Controller
{
    public function index()
    {
        return view('patient.dashboard');
    }
}
