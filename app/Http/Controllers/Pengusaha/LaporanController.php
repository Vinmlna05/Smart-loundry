<?php

namespace App\Http\Controllers\Pengusaha;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\Orders\OrderAdminPresenter;
use App\Services\Payments\PaymentAdminPresenter;
use Inertia\Inertia;
use Inertia\Response;

class LaporanController extends Controller
{
    public function index(
        OrderAdminPresenter $orders,
        PaymentAdminPresenter $payments,
    ): Response {
        $transactions = Order::query()
            ->with(['customer', 'items.service', 'paymentConfirmedBy'])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get()
            ->map(function (Order $order) use ($orders, $payments) {
                $summary = $orders->list($order);
                $payment = $payments->present($order);
                $canceled = $order->status === OrderStatus::Dibatalkan;
                $createdAt = $order->created_at ?? now();
                $paidAt = $order->paid_at;

                return [
                    'id' => $order->order_number,
                    'invoiceNumber' => $payment['invoiceNumber'],
                    'date' => $createdAt->toIso8601String(),
                    'dateKey' => $createdAt->toDateString(),
                    'time' => $order->created_at?->format('H:i') ?? '-',
                    'customer' => $summary['customer'],
                    'phone' => $summary['phone'],
                    'service' => $summary['service'],
                    'source' => $summary['source'],
                    'intake' => $summary['intake'],
                    'outlet' => $summary['outlet'],
                    'amount' => (int) $summary['total'],
                    'orderStatus' => $summary['status'],
                    'paymentStatus' => $canceled ? 'Tidak perlu bayar' : $payment['status'],
                    'paymentMethod' => $canceled ? '-' : $payment['method'],
                    'paymentChannel' => $canceled ? '-' : $payment['channel'],
                    'paidAt' => $paidAt?->toIso8601String(),
                    'paidDateKey' => $paidAt?->toDateString(),
                    'isCanceled' => $canceled,
                ];
            })
            ->values();

        return Inertia::render('Pengusaha/Laporan', [
            'transactions' => $transactions,
        ]);
    }
}
