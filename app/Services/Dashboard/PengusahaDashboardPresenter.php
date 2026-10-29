<?php

namespace App\Services\Dashboard;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Services\Orders\OrderAdminPresenter;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class PengusahaDashboardPresenter
{
    public function __construct(private OrderAdminPresenter $orders) {}

    /**
     * Build the dashboard payload directly from stored orders.
     *
     * @return array<string, mixed>
     */
    public function present(): array
    {
        $orders = Order::query()
            ->with(['customer', 'items.service', 'paymentConfirmedBy'])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        $visibleOrders = $orders->reject(
            fn (Order $order) => $order->status === OrderStatus::Dibatalkan,
        );

        $attentionOrders = $visibleOrders->filter(
            fn (Order $order) => $this->isAttention($order),
        );
        $waitingPaymentOrders = $visibleOrders->filter(
            fn (Order $order) => $order->status === OrderStatus::MenungguPembayaran,
        );
        $pendingWeighOrders = $visibleOrders->filter(
            fn (Order $order) => $order->status === OrderStatus::Diterima,
        );
        $readyOrders = $visibleOrders->filter(
            fn (Order $order) => $order->status === OrderStatus::SiapDiambil,
        );
        $processingOrders = $visibleOrders->filter(
            fn (Order $order) => $order->status === OrderStatus::Diproses,
        );
        $activeOrders = $visibleOrders->filter(
            fn (Order $order) => $this->isActive($order),
        );
        $paidOrders = $visibleOrders->filter(
            fn (Order $order) => $order->payment_status === 'lunas',
        );
        $today = now();
        $todayOrders = $visibleOrders->filter(
            fn (Order $order) => $order->created_at?->isSameDay($today),
        );
        $todayPaidOrders = $paidOrders->filter(
            fn (Order $order) => $this->paymentDate($order)?->isSameDay($today),
        );
        $todayPaidRevenue = $todayPaidOrders->sum(
            fn (Order $order) => $this->amount($order),
        );
        $paidRevenue = $paidOrders->sum(
            fn (Order $order) => $this->amount($order),
        );
        $waitingPaymentTotal = $waitingPaymentOrders->sum(
            fn (Order $order) => $this->amount($order),
        );

        return [
            'stats' => [
                [
                    'label' => 'Pesanan hari ini',
                    'value' => $todayOrders->count(),
                    'format' => 'number',
                    'note' => 'Pesanan masuk hari ini',
                    'trend' => 'Hari ini',
                    'trendTone' => 'is-up',
                    'tone' => 'is-teal',
                    'icon' => 'orders',
                ],
                [
                    'label' => 'Perlu tindakan',
                    'value' => $attentionOrders->count(),
                    'format' => 'number',
                    'note' => 'Jemput, timbang, atau konfirmasi bayar',
                    'trend' => 'Perlu tindakan',
                    'trendTone' => 'is-warning',
                    'tone' => 'is-blue',
                    'icon' => 'queue',
                ],
                [
                    'label' => 'Menunggu pembayaran',
                    'value' => $waitingPaymentOrders->count(),
                    'format' => 'number',
                    'note' => $this->rupiah($waitingPaymentTotal).' belum masuk',
                    'trend' => 'Kirim pengingat',
                    'trendTone' => 'is-warning',
                    'tone' => 'is-gold',
                    'icon' => 'payments',
                ],
                [
                    'label' => 'Pendapatan hari ini',
                    'value' => (int) $todayPaidRevenue,
                    'format' => 'currency',
                    'note' => 'Dari '.$todayPaidOrders->count().' transaksi lunas',
                    'trend' => 'Total '.$this->rupiah((int) $paidRevenue),
                    'trendTone' => 'is-up',
                    'tone' => 'is-green',
                    'icon' => 'trend',
                ],
            ],
            'tasks' => [
                [
                    'id' => 'timbang',
                    'title' => 'Timbang '.$pendingWeighOrders->count().' pesanan masuk',
                    'meta' => 'Tindak lanjuti pesanan yang sudah diterima',
                    'priority' => 'Tinggi',
                    'priorityTone' => 'is-high',
                ],
                [
                    'id' => 'pembayaran',
                    'title' => 'Konfirmasi '.$waitingPaymentOrders->count().' pembayaran',
                    'meta' => 'Periksa pembayaran sebelum cucian diproses',
                    'priority' => 'Tinggi',
                    'priorityTone' => 'is-high',
                ],
                [
                    'id' => 'pengantaran',
                    'title' => 'Hubungi '.$readyOrders->count().' pelanggan siap diambil',
                    'meta' => 'Konfirmasi penyerahan cucian',
                    'priority' => 'Normal',
                    'priorityTone' => 'is-normal',
                ],
                [
                    'id' => 'pencucian',
                    'title' => 'Selesaikan '.$processingOrders->count().' cucian berjalan',
                    'meta' => 'Perbarui status setelah cucian selesai',
                    'priority' => 'Normal',
                    'priorityTone' => 'is-normal',
                ],
            ],
            'orders' => $visibleOrders
                ->take(6)
                ->map(fn (Order $order) => $this->orders->list($order))
                ->values(),
            'filterCounts' => [
                'all' => $visibleOrders->count(),
                'attention' => $attentionOrders->count(),
                'process' => $visibleOrders
                    ->filter(fn (Order $order) => $this->group($order) === 'process')
                    ->count(),
                'done' => $visibleOrders
                    ->filter(fn (Order $order) => $this->group($order) === 'done')
                    ->count(),
            ],
            'revenue' => $this->revenue($paidOrders),
            'stages' => [
                [
                    'label' => 'Menunggu jemput',
                    'count' => $visibleOrders
                        ->filter(fn (Order $order) => $order->status === OrderStatus::MenungguPenjemputan)
                        ->count(),
                    'note' => 'Petugas belum menjemput',
                    'icon' => 'truck',
                    'tone' => 'is-blue',
                ],
                [
                    'label' => 'Diterima',
                    'count' => $pendingWeighOrders->count(),
                    'note' => 'Belum ditimbang',
                    'icon' => 'package',
                    'tone' => 'is-teal',
                ],
                [
                    'label' => 'Menunggu bayar',
                    'count' => $waitingPaymentOrders->count(),
                    'note' => 'Nota sudah diterbitkan',
                    'icon' => 'queue',
                    'tone' => 'is-gold',
                ],
                [
                    'label' => 'Sedang dicuci',
                    'count' => $processingOrders->count(),
                    'note' => 'Sedang dikerjakan',
                    'icon' => 'spark',
                    'tone' => 'is-teal',
                ],
                [
                    'label' => 'Siap diambil',
                    'count' => $readyOrders->count(),
                    'note' => 'Belum dihubungi',
                    'icon' => 'check',
                    'tone' => 'is-green',
                ],
            ],
            'services' => $this->serviceMix($visibleOrders),
            'activeCount' => $activeOrders->count(),
            'waitingPaymentCount' => $waitingPaymentOrders->count(),
            'orderTotal' => $visibleOrders->count(),
        ];
    }

