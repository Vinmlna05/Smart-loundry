<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PengusahaDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/pengusaha/dashboard')->assertRedirect('/login');
    }

    public function test_pelanggan_is_redirected_to_their_dashboard(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/pengusaha/dashboard')
            ->assertRedirect(route('pelanggan.dashboard'));
    }

    public function test_pengusaha_sees_dashboard_calculated_from_orders(): void
    {
        $user = User::factory()->pengusaha()->create();
        $customer = Customer::query()->create([
            'name' => 'Ayu Lestari',
            'whatsapp' => '6281234567890',
        ]);
        $service = Service::query()->create([
            'slug' => 'cuci-setrika',
            'name' => 'Cuci dan Setrika',
            'category' => 'kiloan',
            'unit' => 'kg',
            'price' => 8000,
            'min_quantity' => 3,
            'step_quantity' => 0.5,
            'is_active' => true,
        ]);

        $this->makeOrder($user, $customer, $service, 'LDR-20261029-0001', [
            'status' => OrderStatus::MenungguPembayaran->value,
            'actual_weight' => 3.5,
            'final_price' => 28000,
            'payment_status' => 'belum_dibayar',
        ]);

        $this->makeOrder($user, $customer, $service, 'LDR-20261029-0002', [
            'status' => OrderStatus::Diproses->value,
            'actual_weight' => 4,
            'final_price' => 32000,
            'payment_status' => 'lunas',
            'payment_method' => 'QRIS',
            'paid_at' => now(),
            'payment_confirmed_by' => $user->id,
        ]);

        $this->makeOrder($user, $customer, $service, 'LDR-20261029-0003', [
            'status' => OrderStatus::Dibatalkan->value,
        ]);

        $this->actingAs($user)
            ->get('/pengusaha/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Pengusaha/Dashboard')
                ->where('dashboard.stats.0.value', 2)
                ->where('dashboard.stats.1.value', 1)
                ->where('dashboard.stats.2.value', 1)
                ->where('dashboard.stats.3.value', 32000)
                ->where('dashboard.filterCounts.all', 2)
                ->where('dashboard.filterCounts.attention', 1)
                ->where('dashboard.filterCounts.process', 1)
                ->where('dashboard.filterCounts.done', 0)
                ->where('dashboard.revenue.weeklyTotal', 32000)
                ->where('dashboard.revenue.todayTotal', 32000)
                ->where('dashboard.services.total', 2)
                ->where('dashboard.services.items.0.name', 'Cuci dan Setrika')
                ->where('dashboard.services.items.0.orders', 2)
                ->where('dashboard.stages.2.count', 1)
                ->where('dashboard.activeCount', 2)
                ->where('dashboard.waitingPaymentCount', 1)
                ->where('dashboard.orderTotal', 2)
                ->where('navCounts.orders', 2)
                ->where('navCounts.attention', 1)
                ->where('navCounts.payments', 1)
                ->where('navCounts.customers', 1)
                ->has('dashboard.tasks', 4)
                ->has('dashboard.revenue.daily', 7)
                ->has('dashboard.orders', 2)
                ->where('dashboard.orders.0.id', 'LDR-20261029-0002'));
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function makeOrder(
        User $user,
        Customer $customer,
        Service $service,
        string $number,
        array $overrides = [],
    ): Order {
        $order = Order::query()->create(array_merge([
            'order_number' => $number,
            'customer_id' => $customer->id,
            'user_id' => $user->id,
            'source' => 'manual',
            'intake_method' => 'antar',
            'delivery_method' => 'ambil',
            'schedule_date' => now()->toDateString(),
            'schedule_time' => '10:00-12:00',
            'estimated_weight' => 3,
            'actual_weight' => 3,
            'estimated_price' => 24000,
            'final_price' => 24000,
            'status' => OrderStatus::Diterima->value,
            'payment_status' => 'belum_dibayar',
        ], $overrides));

        $order->items()->create([
            'service_id' => $service->id,
            'service_name' => $service->name,
            'unit' => $service->unit,
            'estimated_quantity' => 3,
            'actual_quantity' => 3,
            'unit_price' => $service->price,
            'subtotal' => $order->final_price ?? $order->estimated_price,
        ]);

        return $order;
    }
}
