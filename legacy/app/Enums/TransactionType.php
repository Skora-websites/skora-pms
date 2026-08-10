<?php

namespace App\Enums;

enum TransactionType: int
{
    case Income  = 1;
    case Expense = 2;

    public function label(): string
    {
        return match($this) {
            self::Income  => 'Income',
            self::Expense => 'Expense',
        };
    }

    public function badgeClass(): string
    {
        return match($this) {
            self::Income  => 'bg-success',
            self::Expense => 'bg-danger',
        };
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
