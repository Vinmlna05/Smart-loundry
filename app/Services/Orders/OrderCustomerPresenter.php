<?php

namespace App\Services\Orders;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Services\Payments\PaymentInstruction;
use App\Support\WhatsAppNumber;
use Illuminate\Support\Carbon;

class OrderCustomerPresenter
{
    private const TIME_LABELS = [
        '08:00-10:00' => '08.00–10.00',
        '10:00-12:00' => '10.00–12.00',
        '12:00-14:00' => '12.00–14.00',
        '14:00-16:00' => '14.00–16.00',
        '16:00-18:00' => '16.00–18.00',
    ];

    public function __construct(private PaymentInstruction $instructions) {}

    /**
     * @return array<string, mixed>
     */
    public function present(Order $order): array
    {
        $order->loadMissing(['customer', 'items']);

        $item = $order->items->first();
        $amount = (int) ($order->final_price ?? $order->estimated_price);
        $actualWeight = $order->actual_weight !== null
            ? (float) $order->actual_weight
            : null;
        $estimatedWeight = (float) ($order->estimated_weight ?? $item?->estimated_quantity ?? 0);
        $payment = $this->instructions->forOrder($order);
        $isPaid = $order->payment_status === 'lunas';
        $isAwaitingConfirmation = $order->payment_status === 'menunggu_konfirmasi';
        $createdAt = $order->created_at?->locale('id');
        $updatedAt = $order->updated_at?->locale('id');
        $invoicedAt = $order->invoiced_at?->locale('id') ?? $createdAt;

        return [
            'number' => $order->order_number,
            'customer' => [
                'name' => $order->customer?->name ?? '-',
                'phone' => $order->customer?->whatsapp
                    ? WhatsAppNumber::toLocal($order->customer->whatsapp)
                    : '-',
            ],
            'source' => $order->source === 'chatbot' ? 'Chatbot AI' : 'Pesan Manual',
            'status' => $order->status->label(),
            'statusTone' => $order->status->tone(),
            'paymentStatus' => $isPaid
                ? 'Lunas'
                : ($isAwaitingConfirmation ? 'Perlu konfirmasi' : 'Belum dibayar'),
            'paymentTone' => $isPaid ? 'success' : 'warning',
            'createdAt' => $createdAt?->translatedFormat('j F Y, H.i').' WIB',
            'updatedAt' => $updatedAt?->translatedFormat('j F Y, H.i').' WIB',
            'invoiceDate' => $invoicedAt?->translatedFormat('j F Y'),
            'method' => $this->methodLabel($order),
            'schedule' => $this->scheduleLabel($order),
            'location' => $order->pickup_address ?: 'Outlet Cleanora',
            'estimatedWeight' => $this->formatQuantity($estimatedWeight, $item?->unit ?? 'kg'),
            'actualWeight' => $actualWeight !== null
                ? $this->formatQuantity($actualWeight, $item?->unit ?? 'kg')
                : null,
            'estimatedPrice' => (int) $order->estimated_price,
            'subtotal' => $amount,
            'deliveryFee' => 0,
            'total' => $amount,
            'items' => $order->items->map(fn ($orderItem) => [
                'name' => $orderItem->service_name,
                'note' => 'Cucian '.$orderItem->service_name,
                'quantity' => $this->formatQuantity(
                    (float) ($orderItem->actual_quantity ?? $orderItem->estimated_quantity),
                    $orderItem->unit,
                ),
                'unitPrice' => (int) $orderItem->unit_price,
                'total' => (int) $orderItem->subtotal,
            ])->values()->all(),
            'nextStep' => $this->nextStep($order),
            'note' => $order->notes ?: 'Harga final dihitung dari berat aktual setelah penimbangan. Estimasi awal tetap disimpan sebagai pembanding.',
            'payment' => [
                'method' => $payment['method'],
                'businessName' => $payment['businessName'],
                'accounts' => $payment['accounts'],
                'qrisUrl' => $payment['qrisUrl'],
                'outletAddress' => $payment['outletAddress'],
                'operatingHours' => $payment['operatingHours'],
                'message' => $payment['message'],
            ],
        ];
    }

    private function nextStep(Order $order): string
    {
        return match ($order->status) {
            OrderStatus::MenungguPembayaran => 'Nota sudah terbit. Selesaikan pembayaran sesuai metode yang dipilih, lalu unggah bukti.',
            OrderStatus::Lunas,
            OrderStatus::SiapDiproses,
            OrderStatus::Diproses,
            OrderStatus::SelesaiDicuci => 'Pembayaran sudah diterima. Cucian sedang diproses.',
            OrderStatus::SiapDiambil => 'Cucian siap diambil di outlet Cleanora.',
            OrderStatus::DalamPengantaran => 'Cucian sedang diantar ke alamatmu.',
            OrderStatus::DiterimaPelanggan,
            OrderStatus::Selesai => 'Pesanan selesai. Terima kasih sudah memakai Cleanora.',
            OrderStatus::Dibatalkan => 'Pesanan ini dibatalkan.',
            default => 'Pesanan sedang disiapkan. Status akan diperbarui petugas.',
        };
    }

    private function methodLabel(Order $order): string
    {
        $label = $order->intake_method === 'jemput'
            ? 'Dijemput & diantar'
            : 'Antar sendiri';

        if ($order->intake_method === 'jemput') {
            return $order->delivery_method === 'antar'
                ? 'Dijemput & diantar'
                : 'Dijemput & diambil di outlet';
        }

        return $label;
    }

    private function scheduleLabel(Order $order): string
    {
        if (! $order->schedule_date) {
            return '-';
        }

        $date = Carbon::parse($order->schedule_date)
            ->locale('id')
            ->translatedFormat('l, j F Y');
        $time = self::TIME_LABELS[$order->schedule_time] ?? $order->schedule_time;

        return "{$date} · {$time}";
    }

    private function formatQuantity(float $value, string $unit): string
    {
        $formatted = rtrim(rtrim(number_format($value, 2, ',', '.'), '0'), ',');

        return "{$formatted} {$unit}";
    }
}
