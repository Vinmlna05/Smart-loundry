<?php

namespace App\Http\Controllers\Pelanggan;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\TrackOrderRequest;
use App\Models\Order;
use App\Models\User;
use App\Services\Orders\OrderTrackingPresenter;
use App\Support\WhatsAppNumber;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class TrackingController extends Controller
{
    /**
     * Show the tracking page.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('Pelanggan/LacakPesanan', [
            'order' => null,
            'searched' => false,
            'orders' => $this->ordersFor($request->user()),
            'lookup' => [
                'order_number' => '',
                'whatsapp' => '',
            ],
        ]);
    }

    /**
     * Find an order belonging to the signed-in customer.
     */
    public function search(TrackOrderRequest $request, OrderTrackingPresenter $presenter): Response
    {
        $order = Order::query()
            ->with(['customer', 'items', 'statusLogs'])
            ->where('order_number', $request->string('order_number')->toString())
            ->whereHas('customer', fn ($query) => $query->where(
                'whatsapp',
                $request->string('whatsapp')->toString(),
            ))
            ->where(function ($query) use ($request) {
                $query->where('user_id', $request->user()->id)
                    ->orWhereHas('customer', fn ($customer) => $customer->where(
                        'user_id',
                        $request->user()->id,
                    ));
            })
            ->first();

        return Inertia::render('Pelanggan/LacakPesanan', [
            'order' => $order ? $presenter->present($order) : null,
            'searched' => true,
            'orders' => $this->ordersFor($request->user()),
            'lookup' => [
                'order_number' => $request->string('order_number')->toString(),
                'whatsapp' => WhatsAppNumber::toLocal(
                    $request->string('whatsapp')->toString(),
                ),
            ],
        ]);
    }

    /**
     * Order list shown in the tracking table.
     *
     * @return Collection<int, array{number: string, status: string, tone: string}>
     */
    private function ordersFor(?User $user): Collection
    {
        if ($user === null) {
            return collect();
        }

        return Order::query()
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhereHas('customer', fn ($customer) => $customer->where(
                        'user_id',
                        $user->id,
                    ));
            })
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get()
            ->map(function (Order $order) {
                $isDone = in_array($order->status, [
                    OrderStatus::DiterimaPelanggan,
                    OrderStatus::Selesai,
                ], true);

                return [
                    'number' => $order->order_number,
                    'status' => $isDone ? 'Selesai' : 'Diproses',
                    'tone' => $isDone ? 'success' : 'primary',
                ];
            });
    }
}
