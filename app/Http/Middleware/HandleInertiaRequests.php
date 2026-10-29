<?php

namespace App\Http\Middleware;

use App\Enums\OrderStatus;
use App\Models\Customer;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'flash' => [
                'status' => fn () => $request->session()->get('status'),
            ],
            'csrf_token' => $request->session()->token(),
            'navCounts' => fn (): ?array => $request->user()?->role === 'pengusaha'
                ? [
                    'orders' => Order::query()
                        ->where('status', '!=', OrderStatus::Dibatalkan->value)
                        ->count(),
                    'attention' => Order::query()
                        ->whereIn('status', [
                            OrderStatus::Draft->value,
                            OrderStatus::Terkonfirmasi->value,
                            OrderStatus::MenungguPenjemputan->value,
                            OrderStatus::MenungguAntaranPelanggan->value,
                            OrderStatus::Diterima->value,
                            OrderStatus::Ditimbang->value,
                            OrderStatus::MenungguPembayaran->value,
                        ])
                        ->count(),
                    'payments' => Order::query()
                        ->where('status', OrderStatus::MenungguPembayaran->value)
                        ->count(),
                    'customers' => Customer::query()->count(),
                ]
                : null,
        ];
    }
}
