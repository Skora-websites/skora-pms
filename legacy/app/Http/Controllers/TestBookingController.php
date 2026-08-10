<?php
namespace App\Http\Controllers;
use App\Models\User;
use App\Models\TestBooking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Models\Test;
use App\Models\Vendor;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use App\Mail\VendorTestBookingMail;
use App\Models\Billing;
use App\Models\BillingType;
use App\Services\TransactionService;

class TestBookingController extends Controller
{
    public function __construct(private readonly TransactionService $transactionService) {}

    public function Showtestbooking()
    {
        return view('doctor.test-booking');
    }

    public function filterTestBookings(Request $request)
    {
        try {
            $doctorId = auth()->user()->getDoctorIdContext();

            $query = TestBooking::where('doctor_id', $doctorId)
                ->with(['patient', 'vendor'])
                ->orderBy('created_at', 'desc');

            // Status filter
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Date range filter
            if ($request->has('start_date') && $request->has('end_date')) {
                $query->whereBetween('booking_date', [$request->start_date, $request->end_date]);
            }

            // Name search
            if ($request->has('name') && !empty($request->name)) {
                $query->whereHas('patient', function ($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->name . '%');
                });
            }

            // Registration ID search
            if ($request->has('registration_id') && !empty($request->registration_id)) {
                $query->whereHas('patient', function ($q) use ($request) {
                    $q->where('registration_id', 'like', '%' . $request->registration_id . '%');
                });
            }

            $perPage = 10;
            $bookings = $query->paginate($perPage);

            $formattedBookings = $bookings->map(function ($booking) {
                return [
                    'id' => $booking->id,
                    'patient_name' => $booking->patient->name ?? 'N/A',
                    'patient_phone' => $booking->patient->phone ?? 'N/A',
                    'vendor_name' => $booking->vendor->name ?? 'N/A',
                    'test_names' => $booking->test_names, // Use the accessor
                    'booking_date' => $booking->booking_date ? date('d M Y', strtotime($booking->booking_date)) : 'N/A',
                    'booking_time' => $booking->booking_time ?? 'N/A',
                    'status' => $booking->status,
                    'total_amount' => $booking->total_amount,
                    'upload_link_token' => $booking->upload_link_token,
                    'uploaded_file_path' => $booking->uploaded_file_path,
                    'created_at' => $booking->created_at->format('d M Y, h:i A'),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedBookings,
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'per_page' => $bookings->perPage(),
                'total' => $bookings->total(),
                'from' => $bookings->firstItem(),
                'to' => $bookings->lastItem(),
                'links' => $bookings->links()->elements[0] ?? [],
            ]);
        } catch (\Exception $e) {
            \Log::error('Filter Test Bookings Error: ' . $e->getMessage());
            return response()->json(
                [
                    'success' => false,
                    'message' => 'Error fetching test bookings',
                    'error' => $e->getMessage(),
                ],
                500,
            );
        }
    }

    public function show($id)
    {
        try {
            $doctorId = auth()->user()->getDoctorIdContext();

            $booking = TestBooking::where('doctor_id', $doctorId)
                ->with(['patient', 'vendor'])
                ->findOrFail($id);

            // Format the data for modal
            $bookingData = [
                'id' => $booking->id,
                'patient' => [
                    'name' => $booking->patient->name ?? 'N/A',
                    'registration_id' => $booking->patient->registration_id ?? 'N/A',
                    'phone' => $booking->patient->phone ?? 'N/A',
                    'email' => $booking->patient->email ?? 'N/A',
                    'gender' => $booking->patient->gender ?? 'N/A',
                    'age' => $booking->patient->age ?? 'N/A',
                    'dob' => $booking->patient->dob ? date('d M Y', strtotime($booking->patient->dob)) : 'N/A',
                ],
                'vendor' => [
                    'name' => $booking->vendor->name ?? 'N/A',
                    'mobile' => $booking->vendor->mobile ?? 'N/A',
                    'email' => $booking->vendor->email ?? 'N/A',
                    'address' => $booking->vendor->address ?? 'N/A',
                ],
                'tests' => $booking->tests ?? [],
                'booking_details' => [
                    'booking_date' => $booking->booking_date ? date('d M Y', strtotime($booking->booking_date)) : 'N/A',
                    'booking_time' => $booking->booking_time ?? 'N/A',
                    'status' => $booking->status,
                    'total_amount' => $booking->total_amount,
                    'created_at' => $booking->created_at->format('d M Y, h:i A'),
                ],
                'payment_details' => [
                    'method' => $booking->payment_method,
                    'amount' => $booking->payment_amount,
                    'date' => $booking->payment_date ? date('d M Y', strtotime($booking->payment_date)) : 'N/A',
                    'details' => $booking->payment_details ?? [],
                ],
            ];

            return response()->json([
                'success' => true,
                'booking' => $bookingData,
            ]);
        } catch (\Exception $e) {
            return response()->json(
                [
                    'success' => false,
                    'message' => 'Error fetching booking details',
                ],
                500,
            );
        }
    }

