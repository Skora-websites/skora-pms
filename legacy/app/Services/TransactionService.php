<?php

namespace App\Services;

use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Models\Billing;
use App\Models\IncomeType;
use App\Models\Transaction;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class TransactionService
{
    // ── List & Totals ───────────────────────────────────────────────────────

    /**
     * Paginated list with optional filters.
     * Eager-loads the correct category based on type.
     */
    public function list(int $userId, array $filters = []): LengthAwarePaginator
    {
        $type      = $filters['type']      ?? null;   // 'income' | 'expense'
        $startDate = $filters['start_date'] ?? null;
        $endDate   = $filters['end_date']   ?? null;
        $amount    = $filters['amount']     ?? null;
        $status    = $filters['status']     ?? null;
        $perPage   = (int) ($filters['per_page'] ?? 10);

        $query = Transaction::with(['incomeType', 'expenseType', 'billing'])
            ->forUser($userId)
            ->when($type === 'income',  fn ($q) => $q->income())
            ->when($type === 'expense', fn ($q) => $q->expense())
            ->when($startDate && $endDate, fn ($q) => $q->whereBetween('date', [$startDate, $endDate]))
            ->when($amount,  fn ($q) => $q->where('amount', 'like', "%{$amount}%"))
            ->when($status,  fn ($q) => $q->where('status', $status))
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc');

        return $query->paginate($perPage);
    }

    /**
     * Income and expense totals for a user (only APPROVED transactions).
     */
    public function totals(int $userId, array $filters = []): array
    {
        $startDate = $filters['start_date'] ?? null;
        $endDate   = $filters['end_date']   ?? null;

        $base = Transaction::forUser($userId)
            ->approved()
            ->when($startDate && $endDate, fn ($q) => $q->whereBetween('date', [$startDate, $endDate]));

        return [
            'income'  => (clone $base)->income()->sum('amount'),
            'expense' => (clone $base)->expense()->sum('amount'),
        ];
    }

    /**
     * Monthly totals for dashboard (approved only).
     */
    public function monthlyTotals(int $userId, int $month, int $year): array
    {
        $base = Transaction::forUser($userId)
            ->approved()
            ->forMonth($month, $year);

        return [
            'income'  => (clone $base)->income()->sum('amount'),
            'expense' => (clone $base)->expense()->sum('amount'),
        ];
    }

    // ── CRUD ────────────────────────────────────────────────────────────────

    public function create(array $data, int $userId, ?string $filePath = null): Transaction
    {
        return Transaction::create([
            'user_id'          => $userId,
            'type'             => $data['type'],
            'income_type_id'   => $data['income_type_id'] ?? null,
            'expense_type_id'  => $data['expense_type_id'] ?? null,
            'amount'           => $data['amount'],
            'date'             => $data['date'],
            'status'           => $data['status'] ?? TransactionStatus::Approved->value,
            'payment_method'   => $data['payment_method'] ?? null,
            'description'      => $data['description'] ?? null,
            'reference_number' => $data['reference_number'] ?? null,
            'created_by'       => Auth::user()->name,
            'file_path'        => $filePath,
        ]);
    }

    public function update(Transaction $transaction, array $data, ?string $newFilePath = null): Transaction
    {
        // Delete old file if replaced
        if ($newFilePath && $transaction->file_path) {
            Storage::disk('public')->delete($transaction->file_path);
        }

        $transaction->update([
            'type'             => $data['type'],
            'income_type_id'   => $data['income_type_id'] ?? null,
            'expense_type_id'  => $data['expense_type_id'] ?? null,
            'amount'           => $data['amount'],
            'date'             => $data['date'],
            'status'           => $data['status'] ?? $transaction->status,
            'payment_method'   => $data['payment_method'] ?? $transaction->payment_method,
            'description'      => $data['description'] ?? $transaction->description,
            'reference_number' => $data['reference_number'] ?? $transaction->reference_number,
            'file_path'        => $newFilePath ?? $transaction->file_path,
        ]);

        return $transaction->fresh();
    }

    public function softDelete(Transaction $transaction): void
    {
        if ($transaction->file_path) {
            Storage::disk('public')->delete($transaction->file_path);
        }
        $transaction->delete(); // SoftDeletes
    }

    // ── Billing Integration ─────────────────────────────────────────────────

    /**
     * Called by BillingController when a bill is created or updated.
     * Creates or updates a single APPROVED income transaction tied to the bill.
     * Only runs when received_amount > 0.
     */
    public function syncFromBilling(Billing $billing): ?Transaction
    {
        // If received nothing, remove any existing transaction
        if ($billing->received_amount <= 0) {
            $this->removeByBillingId($billing->id);
            return null;
        }

        // Find or create "Billing Income" type for this doctor
        $incomeType = IncomeType::firstOrCreate(
            ['name' => 'Billing Income', 'user_id' => $billing->doctor_id],
            ['name' => 'Billing Income', 'user_id' => $billing->doctor_id]
        );

        $billingTypeName = $billing->billingType?->name ?? 'Billing';
        $patientName     = $billing->patient?->name    ?? 'Patient';

        return Transaction::updateOrCreate(
            ['billing_id' => $billing->id],
            [
                'user_id'          => $billing->doctor_id,
                'type'             => TransactionType::Income->value,
                'income_type_id'   => $incomeType->id,
                'expense_type_id'  => null,
                'amount'           => $billing->received_amount,
                'date'             => $billing->bill_date ?? now()->toDateString(),
                'status'           => TransactionStatus::Approved->value,
                'billing_id'       => $billing->id,
                'reference_number' => $billing->bill_number,
                'payment_method'   => $billing->payment_method,
                'description'      => "Bill #{$billing->bill_number} · {$billingTypeName} · {$patientName}",
                'created_by'       => Auth::user()->name ?? 'System',
            ]
        );
    }

    /**
     * Soft-delete all transactions linked to a billing record.
     * Called when a bill is deleted.
     */
    public function removeByBillingId(int $billingId): void
    {
        Transaction::where('billing_id', $billingId)->delete();
    }

    // ── Export helpers ──────────────────────────────────────────────────────

    public function exportSelected(array $ids, int $userId): \Illuminate\Support\Collection
    {
        return Transaction::with(['incomeType', 'expenseType'])
            ->whereIn('id', $ids)
            ->forUser($userId)
            ->get()
            ->map(fn (Transaction $t) => $this->toExportRow($t));
    }

    public function exportAll(int $userId, array $filters = []): \Illuminate\Support\Collection
    {
        $type      = $filters['type']       ?? null;
        $startDate = $filters['start_date'] ?? null;
        $endDate   = $filters['end_date']   ?? null;

        return Transaction::with(['incomeType', 'expenseType'])
            ->forUser($userId)
            ->when($type === 'income',  fn ($q) => $q->income())
            ->when($type === 'expense', fn ($q) => $q->expense())
            ->when($startDate && $endDate, fn ($q) => $q->whereBetween('date', [$startDate, $endDate]))
            ->orderBy('date', 'desc')
            ->get()
            ->map(fn (Transaction $t) => $this->toExportRow($t));
    }

    private function toExportRow(Transaction $t): array
    {
        return [
            'id'             => $t->id,
            'date'           => optional($t->date)->format('Y-m-d'),
            'type'           => $t->type->label(),
            'category_name'  => $t->category_name,
            'amount'         => $t->amount,
            'status'         => $t->status->label(),
            'payment_method' => $t->payment_method ?? '—',
            'reference'      => $t->reference_number ?? '—',
            'description'    => $t->description,
            'created_by'     => $t->created_by,
        ];
    }
}
