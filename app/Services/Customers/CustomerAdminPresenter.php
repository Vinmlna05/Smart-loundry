<?php

namespace App\Services\Customers;

use App\Enums\OrderStatus;
use App\Models\Customer;
use App\Models\Order;
use App\Services\Orders\OrderAdminPresenter;
use App\Support\WhatsAppNumber;
use Illuminate\Support\Collection;

class CustomerAdminPresenter
{
    public function __construct(
        private readonly OrderAdminPresenter $orders,
    ) {}

    /**
     * Build the payload used by the customer management page.
     *
     * @return array<string, mixed>
     */
    public function present(Customer $customer): array
    {
        $customer->loadMissing(['user', 'orders.items']);

        $orders = $customer->orders
            ->sortByDesc(fn (Order $order) => $order->created_at?->getTimestamp() ?? 0)
            ->values();

        $lastOrder = $orders->first();
        $totalOrders = $orders->count();
        $totalSpent = (int) $orders
            ->reject(fn (Order $order) => $order->status === OrderStatus::Dibatalkan)
            ->sum(fn (Order $order) => $order->final_price ?? $order->estimated_price ?? 0);
        $favoriteService = $this->favoriteService($orders);
        $needsAttention = $orders->contains(fn (Order $order) => in_array($order->status, [
            OrderStatus::MenungguPenjemputan,
            OrderStatus::MenungguAntaranPelanggan,
            OrderStatus::Diterima,
            OrderStatus::Ditimbang,
            OrderStatus::MenungguPembayaran,
        ], true));

        return [
            'id' => 'PLG-'.str_pad((string) $customer->id, 4, '0', STR_PAD_LEFT),
            'name' => $customer->name,
            'phone' => WhatsAppNumber::toLocal($customer->whatsapp),
            'email' => $customer->user?->email ?? '-',
            'joinedAt' => $customer->created_at?->toDateString(),
            'address' => $lastOrder?->pickup_address ?: '-',
            'outlet' => $lastOrder?->intake_method === 'antar'
                ? 'Outlet Cleanora'
                : '-',
            'segment' => $this->segment($customer, $totalOrders, $totalSpent, $needsAttention),
            'favoriteService' => $favoriteService ?? '-',
            'totalOrders' => $totalOrders,
            'totalSpent' => $totalSpent,
            'lastOrderAt' => $lastOrder?->created_at?->toDateString()
                ?? $customer->created_at?->toDateString(),
            'source' => $lastOrder
                ? ($lastOrder->source === 'chatbot' ? 'Chatbot AI' : 'Manual')
                : '-',
            'note' => $lastOrder?->notes ?: '',
            'recentOrders' => $orders->take(3)->map(fn (Order $order) => [
                'id' => $order->order_number,
                'service' => $this->orders->serviceLabel($order),
                'total' => (int) ($order->final_price ?? $order->estimated_price ?? 0),
                'status' => $this->orders->statusLabel($order->status),
                'date' => $order->created_at?->toDateString(),
            ])->values()->all(),
        ];
    }

    /**
     * @param  Collection<int, Order>  $orders
     */
    private function favoriteService(Collection $orders): ?string
    {
        return $orders
            ->flatMap(fn (Order $order) => $order->items->pluck('service_name'))
            ->filter()
            ->countBy()
            ->sortDesc()
            ->keys()
            ->first();
    }

    private function segment(
        Customer $customer,
        int $totalOrders,
        int $totalSpent,
        bool $needsAttention,
    ): string {
        if ($needsAttention) {
            return 'attention';
        }

        if ($totalOrders >= 5 || $totalSpent >= 300000) {
            return 'loyal';
        }

        if ($customer->created_at !== null && $customer->created_at->gte(now()->subDays(30))) {
            return 'new';
        }

        return 'active';
    }
}