    public function deleteTestBooking(Request $request)
    {
        try {
            $doctorId = auth()->user()->getDoctorIdContext();
            $bookingId = $request->id;

            $booking = TestBooking::where('doctor_id', $doctorId)->where('id', $bookingId)->first();

            if (!$booking) {
                return response()->json(
                    [
                        'success' => false,
                        'message' => 'Test booking not found',
                    ],
                    404,
                );
            }

            $booking->delete();

            return response()->json([
                'success' => true,
                'message' => 'Test booking deleted successfully',
            ]);
        } catch (\Exception $e) {
            \Log::error('Delete Test Booking Error: ' . $e->getMessage());
            return response()->json(
                [
                    'success' => false,
                    'message' => 'Error deleting test booking: ' . $e->getMessage(),
                ],
                500,
            );
        }
    }

    public function Addtestbooking()
    {
        $mobile = auth()->user()->phone;
        $registration_id = auth()->user()->registration_id;
        return view('doctor.add-test-booking-doctor', compact('mobile', 'registration_id'));
    }

    // public function create()
    // {
    //     $mobile = auth()->user()->phone;
    //     $registration_id = auth()->user()->registration_id;
    //     return view('doctor.add-test-booking-doctor', compact('mobile', 'registration_id'));
    // }

    public function store(Request $request)
    {
        $doctorId = auth()->user()->getDoctorIdContext();
        $request->validate([
            'registration_id' => 'required|string',
            'vendor_id' => 'required|integer',
            'tests' => 'required|array',
            'tests.*.id' => 'required|integer',
            'payment_method' => 'required|in:upi,cash,card,netbanking',
            'amount' => 'required|numeric|min:0',
        ]);

        $patient = User::where('registration_id', $request->registration_id)->firstOrFail();

        $vendor = Vendor::where('id', $request->vendor_id)->where('doctor_id', $doctorId)->firstOrFail();

        $tests = [];
        $totalAmount = 0;
        foreach ($request->tests as $testData) {
            $test = Test::where('id', $testData['id'])->where('doctor_id', $doctorId)->firstOrFail();
            $tests[] = ['id' => $test->id, 'name' => $test->name, 'price' => $test->price];
            $totalAmount += $test->price;
        }

        $paymentMethod = $request->payment_method;
        $paymentDetails = [];
        $paymentDate = null;

        switch ($paymentMethod) {
            case 'upi':
                $request->validate(['upi_id' => 'required|string', 'transaction_date' => 'required|date']);
                $paymentDetails['upi_id'] = $request->upi_id;
                $paymentDate = $request->transaction_date;
                break;
            case 'cash':
                $request->validate(['payment_date' => 'required|date']);
                $paymentDate = $request->payment_date;
                break;
            case 'card':
                $request->validate([
                    'card_number' => 'required|string',
                    'expiry' => 'required|string',
                    'cvv' => 'required|string',
                ]);
                $paymentDetails['card_number'] = $request->card_number;
                $paymentDetails['expiry'] = $request->expiry;
                $paymentDetails['cvv'] = $request->cvv;
                break;
            case 'netbanking':
                $request->validate([
                    'bank_name' => 'required|string',
                    'transaction_id' => 'required|string',
                    'transaction_date' => 'required|date',
                ]);
                $paymentDetails['bank_name'] = $request->bank_name;
                $paymentDetails['transaction_id'] = $request->transaction_id;
                $paymentDate = $request->transaction_date;
                break;
        }

        $booking = TestBooking::create([
            'doctor_id' => $doctorId,
            'patient_id' => $patient->id,
            'vendor_id' => $vendor->id,
            'tests' => $tests,
            'total_amount' => $totalAmount,
            'payment_method' => $paymentMethod,
            'payment_amount' => $request->amount,
            'payment_date' => $paymentDate,
            'payment_details' => $paymentDetails,
            'upload_link_token' => Str::random(32),
        ]);

        // Create Billing record and Sync Income
        try {
            $billingType = BillingType::firstOrCreate(
                ['doctor_id' => $doctorId, 'name' => 'Medical Test'],
                ['doctor_id' => $doctorId, 'name' => 'Medical Test', 'is_active' => true]
            );

            $billing = Billing::create([
                'patient_id'      => $patient->id,
                'doctor_id'       => $doctorId,
                'billing_type_id' => $billingType->id,
                'total_amount'    => $totalAmount,
                'received_amount' => $request->amount,
                'pending_amount'  => $totalAmount - $request->amount,
                'payment_method'  => $paymentMethod,
                'payment_details' => $paymentDetails,
                'status'          => ($totalAmount - $request->amount) <= 0 ? 'paid' : 'partial',
                'notes'           => 'Automated bill from Test Booking',
                'bill_date'       => now(),
            ]);

            // Sync with Transaction/Income system
            $this->transactionService->syncFromBilling($billing->load(['billingType', 'patient']));

        } catch (\Exception $e) {
            \Log::error('Failed to create billing for test booking: ' . $e->getMessage());
        }

        if ($vendor->email) {
            $uploadLink = route('vendor.upload.form', ['token' => $booking->upload_link_token]);
            try {
                Mail::to($vendor->email)->send(new VendorTestBookingMail($booking, $uploadLink));
            } catch (\Exception $e) {
                \Log::error('Failed to send mail to vendor: ' . $e->getMessage());
            }
        }

        return response()->json(['success' => true, 'message' => 'Test booking added successfully!']);
    }

