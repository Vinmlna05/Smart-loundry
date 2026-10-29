<?php

namespace App\Http\Controllers\Pengusaha;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Service;
use App\Services\Customers\CustomerAdminPresenter;
use Inertia\Inertia;
use Inertia\Response;

class PelangganController extends Controller
{
    /**
     * Show customers with their order history and spending summary.
     */
    public function index(CustomerAdminPresenter $presenter): Response
    {
        $customers = Customer::query()
            ->with(['user', 'orders.items'])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        return Inertia::render('Pengusaha/Pelanggan', [
            'customers' => $customers
                ->map(fn (Customer $customer) => $presenter->present($customer))
                ->values(),
            'serviceOptions' => Service::query()
                ->orderBy('name')
                ->pluck('name')
                ->values(),
        ]);
    }
}
