<?php

namespace App\Services\Orders;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Support\WhatsAppNumber;

class OrderAdminPresenter
{
    /**
     * Build the payload used by the order table.
     *
     * @return array<string, mixed>
     */
    public function list(Order $order): array
    {
        return $this->present($order);
    }

    /**
     * Build the payload used by the order detail page.
     *
     * @return array<string, mixed>
     */
    public function detail(Order $order): array
    {
        return $this->present($order);
    }

    /**
     * @return array<string, mixed>
     */
    private function present(Order $order): array
    {
        $order->loadMissing(['customer', 'items.service', 'paymentConfirmedBy']);

        $item = $order->items->first();
        $estimatedWeight = (float) ($order->estimated_weight ?? $item?->estimated_quantity ?? 0);
        $actualWeight = $order->actual_weight !== null
            ? (float) $order->actual_weight
            : null;
        $quantity = $actualWeight ?? $estimatedWeight;
        $unit = $item?->unit ?? 'kg';
        $estimatedPrice = (int) ($order->estimated_price ?? $item?->subtotal ?? 0);
        $finalPrice = $order->final_price !== null
            ? (int) $order->final_price
            : null;

        return [
            'id' => $order->order_number,
            'customer' => $order->customer?->name ?? '-',
            'phone' => $order->customer?->whatsapp
                ? WhatsAppNumber::toLocal($order->customer->whatsapp)
                : '-',
            'service' => $this->serviceLabel($order),
            'unit' => $unit,
            'weight' => $this->formatQuantity($quantity, $unit),
            'estimatedWeight' => $estimatedWeight,
            'actualWeight' => $actualWeight,
            'unitPrice' => (int) ($item?->unit_price ?? 0),
            'minimum' => (float) ($item?->service?->min_quantity ?? 0.1),
            'estimatedPrice' => $estimatedPrice,
            'finalPrice' => $finalPrice,
            'total' => $finalPrice ?? $estimatedPrice,
            'status' => $this->statusLabel($order->status),
            'rawStatus' => $order->status->value,
            'statusTone' => $order->status->tone(),
            'source' => $order->source === 'chatbot' ? 'Chatbot AI' : 'Manual',
            'time' => $order->created_at?->format('H.i') ?? '-',
            'date' => $order->created_at?->toDateString(),
            'intake' => $order->intake_method === 'jemput'
                ? 'Dijemput'
                : 'Diantar sendiri',
            'payment' => $this->paymentLabel($order),
            'paymentStatus' => $order->payment_status,
            'paymentMethod' => $order->payment_method,
            'paidAt' => $order->paid_at?->toIso8601String(),
            'confirmedBy' => $order->paymentConfirmedBy?->name,
            'invoicedAt' => $order->invoiced_at?->toIso8601String(),
            'group' => $this->group($order->status),
            'step' => $this->step($order->status),
            'outlet' => $order->intake_method === 'antar' ? 'Outlet Cleanora' : null,
            'address' => $order->pickup_address,
            'note' => $order->notes ?: '-',
            'scheduleDate' => $order->schedule_date?->toDateString(),
            'scheduleTime' => $order->schedule_time,
            'items' => $order->items->map(fn ($orderItem) => [
                'name' => $orderItem->service_name,
                'unit' => $orderItem->unit,
                'estimatedQuantity' => (float) $orderItem->estimated_quantity,
                'actualQuantity' => $orderItem->actual_quantity !== null
                    ? (float) $orderItem->actual_quantity
                    : null,
                'unitPrice' => (int) $orderItem->unit_price,
                'subtotal' => (int) $orderItem->subtotal,
            ])->values()->all(),
        ];
    }

    public function serviceLabel(Order $order): string
    {
        $names = $order->items
            ->pluck('service_name')
            ->filter()
            ->unique()
            ->values();

        return $names->isEmpty() ? '-' : $names->join(', ');
    }

    private function formatQuantity(float $value, string $unit): string
    {
        $formatted = rtrim(rtrim(number_format($value, 2, ',', '.'), '0'), ',');

        return "{$formatted} {$unit}";
    }

    public function statusLabel(OrderStatus $status): string
    {
        return match ($status) {
            OrderStatus::Diterima => 'Perlu ditimbang',
            OrderStatus::Diproses => 'Sedang dicuci',
            default => $status->label(),
        };
    }

    private function paymentLabel(Order $order): string
    {
        if ($order->status === OrderStatus::Dibatalkan) {
            return 'Tidak perlu bayar';
        }

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

    private function group(OrderStatus $status): string
    {
        return match ($status) {
            OrderStatus::DiterimaPelanggan, OrderStatus::Selesai => 'done',
            OrderStatus::Dibatalkan => 'canceled',
            OrderStatus::Lunas,
            OrderStatus::SiapDiproses,
            OrderStatus::Diproses,
            OrderStatus::SelesaiDicuci,
            OrderStatus::SiapDiambil,
            OrderStatus::DalamPengantaran => 'process',
            default => 'attention',
        };
    }

    private function step(OrderStatus $status): int
    {
        return match ($status) {
            OrderStatus::MenungguPenjemputan,
            OrderStatus::MenungguAntaranPelanggan,
            OrderStatus::Draft,
            OrderStatus::Terkonfirmasi,
            OrderStatus::Dibatalkan => 0,
            OrderStatus::Diterima => 1,
            OrderStatus::Ditimbang,
            OrderStatus::MenungguPembayaran => 2,
            OrderStatus::Lunas,
            OrderStatus::SiapDiproses,
            OrderStatus::Diproses,
            OrderStatus::SelesaiDicuci => 3,
            OrderStatus::SiapDiambil,
            OrderStatus::DalamPengantaran => 4,
            OrderStatus::DiterimaPelanggan,
            OrderStatus::Selesai => 5,
        };
    }
}