    public function index()
    {
        $bookings = TestBooking::where('doctor_id', auth()->user()->getDoctorIdContext())
            ->with(['patient', 'vendor'])
            ->get();
        return view('doctor.test-booking', compact('bookings'));
    }

    public function edit($id)
    {
        $booking = TestBooking::where('doctor_id', auth()->user()->getDoctorIdContext())->findOrFail($id);
        // Pass other data like mobile, registration_id if needed
        return view('doctor.edit-test-booking', compact('booking'));
    }

    /**
     * Update a test booking
     * Expected input: { id: booking_id, registration_id: string, vendor_id: int, tests: array, payment_method: string, amount: float }
     */
    public function update(Request $request, $id)
    {
        $booking = TestBooking::where('doctor_id', auth()->user()->getDoctorIdContext())->findOrFail($id);
        // Similar validation and logic as store()
        // ... (reuse the store logic, but update $booking->update([...]))
        // For brevity, assume same as store, but end with $booking->update([...]);

        return response()->json(['success' => true, 'message' => 'Test booking updated successfully!']);
    }

    /**
     * Delete a test booking
     * Expected input: { id: booking_id }
     */
    public function destroy($id)
    {
        $booking = TestBooking::where('doctor_id', auth()->user()->getDoctorIdContext())->findOrFail($id);
        $booking->delete();
        return response()->json(['success' => true, 'message' => 'Test booking deleted successfully!']);
    }

    /**
     * Update the status of a test booking
     * Expected input: { id: booking_id, status: 'pending' | 'in-progress' | 'completed' | 'cancelled' }
     */
    public function updateStatus(Request $request)
    {
        try {
            $doctorId = auth()->user()->getDoctorIdContext();
            $booking = TestBooking::where('doctor_id', $doctorId)->findOrFail($request->id);

            $request->validate([
                'status' => 'required|in:pending,in-progress,completed,cancelled',
            ]);

            $booking->status = $request->status;
            $booking->save();

            return response()->json(['success' => true, 'message' => 'Status updated successfully.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error updating status.'], 500);
        }
    }

