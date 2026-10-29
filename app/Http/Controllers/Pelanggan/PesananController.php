<?php

namespace App\Http\Controllers\Pelanggan;

use App\Actions\Orders\CreateOrder;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Models\Order;
use App\Models\Service;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class PesananController extends Controller
{
    /**
     * Show the manual order form with active services from the database.
     */
    public function form(): Response
    {
        return Inertia::render('Pelanggan/Pesan', [
            'services' => $this->serviceOptions(),
        ]);
    }

    /**
     * Show the confirmation page with active services from the database.
     */
    public function create(): Response
    {
        return Inertia::render('Pelanggan/Konfirmasi', [
            'services' => $this->serviceOptions(),
        ]);
    }

    /**
     * Store a confirmed order from the manual order flow.
     */
    public function store(StoreOrderRequest $request, CreateOrder $createOrder): RedirectResponse
    {
        $data = $request->validated();
        $data['source'] = 'manual';

        $order = $createOrder->handle($data, $request->user());

        return redirect()
            ->route('pelanggan.pesan.berhasil', $order->order_number)
            ->with('status', 'Pesanan dikonfirmasi.');
    }

    /**
     * Show the order receipt after a successful confirmation.
     */
    public function success(Request $request, string $nomorPesanan): Response
    {
        $order = Order::query()
            ->with(['customer', 'items.service'])
            ->where('order_number', $nomorPesanan)
            ->where(function ($query) use ($request) {
                $query->where('user_id', $request->user()->id)
                    ->orWhereHas('customer', fn ($customer) => $customer->where('user_id', $request->user()->id));
            })
            ->firstOrFail();

        $item = $order->items->first();
        $schedule = $order->schedule_date
            ? Carbon::parse($order->schedule_date)->locale('id')
            : null;

        return Inertia::render('Pelanggan/PesanBerhasil', [
            'order' => [
                'number' => $order->order_number,
                'status' => $order->status->value,
                'status_label' => $order->status->label(),
                'status_tone' => $order->status->tone(),
                'payment_status' => $order->payment_status,
                'payment_label' => $order->payment_status === 'lunas'
                    ? 'Lunas'
                    : 'Belum dibayar',
                'customer' => [
                    'name' => $order->customer->name,
                    'whatsapp' => $order->customer->whatsapp,
                ],
                'item' => $item ? [
                    'name' => $item->service_name,
                    'unit' => $item->unit,
                    'quantity' => $item->estimated_quantity,
                    'unit_price' => $item->unit_price,
                    'subtotal' => $item->subtotal,
                ] : null,
                'estimated_price' => $order->estimated_price,
                'intake_method' => $order->intake_method,
                'address' => $order->pickup_address,
                'schedule_date' => $order->schedule_date?->toDateString(),
                'schedule_label' => $schedule
                    ? $schedule->translatedFormat('l, j F Y')
                    : null,
                'schedule_time' => $order->schedule_time,
                'notes' => $order->notes,
                'created_at' => $order->created_at?->locale('id')->translatedFormat('j F Y, H.i').' WIB',
            ],
        ]);
    }

    /**
     * Active services formatted for the order form.
     */
    private function serviceOptions(): Collection
    {
        return Service::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Service $service) => [
                'id' => $service->id,
                'slug' => $service->slug,
                'name' => $service->name,
                'unit' => $service->unit,
                'price' => $service->price,
                'min' => $service->min_quantity,
                'step' => $service->step_quantity,
                'startingAt' => $service->is_starting_at,
            ]);
    }
}
