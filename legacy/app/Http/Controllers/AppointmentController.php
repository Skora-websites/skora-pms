<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Appointment;
use App\Models\DoctorClinic;
use App\Models\AppointmentConsultConsent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use App\Mail\AppointmentConsentMail;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\AppointmentsExport;
use Illuminate\Support\Facades\DB;
use App\Models\Consultation;
use App\Models\ConsultationPrescriptionUpload;

class AppointmentController extends Controller
{
    private $appKey;
    private $authKey;

    public function __construct()
    {
        $this->appKey = config('services.whatsapp.appkey');
        $this->authKey = config('services.whatsapp.authkey');
    }

    public function showappointment()
    {
        return view('doctor.appointment');
    }

    public function bookappointment(Request $request)
    {
        $doctorId = auth()->user()->getDoctorIdContext();
        $clinic = DoctorClinic::where('doctor_id', $doctorId)
            ->where('is_active', true)
            ->latest()
            ->first();

        $preselectedPatient = null;
        if ($request->has('patient_id')) {
            $preselectedPatient = User::where('id', $request->patient_id)
                ->where('reference_role_id', $doctorId)
                ->first();
        }

        $preselectedDate = $request->query('date');
        $preselectedTime = $request->query('time');
            
        return view('doctor.book-appointment', compact('clinic', 'preselectedPatient', 'preselectedDate', 'preselectedTime'));
    }

    public function searchPatients(Request $request)
    {
        $q = $request->query('q');
        $doctorId = auth()->user()->getDoctorIdContext();

        $patients = User::where('role', 'patient')
            ->where('reference_role_id', $doctorId)
            ->where(function($query) use ($q) {
                if ($q) {
                    $query->where('name', 'like', '%' . $q . '%')
                          ->orWhere('phone', 'like', '%' . $q . '%')
                          ->orWhere('registration_id', 'like', '%' . $q . '%');
                }
            })
            ->limit(5) // Limit to 5 results as requested
            ->get(['id', 'name', 'phone', 'registration_id', 'gender', 'dob']);

        return response()->json($patients);
    }

    public function getBookedTimes(Request $request)
    {
        $date = $request->query('date');
        $doctorId = auth()->user()->getDoctorIdContext();

        $bookedTimes = Appointment::where('doctor_id', $doctorId)
            ->where('date', $date)
            ->whereNotIn('status', ['cancelled']) // exclude cancelled appointments
            ->pluck('time')
            ->toArray();
            
        $dayOfWeek = strtolower(\Carbon\Carbon::parse($date)->format('l'));
        $schedules = \App\Models\DoctorSchedule::whereHas('clinic', function($q) use ($doctorId, $request) {
                $q->where('doctor_id', $doctorId)->where('is_active', true);
                if ($request->clinic_id) {
                    $q->where('id', $request->clinic_id);
                }
            })
            ->where('day_of_week', $dayOfWeek)
            ->where('is_active', true)
            ->get();

        return response()->json([
            'booked_times' => $bookedTimes,
            'schedules' => $schedules
        ]);
    }

