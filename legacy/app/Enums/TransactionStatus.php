<?php

namespace App\Enums;

enum TransactionStatus: string
{
    case Approved   = 'approved';
    case Unapproved = 'unapproved';
    case Pending    = 'pending';

    public function label(): string
    {
        return match($this) {
            self::Approved   => 'Approved',
            self::Unapproved => 'Unapproved',
            self::Pending    => 'Pending',
        };
    }

    public function badgeClass(): string
    {
        return match($this) {
            self::Approved   => 'bg-success',
            self::Unapproved => 'bg-danger',
            self::Pending    => 'bg-warning text-dark',
        };
    }

    /**
     * Only approved transactions count in financial totals.
     */
    public function countsInTotal(): bool
    {
        return $this === self::Approved;
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
