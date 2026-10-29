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

class PengusahaPesananTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/pengusaha/pesanan')->assertRedirect('/login');
    }

    public function test_pelanggan_is_redirected_to_their_dashboard(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/pengusaha/pesanan')
            ->assertRedirect(route('pelanggan.dashboard'));
    }

    public function test_pengusaha_can_view_orders_from_database(): void
    {
        $user = User::factory()->pengusaha()->create();
        $order = $this->makeOrder($user, [
            'status' => OrderStatus::Diterima->value,
        ]);

        $this->actingAs($user)
            ->get('/pengusaha/pesanan')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Pengusaha/Pesanan')
                ->where('orders.0.id', $order->order_number)
                ->where('orders.0.customer', 'Ayu Lestari')
                ->where('orders.0.status', 'Perlu ditimbang')
                ->where('orders.0.payment', 'Belum ditagih')
                ->where('orders.0.group', 'attention'));
    }

    public function test_pengusaha_can_view_order_detail(): void
    {
        $user = User::factory()->pengusaha()->create();
        $order = $this->makeOrder($user, [
            'status' => OrderStatus::MenungguPembayaran->value,
            'actual_weight' => 3.5,
            'final_price' => 28000,
            'payment_status' => 'belum_dibayar',
        ]);

        $this->actingAs($user)
            ->get(route('pengusaha.pesanan.detail', $order->order_number))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Pengusaha/DetailPesanan')
                ->where('order.id', $order->order_number)
                ->where('order.status', 'Menunggu pembayaran')
                ->where('order.actualWeight', 3.5)
                ->where('order.finalPrice', 28000)
                ->where('order.estimatedPrice', 24000));
    }

    public function test_pengusaha_can_receive_an_order(): void
    {
        $user = User::factory()->pengusaha()->create();
        $order = $this->makeOrder($user, [
            'status' => OrderStatus::MenungguPenjemputan->value,
        ]);

        $this->actingAs($user)
            ->patch(route('pengusaha.pesanan.terima', $order->order_number))
            ->assertRedirect();

        $this->assertSame(OrderStatus::Diterima, $order->fresh()->status);
        $this->assertDatabaseHas('order_status_logs', [
            'order_id' => $order->id,
            'to_status' => OrderStatus::Diterima->value,
            'changed_by' => $user->id,
        ]);
    }

    public function test_pengusaha_can_save_actual_weight_and_create_invoice(): void
    {
        $user = User::factory()->pengusaha()->create();
        $order = $this->makeOrder($user, [
            'status' => OrderStatus::Diterima->value,
        ]);

        $this->actingAs($user)
            ->patch(route('pengusaha.pesanan.timbang', $order->order_number), [
                'actual_weight' => 3.5,
            ])
            ->assertRedirect();

        $order->refresh();

        $this->assertSame(3.5, $order->actual_weight);
        $this->assertSame(28000, $order->final_price);
        $this->assertSame(OrderStatus::MenungguPembayaran, $order->status);
        $this->assertSame('belum_dibayar', $order->payment_status);
        $this->assertNotNull($order->invoiced_at);
        $this->assertSame(3.5, $order->items()->first()->actual_quantity);
        $this->assertSame(28000, $order->items()->first()->subtotal);
    }

    public function test_pengusaha_can_confirm_payment(): void
    {
        $user = User::factory()->pengusaha()->create();
        $order = $this->makeOrder($user, [
            'status' => OrderStatus::MenungguPembayaran->value,
            'actual_weight' => 3,
            'final_price' => 24000,
            'payment_status' => 'belum_dibayar',
        ]);

        $this->actingAs($user)
            ->patch(route('pengusaha.pesanan.bayar', $order->order_number), [
                'payment_method' => 'Transfer bank',
            ])
            ->assertRedirect();

        $order->refresh();

        $this->assertSame('lunas', $order->payment_status);
        $this->assertSame(OrderStatus::Diproses, $order->status);
    }

    public function test_pengusaha_can_finish_an_order(): void
    {
        $user = User::factory()->pengusaha()->create();
        $order = $this->makeOrder($user, [
            'status' => OrderStatus::Diproses->value,
            'payment_status' => 'lunas',
        ]);

        $this->actingAs($user)
            ->patch(route('pengusaha.pesanan.siap', $order->order_number))
            ->assertRedirect();

        $this->assertSame(OrderStatus::SiapDiambil, $order->fresh()->status);

        $this->actingAs($user)
            ->patch(route('pengusaha.pesanan.selesai', $order->order_number))
            ->assertRedirect();

        $this->assertSame(OrderStatus::Selesai, $order->fresh()->status);
    }

    public function test_pengusaha_can_cancel_an_order(): void
    {
        $user = User::factory()->pengusaha()->create();
        $order = $this->makeOrder($user, [
            'status' => OrderStatus::MenungguPenjemputan->value,
        ]);

        $this->actingAs($user)
            ->patch(route('pengusaha.pesanan.batalkan', $order->order_number))
            ->assertRedirect();

        $this->assertSame(OrderStatus::Dibatalkan, $order->fresh()->status);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function makeOrder(User $user, array $overrides = []): Order
    {
        $service = Service::query()->create([
            'slug' => 'cuci-setrika',
            'name' => 'Cuci dan Setrika',
            'category' => 'kiloan',
            'unit' => 'kg',
            'price' => 8000,
            'min_quantity' => 3,
            'step_quantity' => 0.5,
            'estimated_hours' => 52,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $customer = Customer::query()->create([
            'name' => 'Ayu Lestari',
            'whatsapp' => '6281234567890',
        ]);

        $order = Order::query()->create(array_merge([
            'order_number' => 'LDR-20261024-0001',
            'customer_id' => $customer->id,
            'user_id' => $user->id,
            'source' => 'manual',
            'intake_method' => 'jemput',
            'delivery_method' => 'ambil',
            'pickup_address' => 'Jl. Melati No. 12, Bandung',
            'schedule_date' => now()->addDay()->toDateString(),
            'schedule_time' => '10:00-12:00',
            'estimated_weight' => 3,
            'actual_weight' => null,
            'estimated_price' => 24000,
            'final_price' => null,
            'status' => OrderStatus::Diterima->value,
            'payment_status' => 'belum_dibayar',
            'notes' => 'Pisahkan pakaian putih.',
        ], $overrides));

        $order->items()->create([
            'service_id' => $service->id,
            'service_name' => $service->name,
            'unit' => $service->unit,
            'estimated_quantity' => 3,
            'actual_quantity' => null,
            'unit_price' => $service->price,
            'subtotal' => 24000,
        ]);

        return $order;
    }
}
