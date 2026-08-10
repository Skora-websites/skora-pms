<?php

namespace App\Http\Controllers;

use App\Models\DoctorClinic;
use App\Models\DoctorSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\File;

class DoctorSchedulingController extends Controller
{
    public function index()
    {
        $doctorId = auth()->user()->getDoctorIdContext();
        $clinics = DoctorClinic::with(['schedules' => function($query) {
                            $query->where('is_active', true)
                                  ->orderBy('day_of_week');
                        }])
                        ->where('doctor_id', $doctorId)
                        ->get();

        return view('doctor.doctor-schedule', compact('clinics'));
    }

    public function storeClinic(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'clinic_name' => 'required|string|max:255',
            'address_type' => 'required|in:manual,map',
            'address' => 'required_if:address_type,manual|nullable|string',
            'latitude' => 'required_if:address_type,map|nullable|numeric',
            'longitude' => 'required_if:address_type,map|nullable|numeric',
            'phone' => 'required|string|max:20',
            'consultation_fee' => 'required|numeric|min:0',
            'clinic_logo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Optional: Check if doctor already has a clinic (if you want to limit to one)
            // $existingClinic = DoctorClinic::where('doctor_id', Auth::id())->first();
            // if ($existingClinic) {
            //    return response()->json([
            //         'success' => false,
            //         'message' => 'You can not add another clinic. Please contact Customer Support.'
            //     ], 200);
            // }

            $data = [];
            if ($request->hasFile('clinic_logo')) {
                $image = $request->file('clinic_logo');
                $imageName = time() . '.' . $image->getClientOriginalExtension();
                $destinationPath = public_path('uploads/clinic/');
                if (!File::exists($destinationPath)) {
                    File::makeDirectory($destinationPath, 0777, true);
                }
                $image->move($destinationPath, $imageName);
                $data['clinic_logo'] = 'uploads/clinic/' . $imageName;
            }

            $clinic = DoctorClinic::create([
                'doctor_id' => auth()->user()->getDoctorIdContext(),
                'clinic_name' => $request->clinic_name,
                'address_type' => $request->address_type,
                'address' => $request->address,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'phone' => $request->phone,
                'consultation_fee' => $request->consultation_fee,
                'clinic_logo' => isset($data['clinic_logo']) ? $data['clinic_logo'] : null
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Clinic added successfully!',
                'clinic' => $clinic
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error adding clinic: ' . $e->getMessage()
            ], 500);
        }
    }

  public function storeSchedule(Request $request)
{
    $request->merge([
        'is_24_hours' => $request->has('is_24_hours') && $request->is_24_hours === '1'
    ]);

    $rules = [
        'doctor_clinic_id' => 'required|exists:doctor_clinics,id',
        'days' => 'required|array',
        'days.*' => 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
        'max_patients' => 'required|integer|min:1',
        'is_24_hours' => 'boolean',
        'slot_duration' => 'nullable|integer|min:5',
        'gap_duration' => 'nullable|integer|min:0',
    ];
    if (!$request->is_24_hours) {
        $rules['session_types'] = 'required|array';
        $rules['session_types.*'] = 'in:morning,afternoon,evening,night';
    }

    $validator = Validator::make($request->all(), $rules);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'message' => 'Validation error',
            'errors' => $validator->errors()
        ], 422);
    }

    try {
        $schedules = [];
        
        if ($request->is_24_hours) {
            foreach ($request->days as $day) {
                $scheduleData = [
                    'doctor_clinic_id' => $request->doctor_clinic_id,
                    'day_of_week' => $day,
                    'session_type' => 'full_day',
                    'max_patients' => $request->max_patients,
                    'is_24_hours' => true,
                    'start_time' => null,
                    'end_time' => null,
                    'duration_hours' => 24,
                    'duration_minutes' => 0,
                    'break_start_time' => null,
                    'break_end_time' => null,
                    'slot_duration' => $request->slot_duration,
                    'gap_duration' => $request->gap_duration,
                ];

                $schedule = DoctorSchedule::updateOrCreate(
                    [
                        'doctor_clinic_id' => $request->doctor_clinic_id,
                        'day_of_week' => $day,
                        'session_type' => 'full_day',
                    ],
                    array_merge($scheduleData, ['is_active' => true])
                );
                
                // Clean up any other active duplicates if they somehow exist
                DoctorSchedule::where('doctor_clinic_id', $request->doctor_clinic_id)
                    ->where('day_of_week', $day)
                    ->where('session_type', 'full_day')
                    ->where('id', '!=', $schedule->id)
                    ->update(['is_active' => false]);
                    
                $schedules[] = $schedule;
            }
        } else {
            foreach ($request->days as $day) {
                foreach ($request->session_types as $sessionType) {
                    $startTime = $request->input($sessionType . '_start_time');
                    $endTime = $request->input($sessionType . '_end_time');
                    if ($startTime && $endTime) {
                        $duration = $this->calculateDuration($startTime, $endTime);
                        
                        $scheduleData = [
                            'doctor_clinic_id' => $request->doctor_clinic_id,
                            'day_of_week' => $day,
                            'session_type' => $sessionType,
                            'max_patients' => $request->max_patients,
                            'is_24_hours' => false,
                            'start_time' => $startTime,
                            'end_time' => $endTime,
                            'duration_hours' => $duration['hours'],
                            'duration_minutes' => $duration['minutes'],
                            'break_start_time' => null,
                            'break_end_time' => null,
                            'slot_duration' => $request->slot_duration,
                            'gap_duration' => $request->gap_duration,
                        ];

                        $schedule = DoctorSchedule::updateOrCreate(
                            [
                                'doctor_clinic_id' => $request->doctor_clinic_id,
                                'day_of_week' => $day,
                                'session_type' => $sessionType,
                            ],
                            array_merge($scheduleData, ['is_active' => true])
                        );

                        // Clean up any other active duplicates if they somehow exist
                        DoctorSchedule::where('doctor_clinic_id', $request->doctor_clinic_id)
                            ->where('day_of_week', $day)
                            ->where('session_type', $sessionType)
                            ->where('id', '!=', $schedule->id)
                            ->update(['is_active' => false]);

                        $schedules[] = $schedule;
                    }
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => $request->is_24_hours ? '24 hours schedule added successfully!' : 'Schedule added successfully!',
            'schedules' => $schedules
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error adding schedule: ' . $e->getMessage()
        ], 500);
    }
}

    public function updateSchedule(Request $request, $id)
    {
        $request->merge([
            'is_24_hours' => $request->has('is_24_hours') ? true : false
        ]);

        $validator = Validator::make($request->all(), [
            'start_time' => 'nullable|string',
            'end_time' => 'nullable|string',
            'session_type' => 'required|in:morning,afternoon,evening,night',
            'max_patients' => 'nullable|integer|min:1',
            'is_24_hours' => 'boolean',
            'slot_duration' => 'nullable|integer|min:5',
            'gap_duration' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $schedule = DoctorSchedule::findOrFail($id);
            $duration = ['hours' => 0, 'minutes' => 0];
            if (!$request->is_24_hours && $request->start_time && $request->end_time) {
                $duration = $this->calculateDuration($request->start_time, $request->end_time);
            }
            
            $updateData = [
                'session_type' => $request->session_type,
                'max_patients' => $request->max_patients,
                'is_24_hours' => $request->is_24_hours,
                'duration_hours' => $duration['hours'],
                'duration_minutes' => $duration['minutes'],
                'slot_duration' => $request->slot_duration,
                'gap_duration' => $request->gap_duration,
            ];

            if (!$request->is_24_hours) {
                $updateData['start_time'] = $request->start_time;
                $updateData['end_time'] = $request->end_time;
            } else {
                $updateData['start_time'] = null;
                $updateData['end_time'] = null;
            }

            $schedule->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Schedule updated successfully!',
                'schedule' => $schedule
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating schedule: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroySchedule($id)
    {
        try {
            $schedule = DoctorSchedule::findOrFail($id);
            $schedule->update(['is_active' => false]);

            return response()->json([
                'success' => true,
                'message' => 'Schedule deleted successfully!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting schedule'
            ], 500);
        }
    }

    public function destroyClinic($id)
    {
        try {
            $clinic = DoctorClinic::findOrFail($id);
            $clinic->schedules()->update(['is_active' => false]);
            $clinic->delete();

            return response()->json([
                'success' => true,
                'message' => 'Clinic and all associated schedules deleted successfully!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting clinic'
            ], 500);
        }
    }

    public function getClinic($id)
    {
        try {
            $clinic = DoctorClinic::findOrFail($id);
            
            return response()->json([
                'success' => true,
                'clinic' => $clinic
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching clinic details'
            ], 500);
        }
    }

    public function getSchedule($id)
    {
        try {
            $schedule = DoctorSchedule::with('clinic')->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'schedule' => $schedule
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching schedule'
            ], 500);
        }
    }

    public function updateClinic(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'clinic_name' => 'required|string|max:255',
            'address_type' => 'required|in:manual,map',
            'address' => 'required_if:address_type,manual|nullable|string',
            'latitude' => 'required_if:address_type,map|nullable|numeric',
            'longitude' => 'required_if:address_type,map|nullable|numeric',
            'phone' => 'required|string|max:20',
            'consultation_fee' => 'required|numeric|min:0',
            'clinic_logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $clinic = DoctorClinic::findOrFail($id);
            
            $updateData = [
                'clinic_name' => $request->clinic_name,
                'address_type' => $request->address_type,
                'address' => $request->address,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'phone' => $request->phone,
                'consultation_fee' => $request->consultation_fee,
            ];
            
            // Fallback for address if it's map type but address is somehow null
            if ($request->address_type === 'map' && empty($updateData['address'])) {
                if ($request->latitude && $request->longitude) {
                    $updateData['address'] = "Map Location: {$request->latitude}, {$request->longitude}";
                }
            }
            
            if ($request->hasFile('clinic_logo')) {
                try {
                    if ($clinic->clinic_logo) {
                        $oldLogoPath = public_path($clinic->clinic_logo);
                        if (file_exists($oldLogoPath) && is_file($oldLogoPath)) {
                            unlink($oldLogoPath);
                        }
                    }
                    
                    $image = $request->file('clinic_logo');
                    $imageName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
                    $destinationPath = public_path('uploads/clinic/');
                    
                    if (!File::exists($destinationPath)) {
                        File::makeDirectory($destinationPath, 0777, true);
                    }
                    
                    $image->move($destinationPath, $imageName);
                    $updateData['clinic_logo'] = 'uploads/clinic/' . $imageName;
                    
                } catch (\Exception $fileException) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Error uploading logo: ' . $fileException->getMessage()
                    ], 500);
                }
            }
            
            $clinic->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Clinic updated successfully!',
                'clinic' => $clinic
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating clinic: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $clinic = DoctorClinic::with('schedules')->findOrFail($id);
            
            // Group schedules by day of week
            $groupedSchedules = [];
            foreach ($clinic->schedules->where('is_active', true) as $schedule) {
                $groupedSchedules[$schedule->day_of_week][] = $schedule;
            }
            
            return response()->json([
                'success' => true,
                'clinic' => $clinic,
                'schedules' => $groupedSchedules
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching schedule details'
            ], 500);
        }
    }

    private function calculateDuration($startTime, $endTime)
    {
        $start = \DateTime::createFromFormat('h:i A', $startTime);
        $end = \DateTime::createFromFormat('h:i A', $endTime);
        
        if (!$start || !$end) {
            return ['hours' => 0, 'minutes' => 0];
        }
        
        $interval = $start->diff($end);
        $hours = $interval->h;
        $minutes = $interval->i;
        
        // Handle overnight shifts
        if ($end < $start) {
            $hours += 24;
        }
        
        return ['hours' => $hours, 'minutes' => $minutes];
    }
}