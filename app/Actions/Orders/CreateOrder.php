<?php

namespace App\Actions\Orders;

use App\Enums\OrderStatus;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Service;
use App\Models\User;
use App\Services\Orders\OrderNumberGenerator;
use App\Services\Orders\OrderStatusService;
use App\Services\Pricing\PriceCalculator;
use Illuminate\Support\Facades\DB;

class CreateOrder
{
    public function __construct(
        private readonly OrderNumberGenerator $numbers,
        private readonly OrderStatusService $statuses,
        private readonly PriceCalculator $prices,
    ) {}

    /**
     * Store a confirmed order from a validated payload.
     *
     * @param  array<string, mixed>  $data
     */
    public function handle(array $data, ?User $user = null): Order
    {
        return DB::transaction(function () use ($data, $user) {
            $service = Service::query()
                ->whereKey($data['service_id'])
                ->where('is_active', true)
                ->firstOrFail();

            $quantity = (float) $data['estimated_quantity'];
            $customer = $this->customerFor($data, $user);

            $order = Order::create([
                'order_number' => $this->numbers->generate(),
                'customer_id' => $customer->id,
                'user_id' => $user?->id,
                'source' => $data['source'] ?? 'manual',
                'intake_method' => $data['intake_method'],
                'delivery_method' => $data['delivery_method'] ?? null,
                'pickup_address' => $data['intake_method'] === 'jemput'
                    ? $data['address']
                    : null,
                'schedule_date' => $data['schedule_date'],
                'schedule_time' => $data['schedule_time'],
                'estimated_weight' => $quantity,
                'estimated_price' => $this->prices->estimate($service, $quantity),
                'status' => OrderStatus::Draft,
                'payment_status' => 'belum_dibayar',
                'notes' => $data['notes'] ?? null,
            ]);

            $order->items()->create([
                'service_id' => $service->id,
                'service_name' => $service->name,
                'unit' => $service->unit,
                'estimated_quantity' => $quantity,
                'unit_price' => $service->price,
                'subtotal' => $this->prices->estimate($service, $quantity),
            ]);

            $order = $this->statuses->transition(
                $order,
                OrderStatus::Terkonfirmasi,
                $user,
                'Pesanan dibuat dan dikonfirmasi pelanggan.',
            );

            $nextStatus = $data['intake_method'] === 'jemput'
                ? OrderStatus::MenungguPenjemputan
                : OrderStatus::MenungguAntaranPelanggan;

            $order = $this->statuses->transition(
                $order,
                $nextStatus,
                $user,
                $nextStatus === OrderStatus::MenungguPenjemputan
                    ? 'Menunggu penjemputan sesuai jadwal.'
                    : 'Menunggu pelanggan mengantar cucian ke outlet.',
            );

            return $order->load(['customer', 'items.service']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function customerFor(array $data, ?User $user): Customer
    {
        $customer = Customer::firstOrCreate(
            ['whatsapp' => $data['whatsapp']],
            [
                'name' => $data['name'],
                'user_id' => $user?->id,
            ],
        );

        if ($customer->user_id === null && $user !== null) {
            $customer->user_id = $user->id;
        }

        if ($customer->name !== $data['name']) {
            $customer->name = $data['name'];
        }

        if ($customer->isDirty()) {
            $customer->save();
        }

        return $customer;
    }
}
