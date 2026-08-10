<?php

namespace App\Http\Controllers;

use App\Models\Billing;
use App\Models\BillingType;
use App\Services\TransactionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class BillingController extends Controller
{
    public function __construct(private readonly TransactionService $transactionService) {}

    // ── View ────────────────────────────────────────────────────────────────
    public function index()
    {
        return view('doctor.billing');
    }

    // ── Billing Types ───────────────────────────────────────────────────────
    public function storeBillingType(Request $request)
    {
        $request->validate([
            'name'           => 'required|string|max:255',
            'default_amount' => 'nullable|numeric|min:0',
        ]);

        try {
            $billingType = BillingType::create([
                'doctor_id'      => $this->doctorId(),
                'name'           => $request->name,
                'default_amount' => $request->default_amount ?? 0,
                'is_active'      => true,
            ]);

            return response()->json(['success' => true, 'message' => 'Billing type created successfully', 'billing_type' => $billingType]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    public function getBillingTypes()
    {
        try {
            $billingTypes = BillingType::where('doctor_id', $this->doctorId())
                ->where('is_active', true)
                ->select('id', 'name', 'default_amount')
                ->get();

            return response()->json($billingTypes);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ── Store Billing (from billing page) ───────────────────────────────────
    public function storeBilling(Request $request)
    {
        $this->decodePaimentDetails($request);

        $request->validate([
            'patient_id'       => 'required|exists:users,id',
            'billing_type_id'  => 'required|exists:billing_types,id',
            'total_amount'     => 'required|numeric|min:0',
            'received_amount'  => 'required|numeric|min:0',
            'payment_method'   => 'required|in:upi,cash,card,netbanking',
            'payment_details'  => 'required|array',
            'payment_details.*'=> 'nullable',
            'notes'            => 'nullable|string|max:1000',
        ]);

        try {
            $billing    = $this->createBillingRecord($request);

            // Mark appointment completed
            if ($request->appointment_id) {
                \App\Models\Appointment::where('id', $request->appointment_id)->update(['status' => 'completed']);
            }

            // Auto-create approved income transaction
            $this->transactionService->syncFromBilling($billing->load(['billingType', 'patient']));

            return response()->json(['success' => true, 'message' => 'Bill created successfully', 'billing' => $billing]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    // ── Store Billing (from consultation page) ──────────────────────────────
    public function storeBillingConsultpage(Request $request)
    {
        $this->decodePaimentDetails($request);

        $request->validate([
            'patient_id'       => 'required|exists:users,id',
            'billing_type_id'  => 'required|exists:billing_types,id',
            'total_amount'     => 'required|numeric|min:0',
            'received_amount'  => 'required|numeric|min:0',
            'payment_method'   => 'required|in:upi,cash,card,netbanking',
            'payment_details'  => 'required|array',
            'payment_details.*'=> 'nullable',
            'notes'            => 'nullable|string|max:1000',
        ]);

        try {
            $billing = $this->createBillingRecord($request);

            if ($request->appointment_id) {
                \App\Models\Appointment::where('id', $request->appointment_id)->update(['status' => 'completed']);
            }

            $this->transactionService->syncFromBilling($billing->load(['billingType', 'patient']));

            return response()->json(['success' => true, 'message' => 'Bill created successfully', 'billing' => $billing]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Error: ' . $e->getMessage()], 500);
        }
    }

    // ── Get / Show ──────────────────────────────────────────────────────────
    public function getBillings(Request $request)
    {
        try {
            $query = Billing::with([
                'patient'     => fn ($q) => $q->select('id', 'name', 'phone', 'registration_id', 'dob'),
                'billingType' => fn ($q) => $q->select('id', 'name'),
            ])->where('doctor_id', $this->doctorId());

            if ($request->filled('start_date') && $request->filled('end_date')) {
                $query->whereBetween('bill_date', [$request->start_date, $request->end_date]);
            }
            if ($request->filled('search_name')) {
                $query->whereHas('patient', fn ($q) => $q->where('name', 'like', "%{$request->search_name}%"));
            }
            if ($request->filled('search_phone')) {
                $query->whereHas('patient', fn ($q) => $q->where('phone', 'like', "%{$request->search_phone}%"));
            }

            $billings = $query->latest()->paginate(10);

            return response()->json([
                'success'    => true,
                'data'       => $billings->items(),
                'pagination' => ['current_page' => $billings->currentPage(), 'last_page' => $billings->lastPage(), 'total' => $billings->total()],
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        try {
            $billing = Billing::with([
                'patient'     => fn ($q) => $q->select('id', 'name', 'phone', 'registration_id', 'dob'),
                'billingType' => fn ($q) => $q->select('id', 'name'),
            ])->where('doctor_id', $this->doctorId())->findOrFail($id);

            return response()->json(['success' => true, 'billing' => $billing]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ── Update ──────────────────────────────────────────────────────────────
    public function update(Request $request, $id)
    {
        $this->decodePaimentDetails($request);

        $request->validate([
            'patient_id'       => 'required|exists:users,id',
            'billing_type_id'  => 'required|exists:billing_types,id',
            'total_amount'     => 'required|numeric|min:0',
            'received_amount'  => 'required|numeric|min:0',
            'payment_method'   => 'required|in:upi,cash,card,netbanking',
            'payment_details'  => 'required|array',
            'payment_details.*'=> 'nullable',
            'notes'            => 'nullable|string|max:1000',
        ]);

        try {
            $billing       = Billing::where('doctor_id', $this->doctorId())->findOrFail($id);
            $pendingAmount = $request->total_amount - $request->received_amount;
            $status        = $pendingAmount <= 0 ? 'paid' : ($request->received_amount > 0 ? 'partial' : 'pending');

            $billing->update([
                'patient_id'      => $request->patient_id,
                'billing_type_id' => $request->billing_type_id,
                'total_amount'    => $request->total_amount,
                'received_amount' => $request->received_amount,
                'pending_amount'  => $pendingAmount,
                'payment_method'  => $request->payment_method,
                'payment_details' => $request->payment_details,
                'status'          => $status,
                'notes'           => $request->notes,
            ]);

            // Sync income transaction
            $this->transactionService->syncFromBilling($billing->load(['billingType', 'patient']));

            return response()->json(['success' => true, 'message' => 'Bill updated successfully']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ── Destroy ─────────────────────────────────────────────────────────────
    public function destroy($id)
    {
        try {
            $billing = Billing::where('doctor_id', $this->doctorId())->findOrFail($id);

            // Remove linked income transaction
            $this->transactionService->removeByBillingId($billing->id);

            $billing->delete(); // soft delete

            return response()->json(['success' => true, 'message' => 'Bill deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ── PDF ─────────────────────────────────────────────────────────────────
    public function printPDF($id)
    {
        try {
            $billing = Billing::with([
                'patient'     => fn ($q) => $q->select('id', 'name', 'phone', 'registration_id', 'dob', 'email', 'gender'),
                'billingType' => fn ($q) => $q->select('id', 'name'),
                'doctor'      => fn ($q) => $q->select('id', 'name', 'qualification', 'registration_number'),
            ])->where('doctor_id', $this->doctorId())->findOrFail($id);

            $age  = $billing->patient->dob ? Carbon::parse($billing->patient->dob)->age . ' years' : 'N/A';
            $data = [
                'billing'    => $billing,
                'patient'    => $billing->patient,
                'age'        => $age,
                'print_date' => now()->format('d M Y - h:i A'),
                'doctor'     => $billing->doctor,
            ];

            $pdf = PDF::loadView('doctor.billing-pdf', $data);

            return $pdf->download('bill-' . $billing->bill_number . '.pdf');
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ── Private helpers ─────────────────────────────────────────────────────
    private function doctorId(): int
    {
        return Auth::user()->getDoctorIdContext();
    }

    private function decodePaimentDetails(Request $request): void
    {
        if (is_string($request->payment_details)) {
            $decoded = json_decode($request->payment_details, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $request->merge(['payment_details' => $decoded]);
            }
        }
    }

    private function createBillingRecord(Request $request): Billing
    {
        $pendingAmount = $request->total_amount - $request->received_amount;
        $status = $pendingAmount <= 0 ? 'paid' : ($request->received_amount > 0 ? 'partial' : 'pending');

        // Handle existing appointment bill (edit case)
        if ($request->appointment_id) {
            $existing = Billing::where('appointment_id', $request->appointment_id)->first();
            if ($existing) {
                $existing->update([
                    'billing_type_id' => $request->billing_type_id,
                    'total_amount'    => $request->total_amount,
                    'received_amount' => $request->received_amount,
                    'pending_amount'  => $pendingAmount,
                    'payment_method'  => $request->payment_method,
                    'payment_details' => $request->payment_details,
                    'status'          => $status,
                    'notes'           => $request->notes,
                ]);
                return $existing;
            }
        }

        $datePart      = date('Ymd');
        $baseBillNumber = "BILL-{$datePart}-";
        $lastBill      = Billing::where('bill_number', 'like', "{$baseBillNumber}%")->latest('id')->first();
        $nextNumber    = $lastBill ? str_pad((int) substr($lastBill->bill_number, strlen($baseBillNumber)) + 1, 4, '0', STR_PAD_LEFT) : '0001';
        $billNumber    = $baseBillNumber . $nextNumber;
        $suffix = '';
        while (Billing::where('bill_number', $billNumber . $suffix)->exists()) {
            $suffix = $suffix === '' ? 'A' : ++$suffix;
        }
        $billNumber .= $suffix;

        return Billing::create([
            'patient_id'      => $request->patient_id,
            'doctor_id'       => $this->doctorId(),
            'billing_type_id' => $request->billing_type_id,
            'total_amount'    => $request->total_amount,
            'received_amount' => $request->received_amount,
            'pending_amount'  => $pendingAmount,
            'payment_method'  => $request->payment_method,
            'payment_details' => $request->payment_details,
            'status'          => $status,
            'notes'           => $request->notes,
            'bill_date'       => now(),
            'bill_number'     => $billNumber,
            'appointment_id'  => $request->appointment_id ?? null,
            'consultation_id' => $request->consultation_id ?? null,
        ]);
    }
}