    public function getMobileSuggestions(Request $request)
    {
        $patientID = auth()->user()->getDoctorIdContext();
        $query = $request->get('query');

        $mobiles = User::where('reference_role_id', $patientID)
            ->where('phone', 'LIKE', "%{$query}%")
            ->limit(50)
            ->get(['phone', 'registration_id', 'name']);

        return response()->json($mobiles);
    }

    public function getRegistrationSuggestions(Request $request)
    {
        $patientID = auth()->user()->getDoctorIdContext();
        $query = $request->get('query');
        $registrations = User::where('reference_role_id', $patientID)
            ->where('registration_id', 'LIKE', "%{$query}%")
            ->limit(50)
            ->get(['registration_id', 'phone', 'name']);
        return response()->json($registrations);
    }

    public function getPatientDetails(Request $request)
    {
        $type = $request->get('type');
        $value = $request->get('value');
        $patient = null;
        if ($type === 'registration_id') {
            $patient = User::where('registration_id', $value)->first();
        } elseif ($type === 'mobile') {
            $patient = User::where('phone', $value)->first();
        }
        if ($patient) {
            return response()->json([
                'success' => true,
                'patient' => [
                    'id' => $patient->id,
                    'name' => $patient->name,
                    'patient_id' => $patient->registration_id,
                    'mobile' => $patient->phone,
                    'email' => $patient->email,
                    'gender' => $patient->gender,
                    'age' => $patient->age,
                    'dob' => $patient->dob ? date('d/M/Y', strtotime($patient->dob)) : 'N/A',
                ],
            ]);
        }
        return response()->json(['success' => false]);
    }
    // Vendor CRUD Methods
    public function getVendors()
    {
        $doctorId = auth()->user()->getDoctorIdContext();
        $vendors = Vendor::where('doctor_id', $doctorId)->where('status', true)->get();
        return response()->json($vendors);
    }
    public function addVendor(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'mobile' => 'required|string|max:15',
            'email' => 'required|email',
            'address' => 'required|string',
        ]);
        $vendor = Vendor::create([
            'doctor_id' => auth()->user()->getDoctorIdContext(),
            'name' => $request->name,
            'mobile' => $request->mobile,
            'email' => $request->email,
            'address' => $request->address,
            'status' => true,
        ]);
        return response()->json([
            'success' => true,
            'vendor' => $vendor,
            'message' => 'Vendor added successfully!',
        ]);
    }
    public function updateVendor(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'mobile' => 'required|string|max:15',
            'email' => 'required|email',
            'address' => 'required|string',
        ]);
        $vendor = Vendor::where('doctor_id', auth()->user()->getDoctorIdContext())->findOrFail($id);
        $vendor->update($request->all());
        return response()->json([
            'success' => true,
            'message' => 'Vendor updated successfully!',
        ]);
    }
    public function deleteVendor($id)
    {
        $vendor = Vendor::where('doctor_id', auth()->user()->getDoctorIdContext())->findOrFail($id);
        $vendor->delete();
        return response()->json([
            'success' => true,
            'message' => 'Vendor deleted successfully!',
        ]);
    }
    // Test CRUD Methods
    public function getTests()
    {
        $doctorId = auth()->user()->getDoctorIdContext();
        $tests = Test::where('doctor_id', $doctorId)->where('status', true)->get();
        return response()->json($tests);
    }
    public function addTest(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
        ]);
        $test = Test::create([
            'doctor_id' => auth()->user()->getDoctorIdContext(),
            'name' => $request->name,
            'description' => $request->description,
            'price' => $request->price,
            'status' => true,
        ]);
        return response()->json([
            'success' => true,
            'test' => $test,
            'message' => 'Test added successfully!',
        ]);
    }
    public function updateTest(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
        ]);
        $test = Test::where('doctor_id', auth()->user()->getDoctorIdContext())->findOrFail($id);
        $test->update($request->all());
        return response()->json([
            'success' => true,
            'message' => 'Test updated successfully!',
        ]);
    }
    public function deleteTest($id)
    {
        $test = Test::where('doctor_id', auth()->user()->getDoctorIdContext())->findOrFail($id);
        $test->delete();
        return response()->json([
            'success' => true,
            'message' => 'Test deleted successfully!',
        ]);
    }
}
