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

class PengusahaPelangganTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/pengusaha/pelanggan')->assertRedirect('/login');
    }

    public function test_pelanggan_is_redirected_to_their_dashboard(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/pengusaha/pelanggan')
            ->assertRedirect(route('pelanggan.dashboard'));
    }

    public function test_pengusaha_can_view_customers_with_order_history(): void
    {
        $user = User::factory()->pengusaha()->create();
        $customer = Customer::query()->create([
            'name' => 'Ayu Lestari',
            'whatsapp' => '6281234567890',
        ]);

        $cuci = Service::query()->create([
            'slug' => 'cuci-setrika',
            'name' => 'Cuci dan Setrika',
            'category' => 'kiloan',
            'unit' => 'kg',
            'price' => 8000,
            'min_quantity' => 3,
            'step_quantity' => 0.5,
            'is_active' => true,
        ]);

        $setrika = Service::query()->create([
            'slug' => 'setrika',
            'name' => 'Setrika Saja',
            'category' => 'kiloan',
            'unit' => 'kg',
            'price' => 5000,
            'min_quantity' => 3,
            'step_quantity' => 0.5,
            'is_active' => true,
        ]);

        $this->makeOrder($customer, $user, $cuci, 'LDR-20261024-0001', 24000);
        $this->makeOrder($customer, $user, $cuci, 'LDR-20261024-0002', 32000);
        $this->makeOrder($customer, $user, $setrika, 'LDR-20261024-0003', 15000);

        $this->actingAs($user)
            ->get('/pengusaha/pelanggan')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Pengusaha/Pelanggan')
                ->where('customers.0.id', 'PLG-0001')
                ->where('customers.0.name', 'Ayu Lestari')
                ->where('customers.0.phone', '081234567890')
                ->where('customers.0.totalOrders', 3)
                ->where('customers.0.totalSpent', 71000)
                ->where('customers.0.favoriteService', 'Cuci dan Setrika')
                ->where('customers.0.segment', 'new')
                ->has('customers.0.recentOrders', 3)
                ->where('serviceOptions', ['Cuci dan Setrika', 'Setrika Saja']));
    }

    private function makeOrder(
        Customer $customer,
        User $user,
        Service $service,
        string $number,
        int $total,
    ): Order {
        $order = Order::query()->create([
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
            'estimated_price' => $total,
            'final_price' => $total,
            'status' => OrderStatus::Selesai->value,
            'payment_status' => 'lunas',
        ]);

        $order->items()->create([
            'service_id' => $service->id,
            'service_name' => $service->name,
            'unit' => $service->unit,
            'estimated_quantity' => 3,
            'actual_quantity' => 3,
            'unit_price' => $service->price,
            'subtotal' => $total,
        ]);

        return $order;
    }
}
