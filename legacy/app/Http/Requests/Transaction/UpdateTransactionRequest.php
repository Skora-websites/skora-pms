<?php

namespace App\Http\Requests\Transaction;

use App\Enums\TransactionType;
use App\Enums\TransactionStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type'            => ['required', Rule::enum(TransactionType::class)],
            'income_type_id'  => [
                'nullable',
                Rule::requiredIf(fn () => (int) $this->type === TransactionType::Income->value),
                'exists:income_types,id',
            ],
            'expense_type_id' => [
                'nullable',
                Rule::requiredIf(fn () => (int) $this->type === TransactionType::Expense->value),
                'exists:expense_types,id',
            ],
            'amount'          => ['required', 'numeric', 'min:0.01'],
            'date'            => ['required', 'date'],
            'status'          => ['nullable', Rule::enum(TransactionStatus::class)],
            'payment_method'  => ['nullable', 'string', 'max:50'],
            'description'     => ['nullable', 'string', 'max:1000'],
            'reference_number'=> ['nullable', 'string', 'max:100'],
            'file'            => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:3072'],
        ];
    }

    public function messages(): array
    {
        return [
            'type.required'           => 'Please select Income or Expense.',
            'income_type_id.required' => 'Income category is required for income transactions.',
            'expense_type_id.required'=> 'Expense category is required for expense transactions.',
            'amount.required'         => 'Amount is required.',
            'amount.min'              => 'Amount must be greater than zero.',
            'date.required'           => 'Transaction date is required.',
        ];
    }
}
