<?php

namespace App\Support;

class WhatsAppNumber
{
    /**
     * Normalize an Indonesian WhatsApp number to the 62... format.
     */
    public static function normalize(string $value): string
    {
        $digits = preg_replace('/\D+/', '', $value) ?? '';

        if ($digits === '') {
            return '';
        }

        if (str_starts_with($digits, '0')) {
            return '62'.substr($digits, 1);
        }

        if (str_starts_with($digits, '8')) {
            return '62'.$digits;
        }

        return $digits;
    }

    /**
     * Format a normalized number back to the familiar 08... form.
     */
    public static function toLocal(string $value): string
    {
        return str_starts_with($value, '62')
            ? '0'.substr($value, 2)
            : $value;
    }
}
