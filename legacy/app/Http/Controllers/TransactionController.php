<?php

namespace App\Http\Controllers;

use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Http\Requests\Transaction\CreateTransactionRequest;
use App\Http\Requests\Transaction\UpdateTransactionRequest;
use App\Models\ExpenseType;
use App\Models\IncomeType;
use App\Models\Transaction;
use App\Services\TransactionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class TransactionController extends Controller
{
    public function __construct(private readonly TransactionService $service) {}

    // ── Page view ───────────────────────────────────────────────────────────
    public function index()
    {
        return view('doctor.incom-expence');
    }

    // ── AJAX: paginated list ────────────────────────────────────────────────
    public function getTransactionData(Request $request)
    {
        $paginator = $this->service->list(
            $this->doctorId(),
            $request->only(['type', 'start_date', 'end_date', 'amount', 'status', 'per_page'])
        );

        $totals = $this->service->totals($this->doctorId(), $request->only(['start_date', 'end_date']));

        return response()->json([
            'data'         => $paginator->items(),
            'current_page' => $paginator->currentPage(),
            'last_page'    => $paginator->lastPage(),
            'per_page'     => $paginator->perPage(),
            'total'        => $paginator->total(),
            'totals'       => $totals,
        ]);
    }

    // ── AJAX: totals only ───────────────────────────────────────────────────
    public function getTotals(Request $request)
    {
        return response()->json(
            $this->service->totals($this->doctorId(), $request->only(['start_date', 'end_date']))
        );
    }

    // ── AJAX: categories ────────────────────────────────────────────────────
    public function getCategories(Request $request)
    {
        $type = (int) $request->get('type', TransactionType::Income->value);
        $userId = $this->doctorId();

        if ($type === TransactionType::Income->value) {
            $categories = IncomeType::where('user_id', $userId)
                ->select('id', 'name')
                ->orderBy('name')
                ->get();
        } else {
            $categories = ExpenseType::where('user_id', $userId)
                ->select('id', 'name')
                ->orderBy('name')
                ->get();
        }

        return response()->json($categories);
    }

    // ── AJAX: store category ────────────────────────────────────────────────
    public function storeCategory(Request $request)
    {
        $request->validate([
            'type' => 'required|in:1,2',
            'name' => 'required|string|max:150',
        ]);

        $userId = $this->doctorId();
        $type   = (int) $request->type;

        if ($type === TransactionType::Income->value) {
            $cat = IncomeType::firstOrCreate(['name' => $request->name, 'user_id' => $userId]);
        } else {
            $cat = ExpenseType::firstOrCreate(['name' => $request->name, 'user_id' => $userId]);
        }

        return response()->json(['success' => true, 'category' => $cat]);
    }

    // ── CRUD: store ─────────────────────────────────────────────────────────
    public function store(CreateTransactionRequest $request)
    {
        try {
            $filePath = null;
            if ($request->hasFile('file')) {
                $filePath = $request->file('file')->store('transactions', 'public');
            }

            $transaction = $this->service->create(
                $request->validated(),
                $this->doctorId(),
                $filePath
            );

            $transaction->loadCategory();

            return response()->json([
                'success'     => true,
                'message'     => ucfirst($transaction->type->label()) . ' added successfully.',
                'transaction' => $transaction,
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ── CRUD: show ──────────────────────────────────────────────────────────
    public function show($id)
    {
        $transaction = Transaction::with(['incomeType', 'expenseType', 'billing'])
            ->forUser($this->doctorId())
            ->findOrFail($id);

        return response()->json(['success' => true, 'transaction' => $transaction]);
    }

    // ── CRUD: update ────────────────────────────────────────────────────────
    public function update(UpdateTransactionRequest $request, $id)
    {
        try {
            $transaction = Transaction::forUser($this->doctorId())->findOrFail($id);

            $newFilePath = null;
            if ($request->hasFile('file')) {
                $newFilePath = $request->file('file')->store('transactions', 'public');
            }

            $transaction = $this->service->update($transaction, $request->validated(), $newFilePath);
            $transaction->loadCategory();

            return response()->json([
                'success'     => true,
                'message'     => 'Transaction updated successfully.',
                'transaction' => $transaction,
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ── CRUD: soft delete ───────────────────────────────────────────────────
    public function destroy($id)
    {
        try {
            $transaction = Transaction::forUser($this->doctorId())->findOrFail($id);

            // Prevent deleting auto-created billing income (delete the bill instead)
            if ($transaction->billing_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'This income was auto-generated from a bill. Delete the bill to remove it.',
                ], 422);
            }

            $this->service->softDelete($transaction);

            return response()->json(['success' => true, 'message' => 'Transaction deleted.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ── Status update ───────────────────────────────────────────────────────
    public function updateStatus(Request $request, $id)
    {
        $request->validate(['status' => 'required|in:approved,unapproved,pending']);

        $transaction = Transaction::forUser($this->doctorId())->findOrFail($id);
        $transaction->update(['status' => $request->status]);

        return response()->json(['success' => true, 'message' => 'Status updated.']);
    }

    // ── Export ──────────────────────────────────────────────────────────────
    public function exportSelected(Request $request)
    {
        $data = $this->service->exportSelected(
            (array) $request->ids,
            $this->doctorId()
        );

        return response()->json($data);
    }

    public function exportAll(Request $request)
    {
        $data = $this->service->exportAll(
            $this->doctorId(),
            $request->only(['type', 'start_date', 'end_date'])
        );

        return response()->json($data);
    }

    // ── Shared helpers ──────────────────────────────────────────────────────
    private function doctorId(): int
    {
        return Auth::user()->getDoctorIdContext();
    }
}