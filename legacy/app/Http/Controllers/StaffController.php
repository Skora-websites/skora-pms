<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use App\Models\StaffAttendance;
use Carbon\Carbon;

class StaffController extends Controller
{
    public function index()
    {
        // Get all users under the current doctor who have 'receptionist' role (staff)
        $staffMembers = User::where('reference_role_id', auth()->id())
            ->where('role', 'receptionist') // base system role for all staff
            ->with('roles') // load Spatie roles
            ->orderBy('id', 'desc')
            ->get();

        $roles = Role::where('doctor_id', auth()->id())->get();

        return view('doctor.my-staff', compact('staffMembers', 'roles'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:8',
            'role_name' => 'required|string|exists:roles,name'
        ]);

        $user = User::create([
            'reference_role_id' => auth()->id(),
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'role' => 'receptionist', // base role for staff login routing
        ]);

        // Verify Role exists for this doctor
        $role = Role::where('name', $request->role_name)->where('doctor_id', auth()->id())->firstOrFail();

        // Assign Spatie Role
        $user->assignRole($role);

        return response()->json(['success' => true, 'message' => 'Staff added successfully!']);
    }

    public function update(Request $request, $id)
    {
        $user = User::where('reference_role_id', auth()->id())->findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'role_name' => 'required|string|exists:roles,name'
        ]);

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
        ]);

        if ($request->filled('password')) {
            $user->update(['password' => Hash::make($request->password)]);
        }

        // Verify Role exists for this doctor
        $role = Role::where('name', $request->role_name)->where('doctor_id', auth()->id())->firstOrFail();

        // Sync Spatie Role
        $user->syncRoles([$role]);

        return response()->json(['success' => true, 'message' => 'Staff updated successfully!']);
    }

    public function destroy($id)
    {
        $user = User::where('reference_role_id', auth()->id())->findOrFail($id);

        // Optional: Ensure not deleting yourself or a patient
        if ($user->role !== 'receptionist') {
            return response()->json(['success' => false, 'message' => 'Action not allowed.'], 403);
        }

        $user->delete();

        return response()->json(['success' => true, 'message' => 'Staff removed successfully!']);
    }

    public function getAttendanceData(Request $request)
    {
        $date = $request->input('date', date('Y-m-d'));
        
        $staffMembers = User::where('reference_role_id', auth()->id())
            ->where('role', 'receptionist')
            ->orderBy('name', 'asc')
            ->get();

        $attendances = StaffAttendance::where('doctor_id', auth()->id())
            ->where('date', $date)
            ->get()
            ->keyBy('staff_id');

        $data = $staffMembers->map(function ($staff) use ($attendances) {
            $att = $attendances->get($staff->id);
            return [
                'id' => $staff->id,
                'name' => $staff->name,
                'email' => $staff->email,
                'phone' => $staff->phone,
                'role' => $staff->roles->first()->name ?? 'Staff',
                'attendance' => $att ? [
                    'status' => $att->status,
                    'check_in' => $att->check_in ? substr($att->check_in, 0, 5) : null,
                    'check_out' => $att->check_out ? substr($att->check_out, 0, 5) : null,
                    'notes' => $att->notes,
                ] : null
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function saveAttendance(Request $request)
    {
        $request->validate([
            'date' => 'required|date_format:Y-m-d',
            'attendance' => 'required|array',
            'attendance.*.staff_id' => 'required|integer|exists:users,id',
            'attendance.*.status' => 'required|string|in:present,absent,half_day,leave',
            'attendance.*.check_in' => 'nullable|string',
            'attendance.*.check_out' => 'nullable|string',
            'attendance.*.notes' => 'nullable|string'
        ]);

        $date = $request->input('date');
        $doctorId = auth()->id();
        $attendanceData = $request->input('attendance', []);

        foreach ($attendanceData as $att) {
            // Verify this staff is indeed under this doctor
            $staff = User::where('id', $att['staff_id'])
                ->where('reference_role_id', $doctorId)
                ->first();

            if ($staff) {
                StaffAttendance::updateOrCreate(
                    [
                        'staff_id' => $att['staff_id'],
                        'date' => $date
                    ],
                    [
                        'doctor_id' => $doctorId,
                        'status' => $att['status'],
                        'check_in' => in_array($att['status'], ['present', 'half_day']) ? ($att['check_in'] ?: null) : null,
                        'check_out' => in_array($att['status'], ['present', 'half_day']) ? ($att['check_out'] ?: null) : null,
                        'notes' => $att['notes'] ?? null
                    ]
                );
            }
        }

        return response()->json(['success' => true, 'message' => 'Attendance saved successfully!']);
    }

    public function getAttendanceReport(Request $request)
    {
        $month = $request->input('month', date('n'));
        $year = $request->input('year', date('Y'));

        $daysInMonth = Carbon::create($year, $month, 1)->daysInMonth;
        
        $staffQuery = User::where('reference_role_id', auth()->id())
            ->where('role', 'receptionist');
            
        if ($request->filled('staff_id')) {
            $staffQuery->where('id', $request->input('staff_id'));
        }
        
        $staffMembers = $staffQuery->orderBy('name', 'asc')->get();

        $startDate = sprintf('%04d-%02d-01', $year, $month);
        $endDate = sprintf('%04d-%02d-%02d', $year, $month, $daysInMonth);

        $attendances = StaffAttendance::where('doctor_id', auth()->id())
            ->whereBetween('date', [$startDate, $endDate])
            ->get();

        $report = [];
        foreach ($staffMembers as $staff) {
            $staffAtts = $attendances->where('staff_id', $staff->id);
            
            $presentCount = $staffAtts->where('status', 'present')->count();
            $absentCount = $staffAtts->where('status', 'absent')->count();
            $halfDayCount = $staffAtts->where('status', 'half_day')->count();
            $leaveCount = $staffAtts->where('status', 'leave')->count();
            
            $days = [];
            for ($d = 1; $d <= $daysInMonth; $d++) {
                $dateStr = sprintf('%04d-%02d-%02d', $year, $month, $d);
                $record = $staffAtts->where('date', $dateStr)->first();
                $days[$d] = $record ? [
                    'status' => $record->status,
                    'check_in' => $record->check_in ? substr($record->check_in, 0, 5) : null,
                    'check_out' => $record->check_out ? substr($record->check_out, 0, 5) : null,
                    'notes' => $record->notes
                ] : null;
            }

            $report[] = [
                'staff_id' => $staff->id,
                'name' => $staff->name,
                'email' => $staff->email,
                'phone' => $staff->phone,
                'summary' => [
                    'present' => $presentCount,
                    'absent' => $absentCount,
                    'half_day' => $halfDayCount,
                    'leave' => $leaveCount,
                    'total_marked' => $staffAtts->count()
                ],
                'days' => $days
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'report' => $report,
                'days_in_month' => $daysInMonth,
                'month' => (int)$month,
                'year' => (int)$year
            ]
        ]);
    }
}
