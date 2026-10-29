<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Service;
use App\Models\User;
use Database\Seeders\ServiceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PelangganLacakPesananTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(ServiceSeeder::class);
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/pelanggan/lacak-pesanan')->assertRedirect(route('login'));
    }

    public function test_pelanggan_can_view_tracking_page(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/pelanggan/lacak-pesanan')
            ->assertOk();
    }

    public function test_tracking_page_lists_active_orders_as_diproses(): void
    {
        $user = User::factory()->create();
        $order = $this->createOrderFor($user);

        $this->actingAs($user)
            ->get('/pelanggan/lacak-pesanan')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Pelanggan/LacakPesanan')
                ->has('orders', 1)
                ->where('orders.0.number', $order->order_number)
                ->where('orders.0.status', 'Diproses')
                ->where('orders.0.tone', 'primary'));
    }

    public function test_tracking_page_lists_completed_orders_as_selesai(): void
    {
        $user = User::factory()->create();
        $order = $this->createOrderFor($user);

        $order->update(['status' => OrderStatus::Selesai]);

        $this->actingAs($user)
            ->get('/pelanggan/lacak-pesanan')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('orders', 1)
                ->where('orders.0.number', $order->order_number)
                ->where('orders.0.status', 'Selesai')
                ->where('orders.0.tone', 'success'));
    }

    public function test_tracking_page_does_not_list_other_customers_orders(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $this->createOrderFor($owner);

        $this->actingAs($other)
            ->get('/pelanggan/lacak-pesanan')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Pelanggan/LacakPesanan')
                ->has('orders', 0));
    }

    public function test_pengusaha_is_redirected_to_their_own_dashboard(): void
    {
        $user = User::factory()->pengusaha()->create();

        $this->actingAs($user)
            ->get('/pelanggan/lacak-pesanan')
            ->assertRedirect(route('pengusaha.dashboard'));
    }

    public function test_pelanggan_can_find_their_own_order(): void
    {
        $user = User::factory()->create();
        $order = $this->createOrderFor($user);

        $this->actingAs($user)
            ->post('/pelanggan/lacak-pesanan', [
                'order_number' => strtolower($order->order_number),
                'whatsapp' => '0812-3456-7890',
            ])
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Pelanggan/LacakPesanan')
                ->where('searched', true)
                ->where('order.number', $order->order_number)
                ->where('order.customerName', 'Ayu Lestari')
                ->where('order.status', 'Menunggu penjemputan')
                ->where('order.payment', 'Belum dibayar')
                ->where('order.progress', 2)
                ->where('order.totalSteps', 11)
                ->has('order.steps', 11)
                ->where('order.steps.0.state', 'done')
                ->where('order.steps.1.state', 'current'));
    }

    public function test_wrong_whatsapp_number_does_not_reveal_the_order(): void
    {
        $user = User::factory()->create();
        $order = $this->createOrderFor($user);

        $this->actingAs($user)
            ->post('/pelanggan/lacak-pesanan', [
                'order_number' => $order->order_number,
                'whatsapp' => '081299999999',
            ])
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Pelanggan/LacakPesanan')
                ->where('searched', true)
                ->where('order', null));
    }

    public function test_pelanggan_cannot_track_another_customers_order(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $order = $this->createOrderFor($owner);

        $this->actingAs($other)
            ->post('/pelanggan/lacak-pesanan', [
                'order_number' => $order->order_number,
                'whatsapp' => '081234567890',
            ])
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('order', null));
    }

    public function test_order_number_must_use_the_expected_format(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/pelanggan/lacak-pesanan', [
                'order_number' => 'bukan-nomor',
                'whatsapp' => '081234567890',
            ])
            ->assertSessionHasErrors('order_number');
    }

    private function createOrderFor(User $user, string $whatsapp = '081234567890'): Order
    {
        $service = Service::where('slug', 'cuci-setrika')->firstOrFail();

        $this->actingAs($user)->post('/pelanggan/pesan', [
            'name' => 'Ayu Lestari',
            'whatsapp' => $whatsapp,
            'service_id' => $service->id,
            'estimated_quantity' => 3.5,
            'intake_method' => 'jemput',
            'address' => 'Jl. Melati No. 12, Bandung',
            'schedule_date' => now()->addDay()->toDateString(),
            'schedule_time' => '10:00-12:00',
        ])->assertRedirect();

        return Order::latest('id')->firstOrFail();
    }
}
