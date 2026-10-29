<?php

namespace App\Services\Payments;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Services\Orders\OrderAdminPresenter;

class PaymentAdminPresenter
{
    public function __construct(private OrderAdminPresenter $orders) {}

    /**
     * Build the payment table/drawer payload for an order.
     *
     * @return array<string, mixed>
     */
    public function present(Order $order): array
    {
        $order->loadMissing(['customer', 'items.service', 'paymentConfirmedBy']);

        $summary = $this->orders->list($order);
        $status = $this->status($order);
        $method = $this->method($order, $status);

        return [
            'id' => $order->order_number,
            'invoiceNumber' => str_replace('LDR-', 'INV-', $order->order_number),
            'orderId' => $order->order_number,
            'customer' => $summary['customer'],
            'phone' => $summary['phone'],
            'service' => $summary['service'],
            'weight' => $summary['weight'],
            'amount' => $summary['total'],
            'status' => $status,
            'method' => $method,
            'channel' => $this->channel($method),
            'proof' => null,
            'issuedAt' => ($order->invoiced_at ?? $order->updated_at ?? $order->created_at)
                ?->toIso8601String(),
            'paidAt' => ($order->paid_at ?? ($order->payment_status === 'lunas' ? $order->updated_at : null))
                ?->toIso8601String(),
            'confirmedBy' => $order->paymentConfirmedBy?->name,
            'orderStatus' => $summary['status'],
            'note' => $summary['note'],
        ];
    }

    public function status(Order $order): string
    {
        if ($order->payment_status === 'lunas') {
            return 'Lunas';
        }

        if ($order->payment_status === 'menunggu_konfirmasi') {
            return 'Perlu konfirmasi';
        }

        if (in_array($order->status, [
            OrderStatus::Draft,
            OrderStatus::Terkonfirmasi,
            OrderStatus::MenungguPenjemputan,
            OrderStatus::MenungguAntaranPelanggan,
            OrderStatus::Diterima,
            OrderStatus::Ditimbang,
        ], true)) {
            return 'Belum ditagih';
        }

        return 'Belum dibayar';
    }

    private function method(Order $order, string $status): string
    {
        if ($order->payment_method) {
            return $order->payment_method;
        }

        return match ($status) {
            'Belum ditagih' => 'Belum ditagih',
            'Lunas' => 'Tidak tercatat',
            default => 'Belum dipilih',
        };
    }

    private function channel(string $method): string
    {
        return match ($method) {
            'Transfer bank' => 'Transfer manual',
            'QRIS' => 'QRIS outlet',
            'Tunai' => 'Pembayaran di outlet',
            default => '-',
        };
    }
}
