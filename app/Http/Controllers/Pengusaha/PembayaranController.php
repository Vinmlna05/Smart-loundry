<?php

namespace App\Http\Controllers\Pengusaha;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\Payments\PaymentAdminPresenter;
use Inertia\Inertia;
use Inertia\Response;

class PembayaranController extends Controller
{
    public function index(PaymentAdminPresenter $presenter): Response
    {
        $payments = Order::query()
            ->with(['customer', 'items.service', 'paymentConfirmedBy'])
            ->where('status', '!=', OrderStatus::Dibatalkan->value)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Order $order) => $presenter->present($order))
            ->values();

        return Inertia::render('Pengusaha/Pembayaran', [
            'payments' => $payments,
        ]);
    }
}