    /**
     * @param  Collection<int, Order>  $paidOrders
     * @return array<string, mixed>
     */
    private function revenue(Collection $paidOrders): array
    {
        $start = now()->subDays(6)->startOfDay();
        $daily = collect(range(0, 6))
            ->map(function (int $offset) use ($start, $paidOrders) {
                $date = $start->copy()->addDays($offset);
                $value = $paidOrders
                    ->filter(fn (Order $order) => $this->paymentDate($order)?->isSameDay($date))
                    ->sum(fn (Order $order) => $this->amount($order));

                return [
                    'date' => $date->toDateString(),
                    'day' => $date->locale('id')->translatedFormat('D'),
                    'value' => (int) $value,
                ];
            })
            ->values();

        return [
            'daily' => $daily,
            'weeklyTotal' => $daily->sum('value'),
            'todayTotal' => (int) $daily->last()['value'],
        ];
    }

    /**
     * @param  Collection<int, Order>  $orders
     * @return array<string, mixed>
     */
    private function serviceMix(Collection $orders): array
    {
        $counts = $orders
            ->flatMap(fn (Order $order) => $order->items
                ->pluck('service_name')
                ->filter()
                ->unique()
                ->values())
            ->countBy()
            ->sortDesc();

        $total = $orders->count();
        $items = $counts
            ->map(fn (int $count, string $name) => [
                'name' => $name,
                'orders' => $count,
                'percent' => $total > 0
                    ? (int) round(($count / $total) * 100)
                    : 0,
            ])
            ->values();

        return [
            'items' => $items,
            'total' => $total,
        ];
    }

    private function paymentDate(Order $order): ?CarbonInterface
    {
        if ($order->payment_status !== 'lunas') {
            return null;
        }

        return $order->paid_at ?? $order->updated_at;
    }

    private function amount(Order $order): int
    {
        return (int) ($order->final_price ?? $order->estimated_price ?? 0);
    }

    private function isAttention(Order $order): bool
    {
        return in_array($order->status, [
            OrderStatus::Draft,
            OrderStatus::Terkonfirmasi,
            OrderStatus::MenungguPenjemputan,
            OrderStatus::MenungguAntaranPelanggan,
            OrderStatus::Diterima,
            OrderStatus::Ditimbang,
            OrderStatus::MenungguPembayaran,
        ], true);
    }

    private function isActive(Order $order): bool
    {
        return ! in_array($order->status, [
            OrderStatus::DiterimaPelanggan,
            OrderStatus::Selesai,
            OrderStatus::Dibatalkan,
        ], true);
    }

    private function group(Order $order): string
    {
        return match ($order->status) {
            OrderStatus::DiterimaPelanggan, OrderStatus::Selesai => 'done',
            OrderStatus::Lunas,
            OrderStatus::SiapDiproses,
            OrderStatus::Diproses,
            OrderStatus::SelesaiDicuci,
            OrderStatus::SiapDiambil,
            OrderStatus::DalamPengantaran => 'process',
            default => 'attention',
        };
    }

    private function rupiah(int $value): string
    {
        return 'Rp'.number_format($value, 0, ',', '.');
    }
}
