<?php

namespace App\Http\Controllers;

use App\Models\Consultation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class ConsultationController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'patient_id' => 'required|exists:users,id',
            // Baaki optional
        ]);

        // dd($request->all());
        $consultation = null;
        DB::transaction(function () use ($request, &$consultation) {
            $consultation = Consultation::create([
                'patient_id'       => $request->patient_id,
                'doctor_id'        => auth()->id(),
                'appointment_id'   => $request->appointment_id ?? null,
                'consultation_date'=> now(),
                'symptoms_note'    => $request->symptoms_note ?? null,
                'examination_note' => $request->examination_note ?? null,
                'diagnosis_note'   => $request->diagnosis_note ?? null,
                'lab_note'         => $request->lab_note ?? null,
                'medications_note' => $request->medications_note ?? null,
                'medical_history'  => $request->medical_history ?? null,
                'private_notes'    => $request->private_notes ?? null,
                'medical_records'  => $request->medical_records ?? null,
                'lab_results'      => $request->lab_results ?? null,
                'follow_up_date'   => (function() use ($request) {
                    $text = (isset($request->additional_info) && isset($request->additional_info['follow_up'])) ? $request->additional_info['follow_up']['text'] : null;
                    if (!$text) return null;
                    
                    // Simple parsing for common intervals to help with date-based filtering
                    $date = null;
                    $today = \Carbon\Carbon::today();
                    if (stripos($text, '2 Days') !== false) $date = $today->addDays(2);
                    elseif (stripos($text, '1 Week') !== false) $date = $today->addWeek();
                    elseif (stripos($text, '2 Weeks') !== false) $date = $today->addWeeks(2);
                    elseif (stripos($text, '1 Month') !== false) $date = $today->addMonth();
                    
                    if ($date) {
                        return $text . " (" . $date->format('Y-m-d') . ")";
                    }
                    return $text;
                })(),
                'additional_notes' => (isset($request->additional_info) && isset($request->additional_info['follow_up'])) ? $request->additional_info['follow_up']['notes'] : null,
            ]);

            // Update Appointment Vitals (Height, Weight, Blood Group, BP) if appointment_id exists and fields are provided
            if ($request->appointment_id) {
                $vitals = [];
                if ($request->has('height'))      $vitals['height']      = $request->height;
                if ($request->has('weight'))      $vitals['weight']      = $request->weight;
                if ($request->has('bp'))          $vitals['bp']          = $request->bp;
                if ($request->has('blood_group')) $vitals['blood_group'] = $request->blood_group;

                if (!empty($vitals)) {
                    \App\Models\Appointment::where('id', $request->appointment_id)->update($vitals);
                }
            }

            // Symptoms
            if ($request->has('symptoms')) {
                foreach ($request->symptoms as $s) {
                    $consultation->symptoms()->create([
                        'symptom' => $s['item'],
                        'note'    => $s['note'] ?? ''
                    ]);
                }
            }

            // Examinations
            if ($request->has('examination')) {
                foreach ($request->examination as $e) {
                    $consultation->examinations()->create([
                        'examination_name' => $e['item'],
                        'note'        => $e['note'] ?? ''
                    ]);
                }
            }

            // Diagnoses
            if ($request->has('diagnosis')) {
                foreach ($request->diagnosis as $d) {
                    $consultation->diagnoses()->create([
                        'diagnosis_name' => $d['item'],
                        'note'      => $d['note'] ?? ''
                    ]);
                }
            }

            // Lab Tests
            if ($request->has('lab_tests')) {
                foreach ($request->lab_tests as $l) {
                    $consultation->labTests()->create([
                        'lab_test_name' => $l['item'],
                        'note'     => $l['note'] ?? ''
                    ]);
                }
            }

            // Medications (with order)
            if ($request->has('medications')) {
                foreach ($request->medications as $key => $m) {
                    $consultation->medications()->create([
                        'medicine_name' => $m['medicine'],
                        'dose'          => $m['dose'] ?? null,
                        'frequency'     => $m['frequency'] ?? null,
                        'when_to_take'  => $m['when'] ?? null,
                        'duration'      => $m['duration'] ?? null,
                        'note'          => $m['note'] ?? null,
                        'order'         => $key + 1,  
                    ]);
                }
            }

            // Additional Info (Dynamic Modules as JSON)
            if ($request->has('additional_info') && isset($request->additional_info['modules'])) {
                $consultation->update([
                    'additional_info' => $request->additional_info['modules']
                ]);
            }

            // Update appointment status to completed
            if ($request->appointment_id) {
                \App\Models\Appointment::where('id', $request->appointment_id)->update(['status' => 'completed']);
            }
        });

        return response()->json(['success' => true, 'consultation_id' => $consultation->id]);
    }

    public function generatePdf($id)
    {
        $consultation = Consultation::with([
            'patient', 'doctor', 'appointment',
            'symptoms', 'examinations', 'diagnoses', 'labTests',
            'medications' => function($query) { $query->orderBy('order', 'asc'); }
        ])->findOrFail($id);

        $pdf = Pdf::loadView('doctor.consultations-pdf', compact('consultation'));
        return $pdf->stream('consultation-' . $id . '.pdf');  // Open in browser for print
    }

    public function followUps(Request $request)
    {
        $status = $request->input('status', 'pending');
        
        $query = Consultation::with(['patient', 'doctor', 'appointment'])
            ->whereNotNull('follow_up_date')
            ->where('follow_up_status', $status)
            ->orderBy('created_at', 'desc');

        if ($request->filled('date')) {
            $date = $request->date; // e.g. 2026-04-08
            $dt = \Carbon\Carbon::parse($date);

            $query->where(function ($q) use ($date, $dt) {
                // 1. Direct match (for records which have the date string in them)
                $q->where('follow_up_date', 'LIKE', '%' . $date . '%');

                // 2. Relative match (for records with text like 'After 2 Days', '1 Week', etc.)
                $q->orWhere(function ($sub) use ($dt) {
                    $sub->where('follow_up_date', 'LIKE', '%2 Days%')
                        ->whereDate('created_at', $dt->copy()->subDays(2));
                })
                ->orWhere(function ($sub) use ($dt) {
                    $sub->where('follow_up_date', 'LIKE', '%1 Week%')
                        ->whereDate('created_at', $dt->copy()->subWeek());
                })
                ->orWhere(function ($sub) use ($dt) {
                    $sub->where('follow_up_date', 'LIKE', '%2 Weeks%')
                        ->whereDate('created_at', $dt->copy()->subWeeks(2));
                })
                ->orWhere(function ($sub) use ($dt) {
                    $sub->where('follow_up_date', 'LIKE', '%1 Month%')
                        ->whereDate('created_at', $dt->copy()->subMonth());
                });
            });
        }

        $followUps = $query->paginate(20);
        return view('doctor.follow-ups', compact('followUps', 'status'));
    }

    public function updateFollowUpStatus(Request $request, $id)
    {
        $consultation = Consultation::findOrFail($id);
        $consultation->update([
            'follow_up_status' => $request->status ?? 'addressed',
            'follow_up_comment' => $request->comment
        ]);
        
        return response()->json(['success' => true, 'message' => 'Follow up status updated.']);
    }
}