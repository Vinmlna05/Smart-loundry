<?php

namespace App\Services\Pricing;

use App\Models\Service;

class PriceCalculator
{
    /**
     * Calculate the estimated price from a service tariff and quantity.
     * Money is stored as integer rupiah.
     */
    public function estimate(Service $service, float $quantity): int
    {
        return (int) round($service->price * $quantity);
    }

    /**
     * Calculate the final price after the actual quantity is confirmed.
     */
    public function finalPrice(Service $service, float $quantity): int
    {
        return $this->estimate($service, $quantity);
    }
}
