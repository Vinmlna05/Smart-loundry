<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case TransferBank = 'Transfer bank';
    case Qris = 'QRIS';
    case Tunai = 'Tunai';

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_map(fn (self $method) => $method->value, self::cases());
    }
}
