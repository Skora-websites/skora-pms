<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\BillingType;
use App\Models\Appointment;
use App\Models\Diagnosis;
use App\Models\LabTest;
use App\Models\Symptom;
use App\Models\Examination;
use App\Models\MedicineMaster;
use App\Models\Consultation;
use App\Models\ConsultationMedication;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ConsulController extends Controller
{
    public function showconsultation($id)
    {
        // Find specific appointment first (ID 129 in user's 404 case)
        $appointments = Appointment::findOrFail($id);
        $patient = $appointments->patient;
       
        $doctors = User::where('role', 'doctor')->get();
        // $appointments = Appointment::where('patient_id', $patient->id)->orderBy('created_at', 'desc')->first();

        $Allsymptoms = Cache::remember('symptoms', 600, fn() => Symptom::select('id', 'name')->orderBy('name')->get());
        $Allexamination = Cache::remember('examination', 600, fn() => Examination::select('id', 'name')->orderBy('name')->get());
        $Alldignolisis = Cache::remember('diagnosis', 600, fn() => Diagnosis::select('id', 'name')->orderBy('name')->get());
        $Alllabtest = Cache::remember('lab_tests', 100, fn() => LabTest::select('id', 'name')->orderBy('name')->get());
        $Allmedicines = Cache::remember('medicine_masters', 100, fn() => MedicineMaster::select('id', 'name')->orderBy('name')->get());

        $billingtype = BillingType::select('id', 'name', 'default_amount')
            ->where('doctor_id', auth()->id())
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return view('doctor.consultation', compact(
            'patient', 
            'doctors', 
            'appointments',
            'Allsymptoms',
            'Allexamination',
            'Alllabtest',
            'Alldignolisis',
            'Allmedicines',
            'billingtype'
        ));
    }



    public function showconsultation_pdf_upload($id)
    {
        // Find specific appointment first (ID 129 in user's 404 case)
        $appointments = Appointment::findOrFail($id);
        $patient = $appointments->patient;
       
        $doctors = User::where('role', 'doctor')->get();
        // $appointments = Appointment::where('patient_id', $patient->id)->orderBy('created_at', 'desc')->first();

        $Allsymptoms = Cache::remember('symptoms', 600, fn() => Symptom::select('id', 'name')->orderBy('name')->get());
        $Allexamination = Cache::remember('examination', 600, fn() => Examination::select('id', 'name')->orderBy('name')->get());
        $Alldignolisis = Cache::remember('diagnosis', 600, fn() => Examination::select('id', 'name')->orderBy('name')->get());
        $Alllabtest = Cache::remember('lab_tests', 100, fn() => Examination::select('id', 'name')->orderBy('name')->get());
        $Allmedicines = Cache::remember('medicine_masters', 100, fn() => MedicineMaster::select('id', 'name')->orderBy('name')->get());

        $billingtype = BillingType::select('id', 'name', 'default_amount')
            ->where('doctor_id', auth()->id())
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return view('doctor.upload-consult-prescriptions', compact(
            'patient', 
            'doctors', 
            'appointments',
            'Allsymptoms',
            'Allexamination',
            'Alllabtest',
            'Alldignolisis',
            'Allmedicines',
            'billingtype'
        ));
    }



    public function saveConsultation(Request $request, $id)
    {
        DB::beginTransaction();
        
        try {
            $consultationData = $request->consultation_data;
            
            // Save consultation
            $consultation = Consultation::create([
                'patient_id' => $id,
                'doctor_id' => auth()->id(),
                'appointment_id' => $consultationData['appointment_id'] ?? null,
                'symptoms' => $consultationData['symptoms'] ?? [],
                'examination' => $consultationData['examination'] ?? [],
                'diagnosis' => $consultationData['diagnosis'] ?? [],
                'lab_tests' => $consultationData['lab_tests'] ?? [],
                'symptoms_note' => $consultationData['symptoms_note'] ?? '',
                'examination_note' => $consultationData['examination_note'] ?? '',
                'diagnosis_note' => $consultationData['diagnosis_note'] ?? '',
                'lab_note' => $consultationData['lab_note'] ?? '',
                'medications_note' => $consultationData['medications_note'] ?? '',
                'medical_history' => $consultationData['medical_history'] ?? '',
                'private_notes' => $consultationData['private_notes'] ?? '',
                'medical_records' => $consultationData['medical_records'] ?? '',
                'lab_results' => $consultationData['lab_results'] ?? '',
                'follow_up_date' => $consultationData['additional_info']['follow_up']['text'] ?? null,
                'additional_notes' => $consultationData['additional_info']['follow_up']['notes'] ?? null,
                'status' => 'completed'
            ]);

            // Mark the appointment as completed
            if (!empty($consultationData['appointment_id'])) {
                Appointment::where('id', $consultationData['appointment_id'])->update(['status' => 'completed']);
            }
            
            // Save medications
            if (!empty($consultationData['medications'])) {
                foreach ($consultationData['medications'] as $medicine) {
                    ConsultationMedication::create([
                        'consultation_id' => $consultation->id,
                        'medicine_name' => $medicine['medicine'] ?? '',
                        'dosage' => $medicine['dose'] ?? '',
                        'frequency' => $medicine['frequency'] ?? '',
                        'duration' => $medicine['duration'] ?? '',
                        'instructions' => $medicine['note'] ?? '',
                        'before_after_food' => $medicine['when'] ?? '',
                    ]);
                }
            }

            // Additional Info (Dynamic Modules as JSON)
            if (isset($consultationData['additional_info']) && isset($consultationData['additional_info']['modules'])) {
                $consultation->update([
                    'additional_info' => $consultationData['additional_info']['modules']
                ]);
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Consultation saved successfully',
                'consultation_id' => $consultation->id
            ]);
            
        } catch (\Exception $e) {
            DB::rollback();
            
            return response()->json([
                'success' => false,
                'message' => 'Error saving consultation: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getConsultationDetails($appointment_id)
    {
        try {
            // Strategy 1: Find by exact appointment ID
            $consultation = Consultation::with(['medications', 'prescriptionUploads', 'symptoms', 'examinations', 'diagnoses', 'labTests'])
                ->where('appointment_id', $appointment_id)
                ->first();
                
            // Strategy 2: If not found, try to find by patient and appointment date
            if (!$consultation) {
                $appointment = Appointment::find($appointment_id);
                if ($appointment) {
                    $consultation = Consultation::with(['medications', 'prescriptionUploads', 'symptoms', 'examinations', 'diagnoses', 'labTests'])
                        ->where('patient_id', $appointment->patient_id)
                        ->whereDate('consultation_date', $appointment->date)
                        ->first();
                }
            }
            
            // Strategy 3: Still not found? Look for the absolute latest for this patient
            if (!$consultation && isset($appointment)) {
                $consultation = Consultation::with(['medications', 'prescriptionUploads', 'symptoms', 'examinations', 'diagnoses', 'labTests'])
                    ->where('patient_id', $appointment->patient_id)
                    ->latest()
                    ->first();
            }
            
            if (!$consultation) {
                $appt = Appointment::find($appointment_id);
                return response()->json([
                    'success' => false,
                    'message' => 'No medical records found for this patient yet',
                    'patient_id' => $appt ? $appt->patient_id : null
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'consultation' => $consultation,
                'is_fallback' => ($consultation->appointment_id != $appointment_id)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching records: ' . $e->getMessage()
            ], 500);
        }
    }
}
















// public function showconsultation($id)
// {
//     $patient = \App\Models\User::findOrFail($id);
   
//     $doctors = User::where('role', 'doctor')->get();
//     $appointments = Appointment::where('patient_id', $id)->orderBy('created_at', 'desc')->first();

//     $Allsymptoms = Cache::remember('allstate', 600, fn() => Symptom::select('id', 'name')->orderBy('name')->get());
//     $Allexamination = Cache::remember('allstate', 600, fn() => Examination::select('id', 'name')->orderBy('name')->get());
//     $Alldignolisis = Cache::remember('allstate', 600, fn() => Examination::select('id', 'name')->orderBy('name')->get());
//     $Alllabtest = Cache::remember('allstate', 600, fn() => Examination::select('id', 'name')->orderBy('name')->get());

//     return view('doctor.consultation', compact('patient', 'doctors', 'appointments','Allsymptoms','Allexamination','Alllabtest','Alldignolisis'));
// }



//  public function showconsultations($id){

//     $patient = \App\Models\User::findOrFail($id);

//     $doctors = User::where('role', 'doctor')->get();

//     $appointments = \App\Models\Appointment::all();

//     return view('doctor.consultation', compact('patient', 'doctors', 'appointments'));
// }

