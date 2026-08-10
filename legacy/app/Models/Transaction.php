<?php

namespace App\Models;

use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class Transaction extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'type',
        'income_type_id',
        'expense_type_id',
        'amount',
        'date',
        'status',
        'billing_id',
        'reference_number',
        'payment_method',
        'description',
        'created_by',
        'file_path',
    ];

    protected $casts = [
        'type'   => TransactionType::class,
        'status' => TransactionStatus::class,
        'date'   => 'date',
        'amount' => 'decimal:2',
    ];

    // ── Relations ──────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function incomeType(): BelongsTo
    {
        return $this->belongsTo(IncomeType::class);
    }

    public function expenseType(): BelongsTo
    {
        return $this->belongsTo(ExpenseType::class);
    }

    public function billing(): BelongsTo
    {
        return $this->belongsTo(Billing::class);
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    /**
     * Returns the category name regardless of type.
     */
    public function getCategoryNameAttribute(): string
    {
        if ($this->type === TransactionType::Income) {
            return $this->incomeType?->name ?? '—';
        }
        return $this->expenseType?->name ?? '—';
    }

    /**
     * Eager-load only the relevant category relation.
     */
    public function loadCategory(): static
    {
        if ($this->type === TransactionType::Income) {
            return $this->load('incomeType');
        }
        return $this->load('expenseType');
    }

    // ── Scopes ─────────────────────────────────────────────────────────────

    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', TransactionStatus::Approved->value);
    }

    public function scopeIncome(Builder $query): Builder
    {
        return $query->where('type', TransactionType::Income->value);
    }

    public function scopeExpense(Builder $query): Builder
    {
        return $query->where('type', TransactionType::Expense->value);
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForMonth(Builder $query, int $month, int $year): Builder
    {
        return $query->whereMonth('date', $month)->whereYear('date', $year);
    }
}
