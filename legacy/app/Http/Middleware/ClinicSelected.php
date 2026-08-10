<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\DoctorClinic;

class ClinicSelected
{
    public function handle(Request $request, Closure $next)
    {
        // Agar koi clinic select nahi hai to redirect karein
        if (!DoctorClinic::currentClinic()) {
            // Check if doctor has any clinics
            $clinics = DoctorClinic::getMyClinics();
            
            if ($clinics->count() > 0) {
                // First clinic automatically select karein
                DoctorClinic::setCurrentClinic($clinics->first()->id);
            } else {
                // Agar koi clinic nahi hai to clinic create page par redirect karein
                return redirect()->route('doctor.clinic.create')
                    ->with('warning', 'Please create a clinic first.');
            }
        }

        return $next($request);
    }
}