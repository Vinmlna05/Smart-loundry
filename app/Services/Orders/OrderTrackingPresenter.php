<?php

namespace App\Services\Orders;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderStatusLog;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class OrderTrackingPresenter
{
    /**
     * Progress rank for each status. Ranks line up with the timeline milestones.
     */
    private const RANKS = [
        'draft' => 0,
        'terkonfirmasi' => 1,
        'menunggu_penjemputan' => 2,
        'menunggu_antaran_pelanggan' => 2,
        'diterima' => 3,
        'ditimbang' => 4,
        'menunggu_pembayaran' => 5,
        'lunas' => 6,
        'siap_diproses' => 7,
        'diproses' => 7,
        'selesai_dicuci' => 8,
        'siap_diambil' => 9,
        'dalam_pengantaran' => 9,
        'diterima_pelanggan' => 10,
        'selesai' => 11,
        'dibatalkan' => 0,
    ];

    private const TIME_LABELS = [
        '08:00-10:00' => '08.00–10.00',
        '10:00-12:00' => '10.00–12.00',
        '12:00-14:00' => '12.00–14.00',
        '14:00-16:00' => '14.00–16.00',
        '16:00-18:00' => '16.00–18.00',
    ];

    /**
     * Build the payload used by the tracking page.
     *
     * @return array<string, mixed>
     */
    public function present(Order $order): array
    {
        $order->loadMissing(['customer', 'items', 'statusLogs']);

        $isCancelled = $order->status === OrderStatus::Dibatalkan;
        $timeline = $isCancelled
            ? $this->cancelledTimeline($order)
            : $this->milestoneTimeline($order);

        return [
            'number' => $order->order_number,
            'customerName' => $order->customer->name,
            'service' => $this->serviceLabel($order),
            'weight' => $this->quantityLabel($order),
            'price' => $order->final_price ?? $order->estimated_price,
            'status' => $order->status->label(),
            'statusTone' => $order->status->tone(),
            'payment' => $order->payment_status === 'lunas'
                ? 'Lunas'
                : 'Belum dibayar',
            'paymentTone' => $order->payment_status === 'lunas'
                ? 'success'
                : 'warning',
            'method' => $this->methodLabel($order),
            'schedule' => $this->scheduleLabel($order),
            'updatedAt' => $order->updated_at
                ?->locale('id')
                ->translatedFormat('j F Y, H.i').' WIB',
            'progress' => $timeline['progress'],
            'totalSteps' => $timeline['totalSteps'],
            'steps' => $timeline['steps'],
        ];
    }

    /**
     * @return array{progress: int, totalSteps: int, steps: array<int, array<string, string>>}
     */
    private function milestoneTimeline(Order $order): array
    {
        $currentRank = self::RANKS[$order->status->value] ?? 0;
        $milestones = $this->milestones($order);
        $steps = [];
        $progress = 0;

        foreach ($milestones as $milestone) {
            $state = match (true) {
                $milestone['rank'] < $currentRank => 'done',
                $milestone['rank'] === $currentRank => 'current',
                default => 'upcoming',
            };

            if ($state !== 'upcoming') {
                $progress++;
            }

            $log = $this->logFor($order->statusLogs, $milestone['statuses']);

            $steps[] = [
                'state' => $state,
                'title' => $milestone['title'],
                'time' => $log
                    ? $this->formatTime($log->created_at)
                    : ($state === 'upcoming'
                        ? $milestone['upcoming']
                        : $this->formatTime($order->updated_at)),
                'description' => $log?->note ?: $milestone['description'],
            ];
        }

        return [
            'progress' => $progress,
            'totalSteps' => count($steps),
            'steps' => $steps,
        ];
    }

