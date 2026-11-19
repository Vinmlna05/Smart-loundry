<?php

namespace App\Services\Payments;

use App\Enums\PaymentMethod;
use App\Models\Order;
use App\Services\Business\BusinessProfile;
use App\Support\WhatsAppNumber;
use Illuminate\Support\Facades\Storage;

class PaymentInstruction
{
    public function __construct(private BusinessProfile $business) {}

    /**
     * @return array<string, mixed>
     */
    public function forOrder(Order $order): array
    {
        $order->loadMissing('customer');

        $profile = $this->business->all();
        $snapshot = is_array($order->payment_details) ? $order->payment_details : [];

        $method = $order->payment_method ?: ($snapshot['method'] ?? null);
        $accounts = is_array($snapshot['accounts'] ?? null)
            ? $snapshot['accounts']
            : $profile['bankAccounts'];
        $qrisPath = $snapshot['qrisPath'] ?? $profile['qrisPath'];
        $qrisUrl = $this->qrisUrl($qrisPath);

        $instruction = [
            'method' => $method,
            'businessName' => $snapshot['businessName'] ?? $profile['businessName'],
            'accounts' => array_values($accounts),
            'qrisUrl' => $qrisUrl,
            'outletAddress' => $snapshot['outletAddress'] ?? $profile['outletAddress'],
            'operatingHours' => $snapshot['operatingHours'] ?? $profile['operatingHours'],
        ];

        $instruction['message'] = $this->message($order, $instruction);
        $instruction['whatsappUrl'] = $this->whatsappUrl($order, $instruction['message']);

        return $instruction;
    }

    /**
     * Snapshot the active payment profile when an invoice is issued.
     *
     * @return array<string, mixed>
     */
    public function snapshot(PaymentMethod $method): array
    {
        $profile = $this->business->all();

        return [
            'method' => $method->value,
            'businessName' => $profile['businessName'],
            'accounts' => $profile['bankAccounts'],
            'qrisPath' => $profile['qrisPath'],
            'outletAddress' => $profile['outletAddress'],
            'operatingHours' => $profile['operatingHours'],
        ];
    }

    /**
     * @param  array<string, mixed>  $instruction
     */
    public function message(Order $order, array $instruction): string
    {
        $amount = (int) ($order->final_price ?? $order->estimated_price);
        $customerName = $order->customer?->name ?? 'Pelanggan';
        $method = $instruction['method'] ?? null;

        $lines = [
            "Halo {$customerName}, nota {$order->order_number} sudah terbit.",
            '',
            'Total tagihan: '.$this->rupiah($amount),
        ];

        if ($method === PaymentMethod::TransferBank->value) {
            $lines[] = 'Silakan transfer ke rekening berikut:';

            foreach ($instruction['accounts'] as $index => $account) {
                $primary = ($account['isPrimary'] ?? false) ? ' (utama)' : '';
                $lines[] = sprintf(
                    '%d. %s %s a.n. %s%s',
                    $index + 1,
                    $account['bankName'],
                    $account['accountNumber'],
                    $account['accountHolder'],
                    $primary,
                );
            }

            if ($instruction['accounts'] === []) {
                $lines[] = 'Rekening tujuan belum tersedia. Hubungi outlet untuk informasi pembayaran.';
            }
        } elseif ($method === PaymentMethod::Qris->value) {
            $lines[] = 'Scan QRIS melalui tautan gambar berikut:';
            $lines[] = $instruction['qrisUrl'] ?: 'QRIS belum tersedia. Hubungi outlet untuk informasi pembayaran.';
        } elseif ($method === PaymentMethod::Tunai->value) {
            $lines[] = 'Pembayaran tunai dilakukan di:';
            $lines[] = $instruction['outletAddress'];
            $lines[] = 'Jam operasional: '.$instruction['operatingHours'];
        } else {
            $lines[] = 'Hubungi outlet untuk informasi metode pembayaran.';
        }

        $lines[] = '';
        $lines[] = 'Setelah membayar, unggah bukti pembayaran di:';
        $lines[] = route('pelanggan.pesanan.detail', $order->order_number);
        $lines[] = '';
        $lines[] = 'Terima kasih.';

        return implode("\n", $lines);
    }

    private function whatsappUrl(Order $order, string $message): ?string
    {
        $number = WhatsAppNumber::normalize($order->customer?->whatsapp ?? '');

        if ($number === '') {
            return null;
        }

        return 'https://wa.me/'.$number.'?text='.rawurlencode($message);
    }

    private function qrisUrl(?string $path): ?string
    {
        if (! is_string($path) || $path === '') {
            return null;
        }

        return Storage::disk('public')->url($path);
    }

    private function rupiah(int $amount): string
    {
        return 'Rp'.number_format($amount, 0, ',', '.');
    }
}
