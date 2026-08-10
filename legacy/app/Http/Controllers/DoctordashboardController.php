<?php

namespace App\Http\Controllers;
use App\Models\User;
use App\Enums\Salutation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Carbon;
use App\Exports\UsersExport;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\File;
use App\Models\Appointment;
use App\Models\Income;
use App\Models\Expense;
use App\Models\TestBooking;
use Illuminate\Support\Facades\Storage;
use App\Models\DoctorConsultPdf;
use App\Models\Billing;
use Illuminate\Support\Str;
use App\Models\SupportTicket;
use App\Models\SupportTicketMessage;
use App\Models\SupportVideo;
use App\Services\DoctorDashboardService;


class DoctordashboardController extends Controller
{
    public function index(DoctorDashboardService $dashboardService)
    {
        $doctorId = auth()->user()->getDoctorIdContext();
        $data     = $dashboardService->getDashboardData($doctorId);

        // Keep $appointments as some older blade checks may reference it
        $data['appointments'] = $data['recentAppointments'];

        return view('doctor.dashboard', $data);
    }

    public function showAppointment($id)
    {
        $appointment = Appointment::with('patient')
            ->where('doctor_id', auth()->user()->getDoctorIdContext())
            ->where('id', $id)
            ->firstOrFail();

        return response()->json($appointment);
    }


    // Private helper methods moved to App\Services\DoctorDashboardService



 public function exportUsers(){
    session()->flash('success', 'Total Patients exported successfully');
    return Excel::download(new UsersExport, 'Patients-details.xlsx');
    }




    public function register_patient()
    {
        $doctorId = auth()->user()->getDoctorIdContext();
        $patients = User::where('reference_role_id', $doctorId)
            ->where('role', 'patient')->orderBy('created_at', 'desc')
            ->paginate(10);
        $salutations = Salutation::cases();
        return view('doctor.patient-registration', compact('patients', 'salutations'));
    }

   public function store(Request $request)
{
    $validator = Validator::make($request->all(), [
        'referred_by' => 'nullable|string|max:255',
        'name'        => 'required|string|max:255',
        'email'       => 'nullable|email:rfc,dns|max:255|unique:users,email',
        'gender'      => 'required|in:Male,Female,Other',
        'phone'       => 'required|regex:/^[\+]?[0-9]{10,15}$/|max:20',
        'dob'         => 'required|date',
        'address'     => 'required|string',
        'pincode'     => 'nullable|string|max:7',
        'city'        => 'nullable|string|max:100',
        'state'       => 'nullable|string|max:100',
        'street_address' => 'nullable|string|max:200',
        'salutation'  => 'nullable|string|max:20',
        'aadhaar_no'  => 'nullable|digits:12',
        'profile_photo' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'message' => $validator->errors()->first()
        ], 422);
    }

    $pass = Str::random(10);   // better than hard-coded password

    do {
        $regid = 'PAT' . rand(1000000, 9999999);
    } while (User::where('registration_id', $regid)->exists());

    $profile_photo_path = null;
    if ($request->hasFile('profile_photo')) {
        $image = $request->file('profile_photo');
        $imageName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
        $destinationPath = public_path('uploads/profile');
        if (!File::exists($destinationPath)) {
            File::makeDirectory($destinationPath, 0777, true);
        }
        $image->move($destinationPath, $imageName);
        $profile_photo_path = 'uploads/profile/' . $imageName;
    }

    $patient = User::create([
        'role'              => 'patient',
        'registration_id'   => $regid,
        'reference_role_id' => auth()->user()->getDoctorIdContext(),
        'referred_by'       => $request->referred_by,
        'name'              => $request->name,
        'email'             => $request->email,
        'password'          => Hash::make($pass),
        'gender'            => $request->gender,
        'phone'             => $request->phone,
        'dob'               => $request->dob,
        'address'           => $request->address,
        'pincode'           => $request->pincode,
        'city'              => $request->city,
        'state'             => $request->state,
        'street_address'    => $request->street_address,
        'salutation'        => $request->salutation,
        'aadhaar_no'        => $request->aadhaar_no,
        'profile_photo_path' => $profile_photo_path,
    ]);