    /**
     * @return array{progress: int, totalSteps: int, steps: array<int, array<string, string>>}
     */
    private function cancelledTimeline(Order $order): array
    {
        $logs = $order->statusLogs->sortBy('created_at')->values();

        if ($logs->isEmpty()) {
            return [
                'progress' => 1,
                'totalSteps' => 1,
                'steps' => [[
                    'state' => 'current',
                    'title' => OrderStatus::Dibatalkan->label(),
                    'time' => $this->formatTime($order->updated_at),
                    'description' => 'Pesanan dibatalkan.',
                ]],
            ];
        }

        $steps = $logs
            ->map(function (OrderStatusLog $log) use ($logs) {
                $status = OrderStatus::tryFrom($log->to_status);
                $isLast = $log->is($logs->last());

                return [
                    'state' => $isLast ? 'current' : 'done',
                    'title' => $status?->label() ?? $log->to_status,
                    'time' => $this->formatTime($log->created_at),
                    'description' => $log->note ?: 'Status pesanan diperbarui.',
                ];
            })
            ->all();

        return [
            'progress' => count($steps),
            'totalSteps' => count($steps),
            'steps' => $steps,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function milestones(Order $order): array
    {
        $isPickup = $order->intake_method === 'jemput';
        $isDelivery = $order->delivery_method === 'antar';

        return [
            [
                'rank' => 1,
                'statuses' => ['terkonfirmasi'],
                'title' => 'Pesanan dikonfirmasi',
                'description' => 'Pesanan diterima dan masuk antrean pemrosesan.',
                'upcoming' => 'Menunggu konfirmasi',
            ],
            [
                'rank' => 2,
                'statuses' => ['menunggu_penjemputan', 'menunggu_antaran_pelanggan'],
                'title' => $isPickup
                    ? 'Menunggu penjemputan'
                    : 'Menunggu antaran ke outlet',
                'description' => $isPickup
                    ? 'Petugas akan menjemput cucian sesuai alamat dan jadwal.'
                    : 'Antar cucian ke outlet Cleanora sesuai jadwal.',
                'upcoming' => 'Menunggu jadwal',
            ],
            [
                'rank' => 3,
                'statuses' => ['diterima'],
                'title' => 'Cucian diterima',
                'description' => 'Petugas telah menerima cucianmu.',
                'upcoming' => 'Menunggu cucian diterima',
            ],
            [
                'rank' => 4,
                'statuses' => ['ditimbang'],
                'title' => 'Cucian ditimbang',
                'description' => 'Berat atau jumlah aktual dicatat dan harga final dihitung.',
                'upcoming' => 'Menunggu penimbangan',
            ],
            [
                'rank' => 5,
                'statuses' => ['menunggu_pembayaran'],
                'title' => 'Menunggu pembayaran',
                'description' => 'Nota dan instruksi pembayaran dikirim ke WhatsApp-mu.',
                'upcoming' => 'Menunggu nota',
            ],
            [
                'rank' => 6,
                'statuses' => ['lunas'],
                'title' => 'Pembayaran lunas',
                'description' => 'Pembayaran sudah dikonfirmasi.',
                'upcoming' => 'Menunggu pembayaran',
            ],
            [
                'rank' => 7,
                'statuses' => ['siap_diproses', 'diproses'],
                'title' => 'Cucian diproses',
                'description' => 'Cucian sedang dicuci dan diselesaikan sesuai layanan.',
                'upcoming' => 'Belum dimulai',
            ],
            [
                'rank' => 8,
                'statuses' => ['selesai_dicuci'],
                'title' => 'Selesai dicuci',
                'description' => 'Cucian selesai diproses dan disiapkan untuk penyerahan.',
                'upcoming' => 'Menunggu proses selesai',
            ],
            [
                'rank' => 9,
                'statuses' => ['siap_diambil', 'dalam_pengantaran'],
                'title' => $isDelivery ? 'Dalam pengantaran' : 'Siap diambil',
                'description' => $isDelivery
                    ? 'Kurir mengantar cucian ke alamatmu.'
                    : 'Cucian siap diambil di outlet Cleanora.',
                'upcoming' => $isDelivery ? 'Belum dijadwalkan' : 'Belum siap diambil',
            ],
            [
                'rank' => 10,
                'statuses' => ['diterima_pelanggan'],
                'title' => 'Diterima pelanggan',
                'description' => 'Cucian sudah diterima dengan baik.',
                'upcoming' => 'Menunggu konfirmasi penerimaan',
            ],
            [
                'rank' => 11,
                'statuses' => ['selesai'],
                'title' => 'Pesanan selesai',
                'description' => 'Pesanan selesai dan tercatat di riwayatmu.',
                'upcoming' => 'Menunggu penyelesaian',
            ],
        ];
    }

    /**
     * @param  Collection<int, OrderStatusLog>  $logs
     * @param  array<int, string>  $statuses
     */
    private function logFor(Collection $logs, array $statuses): ?OrderStatusLog
    {
        return $logs
            ->filter(fn (OrderStatusLog $log) => in_array($log->to_status, $statuses, true))
            ->sortBy('created_at')
            ->last();
    }

    private function serviceLabel(Order $order): string
    {
        if ($order->items->isEmpty()) {
            return '-';
        }

        return $order->items
            ->map(fn ($item) => $item->service_name.' · '.$this->formatQuantity(
                (float) ($item->actual_quantity ?? $item->estimated_quantity),
                $item->unit,
            ))
            ->join(', ');
    }

    private function quantityLabel(Order $order): string
    {
        $item = $order->items->first();

        if (! $item) {
            return '-';
        }

        return $this->formatQuantity(
            (float) ($order->actual_weight ?? $item->actual_quantity ?? $item->estimated_quantity),
            $item->unit,
        );
    }

    private function formatQuantity(float $value, string $unit): string
    {
        $formatted = rtrim(rtrim(number_format($value, 2, ',', '.'), '0'), ',');

        return "{$formatted} {$unit}";
    }

    private function methodLabel(Order $order): string
    {
        $label = $order->intake_method === 'jemput'
            ? 'Dijemput'
            : 'Antar sendiri';

        if ($order->delivery_method === 'antar') {
            return $label.' & diantar';
        }

        if ($order->delivery_method === 'ambil') {
            return $label.' & diambil di outlet';
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

    private function formatTime(?Carbon $time): string
    {
        return $time
            ? $time->locale('id')->translatedFormat('j M Y · H.i').' WIB'
            : '-';
    }
}