    public function generateConsentLink(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'patient_id' => 'required|exists:users,id',
                'mobile' => 'required|digits:10'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => $validator->errors()->first()
                ]);
            }

            if (!auth()->check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please login first'
                ]);
            }

            $doctorId = auth()->user()->getDoctorIdContext();
            $slug = Str::uuid()->toString();

            $consent = AppointmentConsultConsent::create([
                'doctor_id' => $doctorId,
                'patient_id' => $request->patient_id,
                'slug' => $slug,
                'is_accepted' => false
            ]);

            if (!$consent) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to create consent record'
                ]);
            }

            $consentLink = url('/my-consent/' . $slug);
            $doctorName = auth()->user()->name ?? 'Doctor';

            return response()->json([
                'success' => true,
                'message' => 'Consent link generated!',
                'consent_id' => $consent->id,
                'consent_slug' => $slug,
                'consent_link' => $consentLink
            ]);

        } catch (\Exception $e) {
            Log::error('Error in generateConsentLink: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ]);
        }
    }

    public function checkConsentBeforeBooking(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'consent_id' => 'required|exists:appointment_consult_consents,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()]);
        }

        $consent = AppointmentConsultConsent::find($request->consent_id);

        if (!$consent) {
            return response()->json(['success' => false, 'message' => 'Consent record not found']);
        }

        if (!$consent->is_accepted) {
            return response()->json([
                'success' => false,
                'accepted' => false,
                'message' => 'Patient has not accepted the consent form yet',
                'consent_link' => url('/my-consent/' . $consent->slug)
            ]);
        }

        return response()->json([
            'success' => true,
            'accepted' => true,
            'message' => 'Consent already accepted'
        ]);
    }

    public function checkConsentStatus(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'consent_id' => 'required|exists:appointment_consult_consents,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => $validator->errors()->first()
                ]);
            }

            $consent = AppointmentConsultConsent::find($request->consent_id);
            
            return response()->json([
                'success' => true,
                'is_accepted' => $consent->is_accepted,
                'accepted_at' => $consent->accepted_at,
                'status' => $consent->is_accepted ? 'accepted' : 'pending'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }

   public function store(Request $request)
{
    $validator = Validator::make($request->all(), [
        'doctor_id' => 'required|exists:users,id',
        'patient_id' => 'required|exists:users,id',
        'patient_string' => 'required|string|max:255',
        'date' => 'required|date|after_or_equal:today',
        'time' => 'required|date_format:h:i A',
        'case_type' => 'nullable|in:clinical_visit,home_visit,online_visit,on_call_visit',
        'blood_group' => 'nullable|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
        'bp' => 'nullable|regex:/^\d{2,3}\/\d{2,3}$/',
        'weight' => 'nullable|numeric|min:0|max:500',
        'height' => 'nullable|numeric|min:0|max:300',
        'remarks' => 'nullable|string|max:1000',
        'consent_type' => 'nullable|in:otp,consent,upload,skipped,email',
        'consent_id' => 'nullable|exists:appointment_consult_consents,id',
        'consent_file' => 'nullable|required_if:consent_type,upload|file|mimes:jpg,jpeg,png,pdf|max:2048',
        'mobile_number' => 'nullable|string|min:10|max:15',
    ]);

    if ($validator->fails()) {
        return response()->json(['success' => false, 'message' => $validator->errors()->first()]);
    }

    $doctorId = auth()->user()->getDoctorIdContext();
    $request->merge(['doctor_id' => $doctorId]);
    
    $clinic = DoctorClinic::where('doctor_id', $doctorId)
        ->where('is_active', true)
        ->latest()
        ->first();

    $consentFilePath = null;
    if ($request->hasFile('consent_file')) {
        $consentFilePath = $request->file('consent_file')->store('consent_files', 'public');
    }

    // --- Add max_patients validation ---
    $dayOfWeek = strtolower(\Carbon\Carbon::parse($request->date)->format('l'));
    $appointmentTime = \Carbon\Carbon::parse($request->time);
    
    $schedules = \App\Models\DoctorSchedule::whereHas('clinic', function($q) use ($doctorId) {
            $q->where('doctor_id', $doctorId)->where('is_active', true);
        })
        ->where('day_of_week', $dayOfWeek)
        ->where('is_active', true)
        ->get();

    $matchingSchedule = null;
    foreach ($schedules as $schedule) {
        if ($schedule->is_24_hours) {
            $matchingSchedule = $schedule;
            break;
        } else {
            $start = \Carbon\Carbon::parse($schedule->start_time);
            $end = \Carbon\Carbon::parse($schedule->end_time);
            $endAdj = $end->copy();
            if ($end->lessThan($start)) {
                $endAdj->addDay();
            }
            
            $timeToCompare = $appointmentTime->copy();
            if ($end->lessThan($start) && $timeToCompare->lessThan($start)) {
                 $timeToCompare->addDay();
            }

            if ($timeToCompare->between($start, $endAdj, true)) {
                $matchingSchedule = $schedule;
                break;
            }
        }
    }

    if (!$matchingSchedule) {
        return response()->json([
            'success' => false,
            'message' => 'The selected time is outside the doctor\'s available schedule for this date.'
        ], 422);
    }

    if ($matchingSchedule && $matchingSchedule->max_patients > 0) {
        $existingCount = \App\Models\Appointment::where('doctor_id', $doctorId)
            ->where('date', $request->date)
            ->whereNotIn('status', ['cancelled'])
            ->get()
            ->filter(function($appt) use ($matchingSchedule) {
                if ($matchingSchedule->is_24_hours) return true;
                
                $apptTime = \Carbon\Carbon::parse($appt->time);
                $start = \Carbon\Carbon::parse($matchingSchedule->start_time);
                $end = \Carbon\Carbon::parse($matchingSchedule->end_time);
                $endAdj = $end->copy();
                
                if ($end->lessThan($start)) {
                    $endAdj->addDay();
                }
                
                if ($end->lessThan($start) && $apptTime->lessThan($start)) {
                     $apptTime->addDay();
                }
                
                return $apptTime->between($start, $endAdj, true);
            })
            ->count();
            
        if ($existingCount >= $matchingSchedule->max_patients) {
            return response()->json([
                'success' => false,
                'message' => 'Maximum patients limit (' . $matchingSchedule->max_patients . ') reached for this session.'
            ]);
        }
    }
    // --- End max_patients validation ---

    $appointmentData = [
        'doctor_id' => $request->doctor_id,
        'patient_id' => $request->patient_id,
        'patient_string' => $request->patient_string,
        'date' => $request->date,
        'time' => $request->time,
        'case_type' => $request->case_type,
        'blood_group' => $request->blood_group,
        'bp' => $request->bp,
        'weight' => $request->weight,
        'height' => $request->height,
        'remarks' => $request->remarks,
        'consent_type' => $request->consent_type,
        'mobile_number' => $request->mobile_number,
        'consent_file' => $consentFilePath,
    ];

    // FIXED: Proper status assignment based on consent type
    if (in_array($request->consent_type, ['consent', 'email'])) {
        $appointmentData['status'] = 'pending_consent'; 
    } elseif (in_array($request->consent_type, ['otp', 'upload', 'skipped'])) {
        $appointmentData['status'] = 'confirmed'; // OTP/Upload/Skipped → confirmed
    } else {
        $appointmentData['status'] = 'pending'; // Default → pending
    }

    if ($clinic) {
        $appointmentData['clinic_id'] = $clinic->id;
    }

    try {
        $appointment = Appointment::create($appointmentData);
    } catch (\Exception $e) {
        Log::error('Appointment creation failed: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Failed to create appointment: ' . $e->getMessage()
        ]);
    }
    
    $consentLink = null;
    $consent = null;

    if (in_array($request->consent_type, ['consent', 'email'])) {
        if ($request->consent_type === 'consent' && $request->consent_id) {
            $consent = AppointmentConsultConsent::find($request->consent_id);
            if ($consent) {
                $consent->update(['appointment_id' => $appointment->id]);
                $consentLink = url('/my-consent/' . $consent->slug);
            }
        }
        
        // If no consent link generated yet (or for Email), create a new one
        if (!$consentLink) {
            $slug = \Illuminate\Support\Str::uuid()->toString();
            $consent = AppointmentConsultConsent::create([
                'appointment_id' => $appointment->id,
                'doctor_id' => $appointment->doctor_id,
                'patient_id' => $appointment->patient_id,
                'slug' => $slug,
                'is_accepted' => false,
            ]);
            $consentLink = url('/my-consent/' . $slug);
        }

        if ($request->consent_type === 'email') {
            // Send Email
            try {
                $doctor = User::find($appointment->doctor_id);
                $patient = User::find($appointment->patient_id);
                if ($patient && $patient->email) {
                    Mail::to($patient->email)->send(new AppointmentConsentMail($consent, $appointment, $doctor, $patient, $clinic));
                }
            } catch (\Exception $e) {
                Log::error('Email consent send failed: ' . $e->getMessage());
            }
        }
    }

    // Automatically send WhatsApp notification for all confirmed or pending_consent appointments
    if ($appointment->status === 'confirmed' || $appointment->status === 'pending_consent') {
        $this->sendAppointmentWhatsApp($appointment, $clinic, $consentLink);
    }

    return response()->json([
        'success' => true,
        'appointment' => $appointment,
        'consent_link' => $consentLink,
        'appointment_id' => $appointment->id,
        'status' => $appointment->status,
        'message' => $appointment->status === 'confirmed' 
            ? 'Appointment confirmed successfully!' 
            : ($appointment->status === 'pending_consent' 
                ? 'Appointment booked. Please complete consent process.' 
                : 'Appointment booked successfully.'),
        'clinic_info' => $clinic ? [
            'name' => $clinic->clinic_name,
            'address' => $clinic->address,
            'phone' => $clinic->phone,
            'consultation_fee' => $clinic->consultation_fee
        ] : [
            'name' => 'SkoraCares',
            'address' => 'Noida (UP), Ghaziabad',
            'phone' => null,
            'consultation_fee' => null
        ]
    ]);
}

   private function sendAppointmentWhatsApp($appointment, $clinic, $consentLink = null)
{
    try {
        $doctor = User::find($appointment->doctor_id);
        $patient = User::find($appointment->patient_id);
        
        if (!$patient) return;

        $appointmentDate = Carbon::parse($appointment->date)->format('l, F d, Y');
        $appointmentTime = Carbon::parse($appointment->time)->format('h:i A');
        $patientName = $patient->name ?? $appointment->patient_string;
        
        $mobileNo = $patient->phone ?? $appointment->mobile_number;
        if (!$mobileNo) return;
        
        if (!str_starts_with($mobileNo, '+')) {
            $mobileNo = '+91' . $mobileNo;
        }

        $clinicName = $clinic ? $clinic->clinic_name : 'SkoraCares';
        $clinicAddress = $clinic ? $clinic->address : 'Noida (UP), Ghaziabad';
        $clinicPhone = $clinic?->phone;

        $message = "🏥 *Appointment Booking*\n\n";
        $message .= "Dear $patientName,\n\n";
        $message .= "Your appointment with Dr. " . ($doctor ? $doctor->name : 'Doctor') . " has been booked.\n\n";
        $message .= "📅 *Date:* $appointmentDate\n";
        $message .= "⏰ *Time:* $appointmentTime\n";
        $message .= "🏥 *Clinic:* $clinicName\n";
        $message .= "📍 *Address:* $clinicAddress\n";
        
        if ($clinicPhone) {
            $message .= "📞 *Contact:* $clinicPhone\n";
        }

        // FIXED: Check for pending_consent status
        if ($consentLink && $appointment->status === 'pending_consent') {
            $message .= "\n⚠️ *Action Required:*\n";
            $message .= "Please accept the Consultation Form to confirm your appointment:\n";
            $message .= $consentLink . "\n";
        } elseif ($appointment->status === 'confirmed') {
            $message .= "\n✅ *Appointment confirmed.*\n";
        } elseif ($appointment->status === 'pending') {
            $message .= "\n⏳ *Appointment pending confirmation.*\n";
        }
        
        $message .= "\nThank you,\nTeam SkoraCares";

        $formData = [
            ['name' => 'appkey', 'contents' => $this->appKey],
            ['name' => 'authkey', 'contents' => $this->authKey],
            ['name' => 'to', 'contents' => $mobileNo],
            ['name' => 'message', 'contents' => $message],
            ['name' => 'sandbox', 'contents' => 'false']
        ];

        Http::asMultipart()->post('https://whatsapp.rajatmarketingss.online/api/create-message', $formData);

    } catch (\Exception $e) {
        Log::error('WhatsApp send failed: ' . $e->getMessage());
    }
}

    public function sendWhatsapp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'mobile' => 'required|digits:10',
            'message' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first()
            ]);
        }

        $mobileNo = '+91' . $request->mobile;

        $formData = [
            ['name' => 'appkey', 'contents' => $this->appKey],
            ['name' => 'authkey', 'contents' => $this->authKey],
            ['name' => 'to', 'contents' => $mobileNo],
            ['name' => 'message', 'contents' => $request->message],
            ['name' => 'sandbox', 'contents' => 'false']
        ];

        try {
            $response = Http::asMultipart()
                ->timeout(30)
                ->connectTimeout(10)
                ->retry(2, 2000)
                ->post('https://whatsapp.rajatmarketingss.online/api/create-message', $formData);

            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Message sent successfully.'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Message service is temporarily unavailable.'
            ]);

        } catch (\Exception $e) {
            Log::error('WhatsApp Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Something went wrong while sending message.'
            ]);
        }
    }

    public function editappointment(Request $request)
    {
        $encryptedId = $request->query('appointment_id');
        if (!$encryptedId) {
            return redirect()->route('doctors.appointment')->with('error', 'Invalid Request.');
        }

        try {
            $appointmentId = Crypt::decryptString($encryptedId);
        } catch (\Exception $e) {
            return redirect()->route('doctors.appointment')->with('error', 'Invalid or Tampered Appointment Link.');
        }

        $appointment = Appointment::with('patient')->findOrFail($appointmentId);

        if ($appointment->doctor_id !== auth()->user()->getDoctorIdContext()) {
            abort(403);
        }

        $apptTime = Carbon::parse($appointment->date . ' ' . $appointment->time);
        if (!$apptTime->isAfter(now())) {
            return redirect()->route('doctors.appointment')->with('error', 'Past appointments cannot be edited.');
        }

        $clinic = DoctorClinic::where('doctor_id', auth()->user()->getDoctorIdContext())
            ->where('is_active', true)
            ->latest()
            ->first();

        $patient_details = User::where('role', 'patient')
            ->select('id', 'name', 'phone', 'registration_id', 'gender')
            ->get();

        return view('doctor.edit-book-appointment', compact('appointment', 'clinic', 'patient_details', 'encryptedId'));
    }

    public function bookedTimes(Request $request)  
    {
        $date = $request->date;
        $excludeId = $request->exclude_id;   
        $doctorId = auth()->user()->getDoctorIdContext();

        $booked = Appointment::where('doctor_id', $doctorId)
            ->where('date', $date)
            ->whereNotIn('status', ['cancelled'])
            ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId))
            ->pluck('time')
            ->toArray();
            
        $dayOfWeek = strtolower(\Carbon\Carbon::parse($date)->format('l'));
        $schedules = \App\Models\DoctorSchedule::whereHas('clinic', function($q) use ($doctorId, $request) {
                $q->where('doctor_id', $doctorId)->where('is_active', true);
                if ($request->clinic_id) {
                    $q->where('id', $request->clinic_id);
                }
            })
            ->where('day_of_week', $dayOfWeek)
            ->where('is_active', true)
            ->get();

        return response()->json([
            'booked_times' => $booked,
            'schedules' => $schedules
        ]);
    }

    public function updateappointment(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'appointment_id' => 'required|exists:appointments,id',
            'patient_id' => 'required|exists:users,id',
            'patient_string' => 'required|string|max:255',
            'date' => 'required|date|after_or_equal:today',
            'time' => 'required|date_format:h:i A',
            'case_type' => 'nullable|in:clinical_visit,home_visit,online_visit,on_call_visit',
            'blood_group' => 'nullable|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
            'bp' => 'nullable|regex:/^\d{2,3}\/\d{2,3}$/',
            'weight' => 'nullable|numeric|min:0|max:500',
            'height' => 'nullable|numeric|min:0|max:300',
            'remarks' => 'nullable|string|max:1000',
            'mobile_number' => 'nullable|string|min:10|max:15',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 422);
        }

        $appointment = Appointment::findOrFail($request->appointment_id);

        if ($appointment->doctor_id !== auth()->user()->getDoctorIdContext()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $newApptTime = Carbon::parse($request->date . ' ' . $request->time);
        if (!$newApptTime->isAfter(now())) {
            return response()->json(['success' => false, 'message' => 'Appointment must be in the future.'], 422);
        }

        $request->merge(['doctor_id' => auth()->user()->getDoctorIdContext()]);

        $clinic = DoctorClinic::where('doctor_id', auth()->user()->getDoctorIdContext())
            ->where('is_active', true)
            ->latest()
            ->first();

        // --- Add max_patients validation ---
        $doctorId = auth()->user()->getDoctorIdContext();
        $dayOfWeek = strtolower(\Carbon\Carbon::parse($request->date)->format('l'));
        $appointmentTime = \Carbon\Carbon::parse($request->time);
        
        $schedules = \App\Models\DoctorSchedule::whereHas('clinic', function($q) use ($doctorId) {
                $q->where('doctor_id', $doctorId)->where('is_active', true);
            })
            ->where('day_of_week', $dayOfWeek)
            ->where('is_active', true)
            ->get();

        $matchingSchedule = null;
        foreach ($schedules as $schedule) {
            if ($schedule->is_24_hours) {
                $matchingSchedule = $schedule;
                break;
            } else {
                $start = \Carbon\Carbon::parse($schedule->start_time);
                $end = \Carbon\Carbon::parse($schedule->end_time);
                $endAdj = $end->copy();
                if ($end->lessThan($start)) {
                    $endAdj->addDay();
                }
                
                $timeToCompare = $appointmentTime->copy();
                if ($end->lessThan($start) && $timeToCompare->lessThan($start)) {
                     $timeToCompare->addDay();
                }

                if ($timeToCompare->between($start, $endAdj, true)) {
                    $matchingSchedule = $schedule;
                    break;
                }
            }
        }

        if (!$matchingSchedule) {
            return response()->json([
                'success' => false,
                'message' => 'The selected time is outside the doctor\'s available schedule for this date.'
            ], 422);
        }

        if ($matchingSchedule && $matchingSchedule->max_patients > 0) {
            $existingCount = \App\Models\Appointment::where('doctor_id', $doctorId)
                ->where('date', $request->date)
                ->where('id', '!=', $appointment->id) // exclude current appointment
                ->whereNotIn('status', ['cancelled'])
                ->get()
                ->filter(function($appt) use ($matchingSchedule) {
                    if ($matchingSchedule->is_24_hours) return true;
                    
                    $apptTime = \Carbon\Carbon::parse($appt->time);
                    $start = \Carbon\Carbon::parse($matchingSchedule->start_time);
                    $end = \Carbon\Carbon::parse($matchingSchedule->end_time);
                    $endAdj = $end->copy();
                    
                    if ($end->lessThan($start)) {
                        $endAdj->addDay();
                    }
                    
                    if ($end->lessThan($start) && $apptTime->lessThan($start)) {
                         $apptTime->addDay();
                    }
                    
                    return $apptTime->between($start, $endAdj, true);
                })
                ->count();
                
            if ($existingCount >= $matchingSchedule->max_patients) {
                return response()->json([
                    'success' => false,
                    'message' => 'Maximum patients limit (' . $matchingSchedule->max_patients . ') reached for this session.'
                ], 422);
            }
        }
        // --- End max_patients validation ---

        $updateData = $request->only([
            'doctor_id', 'patient_id', 'patient_string', 'date', 'time',
            'case_type', 'blood_group', 'bp', 'weight', 'height', 'remarks', 'mobile_number'
        ]);

        if ($clinic) {
            $updateData['clinic_id'] = $clinic->id;
        }

        $appointment->update($updateData);
        
        $doctor = User::find(auth()->user()->getDoctorIdContext());
        $patient = User::find($request->patient_id);
        $patientName = $patient ? $patient->name : $request->patient_string;
        $mobileNo = $patient?->phone ?? $request->mobile_number;

        if ($mobileNo) {
            if (!str_starts_with($mobileNo, '+')) {
                $mobileNo = '+91' . $mobileNo;
            }

            $clinicName = $clinic ? $clinic->clinic_name : 'SkoraCares';
            $clinicAddress = $clinic ? $clinic->address : 'Noida (UP), Ghaziabad';
            $clinicPhone = $clinic?->phone;
            $consultationFee = $clinic?->consultation_fee;
            $appointmentDate = Carbon::parse($request->date)->format('l, F d, Y');
            $appointmentTime = Carbon::parse($request->time)->format('h:i A');
            
            $message = "Dear $patientName,\n" .
                "Your appointment with Dr. " . ($doctor ? $doctor->name : 'Unknown') . " has been UPDATED.\n\n" .
                "📅 New Date: $appointmentDate\n" .
                "⏰ New Time: $appointmentTime\n" .
                "🏥 Clinic/Hospital: $clinicName\n" .
                "📍 Address: $clinicAddress\n";

            if ($clinicPhone) {
                $message .= "📞 Contact: $clinicPhone\n";
            }

            if ($consultationFee) {
                $message .= "💰 Consultation Fee: ₹" . number_format($consultationFee, 2) . "\n";
            }
            
            $message .= "\nRegards,\nTeam SkoraCares";
            
            try {
                $formData = [
                    ['name' => 'appkey', 'contents' => $this->appKey],
                    ['name' => 'authkey', 'contents' => $this->authKey],
                    ['name' => 'to', 'contents' => $mobileNo],
                    ['name' => 'message', 'contents' => $message],
                    ['name' => 'sandbox', 'contents' => 'false']
                ];

                Http::asMultipart()->post('https://whatsapp.rajatmarketingss.online/api/create-message', $formData);
            } catch (\Exception $e) {
                Log::error('WhatsApp update failed: ' . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Appointment updated successfully!',
            'redirect' => route('doctors.appointment')
        ]);
    }

    public function filter_patients_appointments(Request $request)
    {
        $doctorId = auth()->user()->getDoctorIdContext();
        
        $query = Appointment::where('doctor_id', $doctorId)
            ->with(['patient', 'consultConsent'])
            ->orderBy('date', 'desc')
            ->orderBy('time', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('name')) {
            $query->whereHas('patient', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->name . '%');
            });
        }

        if ($request->filled('phone')) {
            $query->whereHas('patient', function ($q) use ($request) {
                $q->where('phone', 'like', '%' . $request->phone . '%');
            });
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $start = Carbon::parse($request->start_date)->startOfDay();
            $end = Carbon::parse($request->end_date)->endOfDay();
            $query->whereBetween('date', [$start, $end]);
        }

        $appointments = $query->paginate(10);

        foreach ($appointments as $key => $appointment) {
            $appointment->index = $appointments->firstItem() + $key;
            
            if ($appointment->patient) {
                $appointment->patient->age = $appointment->patient->dob ? Carbon::parse($appointment->patient->dob)->age : 0;
            }
            
            $appointment->encrypted_id = Crypt::encryptString($appointment->id);
        }

        $todayClinicalVisitCount = Appointment::where('doctor_id', $doctorId)
            ->whereDate('date', today())
            ->where('case_type', 'clinical_visit')
            ->where('status', 'pending')
            ->count();

        $todayHomeVisitCount = Appointment::where('doctor_id', $doctorId)
            ->whereDate('date', today())
            ->where('case_type', 'home_visit')
            ->where('status', 'pending')
            ->count();

        $todayOnlineVisitCount = Appointment::where('doctor_id', $doctorId)
            ->whereDate('date', today())
            ->where('case_type', 'online_visit')
            ->where('status', 'pending')
            ->count();

        $todayCallVisitCount = Appointment::where('doctor_id', $doctorId)
            ->whereDate('date', today())
            ->where('case_type', 'on_call_visit')
            ->where('status', 'pending')
            ->count();

        return response()->json([
            'success' => true,
            'appointments' => $appointments->items(),
            'todayclinical_visit_count' => $todayClinicalVisitCount,
            'todayhome_visit_count' => $todayHomeVisitCount,
            'todayonline_visit_count' => $todayOnlineVisitCount,
            'todaycall_visit_count' => $todayCallVisitCount,
            'pagination' => [
                'current_page' => $appointments->currentPage(),
                'last_page' => $appointments->lastPage(),
                'total' => $appointments->total(),
                'links' => $appointments->links('pagination::bootstrap-5')->toHtml()
            ]
        ]);
    }

    public function cancelAppointment(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'appointment_id' => 'required|exists:appointments,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first()
            ], 422);
        }

        $appointment = Appointment::with('patient')->findOrFail($request->appointment_id);
        
        if ($appointment->doctor_id !== auth()->user()->getDoctorIdContext()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized action'
            ], 403);
        }
        
        $apptTime = Carbon::parse($appointment->date . ' ' . $appointment->time);
        if ($apptTime->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot cancel past appointments'
            ], 422);
        }
        
        if ($appointment->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'Appointment is already cancelled'
            ], 422);
        }

        if (!in_array($appointment->status, ['confirmed', 'pending'])) {
            return response()->json([
                'success' => false,
                'message' => 'Only confirmed and pending appointments can be cancelled'
            ], 422);
        }
        
        $appointment->update(['status' => 'cancelled']);
        
        $patient = $appointment->patient;
        $doctor = auth()->user();
        $patientName = $patient ? $patient->name : $appointment->patient_string;
        $mobileNo = $patient?->phone ?? $appointment->mobile_number;
        
        if ($mobileNo) {
            if (!str_starts_with($mobileNo, '+')) {
                $mobileNo = '+91' . $mobileNo;
            }

            $clinic = DoctorClinic::where('doctor_id', auth()->user()->getDoctorIdContext())
                ->where('is_active', true)
                ->latest()
                ->first();

            $clinicName = $clinic ? $clinic->clinic_name : 'SkoraCares';
            $clinicAddress = $clinic ? $clinic->address : 'Noida (UP), Ghaziabad';

            $message = "Dear {$patientName},\n\n" .
                "Your appointment with Dr. {$doctor->name} on " .
                Carbon::parse($appointment->date)->format('l, F d, Y') .
                " at {$appointment->time} has been **CANCELLED** by the doctor.\n\n" .
                "If this was unintentional, please contact us immediately.\n\n" .
                "Clinic: {$clinicName}\nAddress: {$clinicAddress}\n\n" .
                "Regards,\nTeam SkoraCares";

            try {
                Http::asMultipart()->post('https://whatsapp.rajatmarketingss.online/api/create-message', [
                    ['name' => 'appkey', 'contents' => $this->appKey],
                    ['name' => 'authkey', 'contents' => $this->authKey],
                    ['name' => 'to', 'contents' => $mobileNo],
                    ['name' => 'message', 'contents' => $message],
                    ['name' => 'sandbox', 'contents' => 'false']
                ]);
            } catch (\Exception $e) {
                Log::error('WhatsApp cancellation failed: ' . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Appointment cancelled successfully!'
        ]);
    }

    public function completeAppointment(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'appointment_id' => 'required|exists:appointments,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first()
            ], 422);
        }

        $appointment = Appointment::findOrFail($request->appointment_id);
        
        if ($appointment->doctor_id !== auth()->user()->getDoctorIdContext()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized action'
            ], 403);
        }
        
        if ($appointment->status === 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Appointment is already completed'
            ], 422);
        }
        
        if ($appointment->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot complete cancelled appointments'
            ], 422);
        }

        if (!in_array($appointment->status, ['confirmed', 'pending'])) {
            return response()->json([
                'success' => false,
                'message' => 'Only confirmed or pending appointments can be marked completed'
            ], 422);
        }

        $appointment->update(['status' => 'completed']);

        return response()->json([
            'success' => true,
            'message' => 'Appointment marked as completed!'
        ]);
    }

    public function show_appointment($id)
    {
        try {
            $appointment = Appointment::with(['patient', 'consultConsent'])
                ->where('doctor_id', auth()->user()->getDoctorIdContext())
                ->findOrFail($id);

            if ($appointment->patient) {
                $appointment->patient->age = $appointment->patient->dob ? Carbon::parse($appointment->patient->dob)->age : 0;
            }

            return response()->json([
                'success' => true,
                'appointment' => $appointment
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Appointment not found.'
            ], 404);
        }
    }

    public function myConsent()
    {
        return view('doctor.my-consent');
    }

    public function updateStatus(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'appointment_id' => 'required|exists:appointments,id',
            'status' => 'required|in:confirmed,completed,cancelled'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 422);
        }

        $appointment = Appointment::findOrFail($request->appointment_id);
        
        if ($appointment->doctor_id !== auth()->id()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized action'], 403);
        }

        $appointment->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'message' => 'Appointment status updated to ' . ucfirst($request->status)
        ]);
    }

    public function uploadConsultationPrescription(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'appointment_id' => 'required|exists:appointments,id',
            'files' => 'required|array|min:1',
            'files.*' => 'file|mimes:jpg,jpeg,png,pdf|max:10240', // 10MB per file
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 422);
        }

        try {
            DB::beginTransaction();

            $appointment = Appointment::findOrFail($request->appointment_id);
            
            if ($appointment->doctor_id !== auth()->id()) {
                return response()->json(['success' => false, 'message' => 'Unauthorized action'], 403);
            }

            // Create a consultation record with notes
            $consultation = Consultation::create([
                'patient_id' => $appointment->patient_id,
                'doctor_id' => auth()->id(),
                'appointment_id' => $appointment->id,
                'consultation_date' => now(),
                'medical_history' => $request->medical_history,
                'private_notes' => $request->private_notes,
                'medical_records' => $request->medical_records,
                'lab_results' => $request->lab_results,
                'symptoms_note' => $request->symptoms_note,
                'examination_note' => $request->examination_note,
                'diagnosis_note' => $request->diagnosis_note,
                'lab_note' => $request->lab_note,
            ]);

            // Save files
            if ($request->hasFile('files')) {
                foreach ($request->file('files') as $file) {
                    $filePath = $file->store('prescriptions', 'public');
                    $fileType = $file->getClientOriginalExtension();

                    // Create prescription upload record
                    ConsultationPrescriptionUpload::create([
                        'consultation_id' => $consultation->id,
                        'patient_id' => $appointment->patient_id,
                        'doctor_id' => auth()->id(),
                        'file_path' => $filePath,
                        'file_type' => $fileType,
                        'notes' => 'Prescription upload for appointment #' . $appointment->id,
                    ]);
                }
            }

            // Update appointment status to completed
            $appointment->update(['status' => 'completed']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Prescription uploaded and appointment marked as completed!'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Upload Consultation Prescription failed: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to upload: ' . $e->getMessage()], 500);
        }
    }

    public function exportAppointments(Request $request)
    {
        try {
            $doctorId = Auth::id();
            
            $status = $request->status;
            $searchName = $request->search_name;
            $searchPhone = $request->search_phone;
            $startDate = $request->start_date;
            $endDate = $request->end_date;
            
            $selectedIds = [];
            if ($request->selected_ids) {
                $selectedIds = json_decode($request->selected_ids, true);
            }

            $export = new AppointmentsExport(
                $doctorId, 
                $status, 
                $searchName, 
                $searchPhone, 
                $startDate, 
                $endDate, 
                $selectedIds
            );

            $filename = 'appointments_' . date('Y-m-d_His') . '.xlsx';

            return Excel::download($export, $filename);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Export failed: ' . $e->getMessage()
            ], 500);
        }
    }







