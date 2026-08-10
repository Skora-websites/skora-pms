<?php

namespace App\Http\Controllers;

use App\Models\AppointmentConsultConsent;
use App\Models\DoctorConsultPdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\DemoBookingMail;

class FrontendController extends Controller
{
    public function showConsultConsent($slug)
    {
        $consent = AppointmentConsultConsent::where('slug', $slug)
            ->with(['appointment.patient', 'doctor'])
            ->firstOrFail();
            
        $pdf = DoctorConsultPdf::where('doctor_id', $consent->doctor_id)->first();
        $alreadyAccepted = $consent->is_accepted;
        
        return view('front.consult-consent', compact('consent', 'pdf', 'alreadyAccepted'));
    }

    public function submitConsultConsent(Request $request, $slug)
    {
        $request->validate([
            'action' => 'required|in:accept,reject',
            'consent_file' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $consent = AppointmentConsultConsent::where('slug', $slug)
                    ->with('appointment')
                    ->firstOrFail();

        if ($consent->is_accepted || $consent->is_rejected) {
            return redirect()->route('my.consult.consent', $slug)
                            ->with('success', 'Your response has already been recorded.');
        }

        $filePath = null;
        if ($request->hasFile('consent_file')) {
            $filePath = $request->file('consent_file')->store('consent_files', 'public');
        }

        if ($request->action === 'accept') {
            $consent->update([
                'is_accepted' => true,
                'accepted_at' => now(),
            ]);

            // Auto-generate Consent PDF
            try {
                $appointment = $consent->appointment;
                $doctor = $consent->doctor;
                $patient = $consent->patient;
                
                $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdfs.consult-consent-template', compact('consent', 'appointment', 'doctor', 'patient'));
                
                $fileName = 'consent_' . $appointment->id . '_' . time() . '.pdf';
                $filePath = 'consent_pdfs/' . $fileName;
                
                \Illuminate\Support\Facades\Storage::disk('public')->put($filePath, $pdf->output());
                
                // Save the generated PDF path to consent_file
                $consent->update(['consent_file' => $filePath]);
                
            } catch (\Exception $e) {
                Log::error('Consent PDF generation failed: ' . $e->getMessage());
            }

            if ($consent->appointment) {
                $consent->appointment->update(['status' => 'confirmed']);
                Log::info('Appointment confirmed via consent acceptance', [
                    'appointment_id' => $consent->appointment->id,
                    'consent_id' => $consent->id
                ]);
            }

            return redirect()->route('my.consult.consent', $slug)
                            ->with('success', 'Thank you! Consultation Form accepted. Appointment Confirmed!');
        } else {
            // Reject
            $consent->update([
                'is_rejected' => true,
                'rejected_at' => now(),
                'consent_file' => $filePath,
            ]);

            if ($consent->appointment) {
                $consent->appointment->update(['status' => 'cancelled']);
                Log::info('Appointment cancelled via consent rejection', [
                    'appointment_id' => $consent->appointment->id,
                    'consent_id' => $consent->id
                ]);
            }

            return redirect()->route('my.consult.consent', $slug)
                            ->with('error', 'You have rejected the consultation form. The appointment has been cancelled.');
        }
    }

    public function bookDemo(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'clinic_name' => 'nullable|string|max:255',
            'phone' => 'required|string|max:20',
            'concern' => 'required|string',
            'preferred_time' => 'nullable',
        ]);

        try {
            // Send email to admin
            Mail::to('rockykumar998877@gmail.com')->send(new DemoBookingMail($validated));

            return back()->with('success', 'Your demo request has been submitted successfully! We will contact you soon.');
        } catch (\Exception $e) {
            Log::error('Mail sending failed: ' . $e->getMessage());
            return back()->with('error', 'Something went wrong while sending your request. Please try again later. Error: ' . $e->getMessage());
        }
    }
}