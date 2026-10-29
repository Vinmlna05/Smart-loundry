<?php

namespace App\Http\Controllers\Pengusaha;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\Orders\OrderAdminPresenter;
use App\Services\Orders\OrderStatusService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class PesananController extends Controller
{
    /**
     * Show every order stored in the database.
     */
    public function index(OrderAdminPresenter $presenter): Response
    {
        $orders = Order::query()
            ->with(['customer', 'items.service'])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        return Inertia::render('Pengusaha/Pesanan', [
            'orders' => $orders
                ->map(fn (Order $order) => $presenter->list($order))
                ->values(),
        ]);
    }

    /**
     * Show the order detail and processing page.
     */
    public function show(Order $order, OrderAdminPresenter $presenter): Response
    {
        return Inertia::render('Pengusaha/DetailPesanan', [
            'order' => $presenter->detail($order),
        ]);
    }

    /**
     * Mark a scheduled pickup or drop-off as received by staff.
     */
    public function receive(
        Order $order,
        Request $request,
        OrderStatusService $statuses,
    ): RedirectResponse {
        try {
            $statuses->transition(
                $order,
                OrderStatus::Diterima,
                $request->user(),
                'Cucian diterima petugas.',
            );
        } catch (InvalidArgumentException $exception) {
            return back()->withErrors(['status' => $exception->getMessage()]);
        }

        return back()->with('status', 'Cucian ditandai diterima.');
    }

    /**
     * Save the actual weight, recalculate the final price, and issue the invoice.
     */
    public function weigh(
        Order $order,
        Request $request,
        OrderStatusService $statuses,
    ): RedirectResponse {
        $data = $request->validate([
            'actual_weight' => ['required', 'numeric', 'min:0.1', 'max:50'],
        ]);

        if ($order->status !== OrderStatus::Diterima) {
            return back()->withErrors([
                'actual_weight' => 'Pesanan ini belum siap ditimbang.',
            ]);
        }

        $order->loadMissing('items');
        $item = $order->items->first();

        if ($item === null) {
            return back()->withErrors([
                'actual_weight' => 'Rincian layanan pesanan tidak ditemukan.',
            ]);
        }

        $weight = (float) $data['actual_weight'];
        $finalPrice = (int) round($item->unit_price * $weight);

        try {
            $order = DB::transaction(function () use ($order, $item, $weight, $finalPrice, $request, $statuses) {
                $order->forceFill([
                    'actual_weight' => $weight,
                    'final_price' => $finalPrice,
                    'payment_status' => 'belum_dibayar',
                    'invoiced_at' => now(),
                ])->save();

                $item->forceFill([
                    'actual_quantity' => $weight,
                    'subtotal' => $finalPrice,
                ])->save();

                $order = $statuses->transition(
                    $order->refresh(),
                    OrderStatus::Ditimbang,
                    $request->user(),
                    'Berat aktual dicatat.',
                );

                return $statuses->transition(
                    $order,
                    OrderStatus::MenungguPembayaran,
                    $request->user(),
                    'Nota dan instruksi pembayaran dibuat.',
                );
            });
        } catch (InvalidArgumentException $exception) {
            return back()->withErrors(['actual_weight' => $exception->getMessage()]);
        }

        return back()->with('status', 'Berat aktual disimpan dan nota dibuat.');
    }

    /**
     * Confirm a payment and move the order into processing.
     */
    public function pay(
        Order $order,
        Request $request,
        OrderStatusService $statuses,
    ): RedirectResponse {
        $data = $request->validate([
            'payment_method' => ['nullable', 'string', 'in:Transfer bank,QRIS,Tunai'],
        ]);

        if ($order->status !== OrderStatus::MenungguPembayaran) {
            return back()->withErrors([
                'payment' => 'Pesanan ini belum menunggu pembayaran.',
            ]);
        }

        try {
            DB::transaction(function () use ($order, $data, $request, $statuses) {
                $order->forceFill([
                    'payment_status' => 'lunas',
                    'payment_method' => $data['payment_method'] ?? null,
                    'paid_at' => now(),
                    'payment_confirmed_by' => $request->user()?->id,
                ])->save();

                $order = $statuses->transition(
                    $order->refresh(),
                    OrderStatus::Lunas,
                    $request->user(),
                    'Pembayaran dikonfirmasi.',
                );

                $order = $statuses->transition(
                    $order,
                    OrderStatus::SiapDiproses,
                    $request->user(),
                    'Pesanan siap diproses.',
                );

                $statuses->transition(
                    $order,
                    OrderStatus::Diproses,
                    $request->user(),
                    'Cucian mulai diproses.',
                );
            });
        } catch (InvalidArgumentException $exception) {
            return back()->withErrors(['payment' => $exception->getMessage()]);
        }

        return back()->with('status', 'Pembayaran dikonfirmasi.');
    }

    /**
     * Mark the laundry as finished and ready for handover.
     */
    public function ready(
        Order $order,
        Request $request,
        OrderStatusService $statuses,
    ): RedirectResponse {
        $nextStatus = $order->delivery_method === 'antar'
            ? OrderStatus::DalamPengantaran
            : OrderStatus::SiapDiambil;

        try {
            DB::transaction(function () use ($order, $request, $statuses, $nextStatus) {
                $order = $statuses->transition(
                    $order,
                    OrderStatus::SelesaiDicuci,
                    $request->user(),
                    'Cucian selesai dicuci.',
                );

                $statuses->transition(
                    $order,
                    $nextStatus,
                    $request->user(),
                    $nextStatus === OrderStatus::DalamPengantaran
                        ? 'Cucian sedang diantar ke pelanggan.'
                        : 'Cucian siap diambil pelanggan.',
                );
            });
        } catch (InvalidArgumentException $exception) {
            return back()->withErrors(['status' => $exception->getMessage()]);
        }

        return back()->with('status', $nextStatus === OrderStatus::DalamPengantaran
            ? 'Pesanan dalam pengantaran.'
            : 'Pesanan ditandai siap diambil.');
    }

    /**
     * Confirm that the customer has received the laundry.
     */
    public function complete(
        Order $order,
        Request $request,
        OrderStatusService $statuses,
    ): RedirectResponse {
        try {
            DB::transaction(function () use ($order, $request, $statuses) {
                $order = $statuses->transition(
                    $order,
                    OrderStatus::DiterimaPelanggan,
                    $request->user(),
                    'Cucian diterima pelanggan.',
                );

                $statuses->transition(
                    $order,
                    OrderStatus::Selesai,
                    $request->user(),
                    'Pesanan selesai.',
                );
            });
        } catch (InvalidArgumentException $exception) {
            return back()->withErrors(['status' => $exception->getMessage()]);
        }

        return back()->with('status', 'Pesanan ditandai selesai.');
    }

    /**
     * Cancel an order that has not been handed over.
     */
    public function cancel(
        Order $order,
        Request $request,
        OrderStatusService $statuses,
    ): RedirectResponse {
        try {
            $statuses->transition(
                $order,
                OrderStatus::Dibatalkan,
                $request->user(),
                'Pesanan dibatalkan oleh pengusaha.',
            );
        } catch (InvalidArgumentException $exception) {
            return back()->withErrors(['status' => $exception->getMessage()]);
        }

        return back()->with('status', 'Pesanan dibatalkan.');
    }
}
