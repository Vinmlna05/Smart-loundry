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

class PengusahaPembayaranTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/pengusaha/pembayaran')->assertRedirect('/login');
    }

    public function test_pelanggan_is_redirected_to_their_dashboard(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/pengusaha/pembayaran')
            ->assertRedirect(route('pelanggan.dashboard'));
    }

    public function test_pengusaha_sees_payments_derived_from_orders(): void
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
            'final_price' => 28000,
            'invoiced_at' => now(),
        ]);

        $this->makeOrder($user, $customer, $service, 'LDR-20261029-0002', [
            'status' => OrderStatus::Diproses->value,
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
            ->get('/pengusaha/pembayaran')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Pengusaha/Pembayaran')
                ->has('payments', 2)
                ->where('payments.0.orderId', 'LDR-20261029-0002')
                ->where('payments.0.invoiceNumber', 'INV-20261029-0002')
                ->where('payments.0.amount', 32000)
                ->where('payments.0.status', 'Lunas')
                ->where('payments.0.method', 'QRIS')
                ->where('payments.0.channel', 'QRIS outlet')
                ->where('payments.0.confirmedBy', $user->name)
                ->where('payments.1.orderId', 'LDR-20261029-0001')
                ->where('payments.1.status', 'Belum dibayar')
                ->where('payments.1.method', 'Belum dipilih')
                ->where('payments.1.channel', '-'));
    }

    public function test_payment_confirmation_persists_method_and_confirmer(): void
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

        $order = $this->makeOrder(
            $user,
            $customer,
            $service,
            'LDR-20261029-0001',
            [
                'status' => OrderStatus::MenungguPembayaran->value,
                'final_price' => 28000,
            ],
        );

        $this->actingAs($user)
            ->patch(route('pengusaha.pesanan.bayar', $order->order_number), [
                'payment_method' => 'Transfer bank',
            ])
            ->assertRedirect();

        $order->refresh();

        $this->assertSame('lunas', $order->payment_status);
        $this->assertSame('Transfer bank', $order->payment_method);
        $this->assertNotNull($order->paid_at);
        $this->assertSame($user->id, $order->payment_confirmed_by);
        $this->assertSame(OrderStatus::Diproses, $order->status);
    }

    public function test_payment_method_must_be_supported(): void
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

        $order = $this->makeOrder(
            $user,
            $customer,
            $service,
            'LDR-20261029-0001',
            [
                'status' => OrderStatus::MenungguPembayaran->value,
                'final_price' => 28000,
            ],
        );

        $this->actingAs($user)
            ->patch(route('pengusaha.pesanan.bayar', $order->order_number), [
                'payment_method' => 'Bitcoin',
            ])
            ->assertSessionHasErrors('payment_method');

        $this->assertSame('belum_dibayar', $order->fresh()->payment_status);
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
