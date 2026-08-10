<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Appointment;
use App\Models\Billing;
// use App\Models\ConsultConsent; // ⚠️ COMMENTED
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class RegistrationController extends Controller
{
    public function showRegistrationForm()
    {
        return view('auth.register');
    }
   
    public function register(Request $request)
    {
        // Validation
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|digits:10|unique:users,phone',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|in:patient,doctor',
        ]);

        try {
            $trialEndsAt = null;
            if ($validated['role'] === 'doctor') {
                $setting = \App\Models\CompanySetting::find(1);
                $trialDays = $setting ? (int) ($setting->default_trial_days ?? 15) : 15;
                $trialEndsAt = now()->addDays($trialDays);
            }

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'],
                'trial_ends_at' => $trialEndsAt,
            ]);

            auth()->login($user);

            $redirectUrl = $user->role === 'patient' 
                ? route('patient.dashboard')
                : route('doctor.dashboard');

            return redirect($redirectUrl)
                ->with('success', 'Account created successfully!');

        } catch (\Exception $e) {
            Log::error('Registration failed: ' . $e->getMessage());
            return back()->with('error', 'Registration failed. Please try again.');
        }
    }

    /**
     * PATIENT DETAILS SHOW - WITH APPOINTMENTSTATS ARRAY
     */
    public function allpatientDetailshow($id)
    {
        // Patient find karo
        $patient = User::where('id', $id)->where('role', 'patient')->firstOrFail();
        
        // Current doctor ka ID
        $doctorId = auth()->id();
        
        // Sare appointments fetch karo
        $appointments = Appointment::with(['doctor', 'consultConsent'])
            ->where('patient_id', $id)
            ->where('doctor_id', $doctorId)
            ->orderBy('date', 'desc')
            ->orderBy('time', 'desc')
            ->get();

        // Latest appointment
        $latestAppointment = $appointments->isNotEmpty() ? $appointments->first() : null;
        
        // =========================================
        // APPOINTMENT STATS ARRAY - YAHI CHAHIYE VIEW KO
        // =========================================
        $appointmentStats = [
            'total' => $appointments->count(),
            'confirmed' => $appointments->where('status', 'confirmed')->count(),
            'completed' => $appointments->where('status', 'completed')->count(),
            'cancelled' => $appointments->where('status', 'cancelled')->count(),
            'pending' => $appointments->where('status', 'pending')->count(),
        ];
        
        // Recent appointments (last 5)
        $recentAppointments = $appointments->take(5);
        
        // Home visits
        $homeVisits = Appointment::with('patient')
            ->where('patient_id', $id)
            ->where('doctor_id', $doctorId)
            ->where('case_type', 'home_visit')
            ->orderBy('date', 'desc')
            ->orderBy('time', 'desc')
            ->limit(5)
            ->get();

        // ⚠️ CONSULT CONSENT - COMMENTED
        /*
        $consents = ConsultConsent::where('patient_id', $id)
                    ->whereHas('appointment', function($query) use ($doctorId) {
                        $query->where('doctor_id', $doctorId);
                    })
                    ->with('appointment')
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get();
        */

        // Billing records
        $billings = Billing::with('billingType')
            ->where('patient_id', $id)
            ->where('doctor_id', $doctorId)
            ->orderBy('bill_date', 'desc')
            ->get();

        // Fetch all past consultations for clinical history
        $consultations = \App\Models\Consultation::with(['doctor', 'medications', 'symptoms', 'examinations', 'diagnoses', 'labTests'])
            ->where('patient_id', $id)
            ->orderBy('consultation_date', 'desc')
            ->get();

        return view('doctor.patient-details', compact(
            'patient',
            'appointments',
            'latestAppointment',
            'appointmentStats', // ✅ YEH VARIABLE VIEW ME USE HO RAHA HAI
            'recentAppointments',
            'homeVisits',
            'billings',
            'consultations'
            // 'consents' // COMMENTED
        ));
    }

    /**
     * ALIAS METHOD
     */
    public function doctorsPatientDetailshow($id)
    {
        return $this->allpatientDetailshow($id);
    }
}