    return response()->json([
        'success'   => true,
        'message'   => 'Patient added successfully!',
        'patient_id' => $patient->id
    ]);
}

    public function show($id)
    {
        $patient = User::where('id', $id)
            ->where('reference_role_id', auth()->user()->getDoctorIdContext())
            ->firstOrFail();
        return response()->json(['success' => true, 'data' => $patient]);
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'referred_by' => 'nullable|string|max:255',
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255|unique:users,email,' . $id,
            'gender' => 'required|in:Male,Female,Other',
            'phone' => 'required|string|max:20',
            'dob' => 'required|date',
            'address' => 'nullable|string',
            'pincode' => 'nullable|string|max:7',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'street_address' => 'nullable|string|max:255',
            'salutation' => 'nullable|string|max:20',
            'aadhaar_no' => 'nullable|digits:12',
            'profile_photo' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 422);
        }

        $patient = User::where('id', $id)
            ->where('reference_role_id', auth()->user()->getDoctorIdContext())
            ->firstOrFail();

        $data = $request->only([
            'referred_by', 'name', 'email', 'gender', 'phone', 'dob', 'address',
            'pincode', 'city', 'state', 'street_address', 'salutation', 'aadhaar_no'
        ]);

        if ($request->hasFile('profile_photo')) {
            if (!empty($patient->profile_photo_path) && File::exists(public_path($patient->profile_photo_path))) {
                File::delete(public_path($patient->profile_photo_path));
            }
            $image = $request->file('profile_photo');
            $imageName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
            $destinationPath = public_path('uploads/profile');
            if (!File::exists($destinationPath)) {
                File::makeDirectory($destinationPath, 0777, true);
            }
            $image->move($destinationPath, $imageName);
            $data['profile_photo_path'] = 'uploads/profile/' . $imageName;
        }

        $patient->update($data);

        return response()->json(['success' => true, 'message' => 'Patient updated successfully']);
    }

    public function destroy($id)
    {
        $patient = User::where('id', $id)
            ->where('reference_role_id', auth()->user()->getDoctorIdContext())
            ->firstOrFail();

        $patient->delete();

        return response()->json([
            'success' => true,
            'message' => 'Patient deleted successfully'
        ]);
    }

 public function filter_patients(Request $request)
{

    $doctorId = auth()->user()->getDoctorIdContext();
    $query = User::where('reference_role_id', $doctorId)
        ->where('role', 'patient')->orderBy('created_at', 'desc');

    if ($request->filled('name')) {
        $query->where('name', 'like', '%' . $request->name . '%');
    }

    if ($request->filled('phone')) {
        $query->where('phone', 'like', '%' . $request->phone . '%');
    }



    if ($request->filled('start_date') && $request->filled('end_date')) {
        $start = Carbon::parse($request->start_date)->startOfDay();
        $end = Carbon::parse($request->end_date)->endOfDay();
        $query->whereBetween('created_at', [$start, $end]);
    }

    $patients = $query->paginate(10)->appends($request->query());

    return response()->json([
        'success' => true,
        'patients' => $patients->items(), 
        'pagination' => [
        'links' => $patients->links('pagination::bootstrap-5')->toHtml() 
        ]
    ]);
}


    public function doctorsupport(){
        $doctorId = auth()->user()->getDoctorIdContext();
        $tickets = SupportTicket::select('id', 'user_id', 'subject', 'status', 'created_at')
            ->where('user_id', $doctorId)
            ->with(['messages' => function($query) {
                $query->select('id', 'support_ticket_id', 'sender_id', 'message', 'is_admin_reply', 'attachment_path', 'attachment_type', 'created_at')
                      ->orderBy('created_at', 'asc');
            }])
            ->orderBy('created_at', 'desc')
            ->get();
            
        $videos = SupportVideo::select('id', 'title', 'description', 'video_type', 'video_url', 'video_path', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();
            
        return view('doctor.support', compact('tickets', 'videos'));
    }

    public function storeSupportTicket(Request $request)
    {
        $request->validate([
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
            'attachment' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240'
        ]);

        $ticket = SupportTicket::create([
            'user_id' => auth()->user()->getDoctorIdContext(),
            'subject' => $request->subject,
            'status' => 'open'
        ]);

        $attachmentPath = null;
        $attachmentType = null;

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $extension = $file->getClientOriginalExtension();
            $filename = time() . '_' . uniqid() . '.' . $extension;
            $destinationPath = public_path('uploads/support_attachments');

            if (!File::exists($destinationPath)) {
                File::makeDirectory($destinationPath, 0777, true);
            }

            $file->move($destinationPath, $filename);
            $attachmentPath = 'uploads/support_attachments/' . $filename;
            $attachmentType = in_array(strtolower($extension), ['pdf']) ? 'pdf' : 'image';
        }

        SupportTicketMessage::create([
            'support_ticket_id' => $ticket->id,
            'sender_id' => auth()->id(),
            'message' => $request->message,
            'is_admin_reply' => false,
            'attachment_path' => $attachmentPath,
            'attachment_type' => $attachmentType
        ]);

        return redirect()->back()->with('success', 'Support ticket submitted successfully!');
    }

    public function showSupportTicket($id)
    {
        $doctorId = auth()->user()->getDoctorIdContext();
        $ticket = SupportTicket::where('user_id', $doctorId)
            ->with(['messages' => function($query) {
                $query->select('id', 'support_ticket_id', 'sender_id', 'message', 'is_admin_reply', 'attachment_path', 'attachment_type', 'created_at')
                      ->orderBy('created_at', 'asc');
            }])
            ->findOrFail($id);
            
        return view('doctor.support-show', compact('ticket'));
    }

    public function replySupportTicket(Request $request, $id)
    {
        $request->validate([
            'message' => 'required|string',
            'attachment' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240'
        ]);

        $ticket = SupportTicket::where('user_id', auth()->user()->getDoctorIdContext())->findOrFail($id);

        $attachmentPath = null;
        $attachmentType = null;

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $extension = $file->getClientOriginalExtension();
            $filename = time() . '_' . uniqid() . '.' . $extension;
            $destinationPath = public_path('uploads/support_attachments');

            if (!File::exists($destinationPath)) {
                File::makeDirectory($destinationPath, 0777, true);
            }

            $file->move($destinationPath, $filename);
            $attachmentPath = 'uploads/support_attachments/' . $filename;
            $attachmentType = in_array(strtolower($extension), ['pdf']) ? 'pdf' : 'image';
        }

        $message = SupportTicketMessage::create([
            'support_ticket_id' => $ticket->id,
            'sender_id' => auth()->id(),
            'message' => $request->message,
            'is_admin_reply' => false,
            'attachment_path' => $attachmentPath,
            'attachment_type' => $attachmentType
        ]);

        if ($request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Reply sent successfully!',
                'data' => [
                    'id' => $message->id,
                    'message' => $message->message,
                    'is_admin_reply' => $message->is_admin_reply,
                    'attachment_path' => $message->attachment_path ? asset($message->attachment_path) : null,
                    'attachment_type' => $message->attachment_type,
                    'created_at' => $message->created_at->format('M d, h:i A')
                ]
            ]);
        }

        return redirect()->back()->with('success', 'Reply sent successfully!');
    }

    public function getSupportMessages($id)
    {
        $ticket = SupportTicket::select('id', 'user_id')
            ->where('user_id', auth()->user()->getDoctorIdContext())
            ->findOrFail($id);
            
        $last_id = request('last_id', 0);
        
        $messages = $ticket->messages()
            ->select('id', 'message', 'is_admin_reply', 'attachment_path', 'attachment_type', 'created_at')
            ->where('id', '>', $last_id)
            ->get();
        
        $formattedMessages = $messages->map(function($msg) {
            return [
                'id' => $msg->id,
                'message' => $msg->message,
                'is_admin_reply' => (bool)$msg->is_admin_reply,
                'attachment_path' => $msg->attachment_path ? asset($msg->attachment_path) : null,
                'attachment_type' => $msg->attachment_type,
                'created_at' => $msg->created_at->format('M d, h:i A')
            ];
        });

        return response()->json([
            'success' => true,
            'messages' => $formattedMessages
        ]);
    }

        public function updateProfile(Request $request, $id)
        {
            $user = User::findOrFail($id);

            $request->validate([
                'name' => 'nullable|string|max:255',
                'phone' => 'nullable|string|max:10',
                'gender' => 'nullable|in:Male,Female,Other',
                'address' => 'nullable|string',
                'dob' => 'nullable|date',
                'new_password' => 'nullable|string|min:6|confirmed',
                'profile_photo' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            ]);

            $data = [
                'name' => $request->name,
                'email' => auth()->user()->email,
                'phone' => $request->phone,
                'gender' => $request->gender,
                'address' => $request->address,
                'dob' => $request->dob,
            ];
        if (!empty($request->new_password)) {
                $data['password'] = Hash::make($request->new_password);
            }

            if ($request->hasFile('profile_photo')) {
                if (!empty($user->profile_photo_path) && File::exists(public_path($user->profile_photo_path))) {
                    File::delete(public_path($user->profile_photo_path));
                }
                $image = $request->file('profile_photo');
                $imageName = time() . '.' . $image->getClientOriginalExtension();
                $destinationPath = public_path('uploads/profile');
                if (!File::exists($destinationPath)) {
                    File::makeDirectory($destinationPath, 0777, true);
                }

                $image->move($destinationPath, $imageName);
                $data['profile_photo_path'] = 'uploads/profile/' . $imageName;
            }

            $user->update($data);

            return back()->with('success', 'Profile updated successfully!');
        }


        public function consultPdf()
        {
            $consultPdf = DoctorConsultPdf::where('doctor_id', auth()->user()->getDoctorIdContext())->first();
            return view('doctor.doctor-consult-pdf', compact('consultPdf'));
        }

       public function updateConsultPdf(Request $request, $id)
        {
            if ($id != auth()->user()->getDoctorIdContext()) {
                abort(403, 'Unauthorized');
            }

            $request->validate([
                'pdf' => 'required|file|mimes:pdf|max:20480', 
            ]);

            $destinationPath = public_path('doctor_consult_pdfs');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }
            $file = $request->file('pdf');
            $filename = time() . '_' . $file->getClientOriginalName();   
            $file->move($destinationPath, $filename);

            $pdf_path = 'doctor_consult_pdfs/' . $filename;
            $oldPdf = DoctorConsultPdf::where('doctor_id', Auth::id())->first();
            if ($oldPdf && $oldPdf->pdf_path && file_exists(public_path($oldPdf->pdf_path))) {
                unlink(public_path($oldPdf->pdf_path));
            }
            DoctorConsultPdf::updateOrCreate(
                ['doctor_id' => auth()->user()->getDoctorIdContext()],
                ['pdf_path' => $pdf_path]
            );
            return redirect()->route('doctor.consult-pdf')->with('success', 'Consultation PDF successfully uploaded!');
        }

        public function trialExpired()
        {
            $currentUser = auth()->user();
            $doctorId = $currentUser->getDoctorIdContext();
            $doctor = ($doctorId === $currentUser->id) ? $currentUser : User::find($doctorId);

            if (!$doctor || $doctor->role !== 'doctor' || !$doctor->trial_ends_at || now()->lt($doctor->trial_ends_at)) {
                return redirect()->route('doctor.dashboard');
            }

            $settings = \App\Models\CompanySetting::find(1);

            return view('doctor.trial-expired', compact('settings', 'doctor'));
        }
}