public function deleteAppointment(Request $request)
{
    $validator = Validator::make($request->all(), [
        'appointment_id' => 'required|exists:appointments,id',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'message' => $validator->errors()->first()
        ], 422);
    }

    $appointment = Appointment::with('patient')->findOrFail($request->appointment_id);
    
    // Check if doctor owns this appointment
    if ($appointment->doctor_id !== auth()->id()) {
        return response()->json([
            'success' => false,
            'message' => 'Unauthorized action'
        ], 403);
    }
    
    $apptTime = Carbon::parse($appointment->date . ' ' . $appointment->time);
    $canDelete = false;
    $errorMessage = '';
    
    if ($apptTime->isFuture()) {
        if (in_array($appointment->status, ['pending', 'pending_consent','completed'])) {
            $canDelete = true;
        } elseif ($appointment->status === 'confirmed') {
            $errorMessage = 'Confirmed appointments cannot be deleted directly. Please cancel first.';
        } else {
            $errorMessage = 'This appointment cannot be deleted.';
        }
    } else {
        if (in_array($appointment->status, ['completed', 'cancelled'])) {
            $canDelete = true;
        } else {
            $errorMessage = 'Past appointments must be completed or cancelled before deletion.';
        }
    }
    
    if (!$canDelete) {
        return response()->json([
            'success' => false,
            'message' => $errorMessage ?: 'This appointment cannot be deleted.'
        ], 422);
    }
    
    try {
        $patient = $appointment->patient;
        $doctor = auth()->user();
        $patientName = $patient ? $patient->name : $appointment->patient_string;
        $mobileNo = $patient?->phone ?? $appointment->mobile_number;
        $appointmentDate = Carbon::parse($appointment->date)->format('l, F d, Y');
        $appointmentTime = $appointment->time;
        $appointment->delete();
        if ($mobileNo) {
            $this->sendDeletionWhatsApp($mobileNo, $patientName, $doctor->name, $appointmentDate, $appointmentTime);
        }
        AppointmentConsultConsent::where('appointment_id', $appointment->id)->delete();
        return response()->json([
            'success' => true,
            'message' => 'Appointment deleted successfully!'
        ]);
        
    } catch (\Exception $e) {
        Log::error('Appointment deletion failed: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Failed to delete appointment: ' . $e->getMessage()
        ], 500);
    }
}

    private function sendDeletionWhatsApp($mobileNo, $patientName, $doctorName, $date, $time)
    {
        try {
            if (!str_starts_with($mobileNo, '+')) {
                $mobileNo = '+91' . $mobileNo;
            }

            $message = "🗑️ *Appointment Deleted*\n\n";
            $message .= "Dear $patientName,\n\n";
            $message .= "Your appointment with Dr. $doctorName has been deleted from the system.\n\n";
            $message .= "📅 *Date:* $date\n";
            $message .= "⏰ *Time:* $time\n\n";
            $message .= "If you believe this is a mistake, please contact the clinic.\n\n";
            $message .= "Regards,\nTeam SkoraCares";

            $formData = [
                ['name' => 'appkey', 'contents' => $this->appKey],
                ['name' => 'authkey', 'contents' => $this->authKey],
                ['name' => 'to', 'contents' => $mobileNo],
                ['name' => 'message', 'contents' => $message],
                ['name' => 'sandbox', 'contents' => 'false']
            ];

            Http::asMultipart()->post('https://whatsapp.rajatmarketingss.online/api/create-message', $formData);

        } catch (\Exception $e) {
            Log::error('Deletion WhatsApp failed: ' . $e->getMessage());
        }
    }
}














