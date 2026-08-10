<?php

namespace App\Enums;

enum Salutation: string
{
    case MR = 'Mr.';
    case MRS = 'Mrs.';
    case MS = 'Ms.';
    case DR = 'Dr.';
    case MASTER = 'Master';

    /**
     * Get all values as an array.
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
