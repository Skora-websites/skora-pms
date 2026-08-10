<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Appointment;
use Illuminate\Support\Facades\Auth;

class HomevisitController extends Controller
{
  public function ShowHomevisit()
    {
        // Logged-in doctor ka ID
        $doctorId = auth()->id();

        // Home Visit appointments fetch karna with related patient data
        $homeVisits = Appointment::with('patient')
            ->where('doctor_id', $doctorId)
            ->where('case_type', 'home_visit')
            ->orderBy('date', 'desc')
            ->get();

        // Data view me bhejna
        return view('doctor.doctor-home-visit', compact('homeVisits'));
    }
    

public function patientDetailshowing($id)
    {
        $patient = User::findOrFail($id);
        $appointments = Appointment::with('doctor')
            ->where('patient_id', $id)
            ->get();

        $latestAppointment = $appointments->first(); 

        return view('doctor.doctors-patient-details', compact('patient', 'appointments', 'latestAppointment'));
    }

    
}
