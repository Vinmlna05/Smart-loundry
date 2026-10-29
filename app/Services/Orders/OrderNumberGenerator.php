<?php

namespace App\Services\Orders;

use App\Models\Order;
use Illuminate\Support\Carbon;

class OrderNumberGenerator
{
    /**
     * Build a readable, unique order number such as LDR-20261029-0001.
     * Call this inside a database transaction to avoid duplicate numbers.
     */
    public function generate(?Carbon $date = null): string
    {
        $date ??= now();
        $prefix = 'LDR-'.$date->format('Ymd').'-';

        $latest = Order::query()
            ->where('order_number', 'like', $prefix.'%')
            ->orderByDesc('order_number')
            ->lockForUpdate()
            ->value('order_number');

        $sequence = $latest === null
            ? 1
            : ((int) substr($latest, -4)) + 1;

        return $prefix.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }
}
