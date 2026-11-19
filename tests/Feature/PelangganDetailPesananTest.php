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

class PelangganDetailPesananTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/pelanggan/pesanan/LDR-20261024-0001')
            ->assertRedirect(route('login'));
    }

    public function test_pelanggan_can_view_order_detail_page(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/pelanggan/pesanan/LDR-20261024-0001')
            ->assertOk();
    }

    public function test_unknown_order_number_still_renders_page(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/pelanggan/pesanan/LDR-19990101-9999')
            ->assertOk();
    }

    public function test_pengusaha_is_redirected_to_their_own_dashboard(): void
    {
        $user = User::factory()->pengusaha()->create();

        $this->actingAs($user)
            ->get('/pelanggan/pesanan/LDR-20261024-0001')
            ->assertRedirect(route('pengusaha.dashboard'));
    }

    public function test_order_detail_shows_payment_instructions(): void
    {
        $user = User::factory()->create();
        $order = $this->makeOrder($user, [
            'payment_method' => 'Transfer bank',
            'payment_details' => [
                'method' => 'Transfer bank',
                'businessName' => 'Cleanora Laundry',
                'accounts' => [
                    [
                        'bankName' => 'BCA',
                        'accountNumber' => '1234567890',
                        'accountHolder' => 'Cleanora Laundry',
                        'isPrimary' => true,
                    ],
                ],
                'qrisPath' => null,
                'outletAddress' => 'Jl. Merdeka No. 18, Bandung',
                'operatingHours' => 'Setiap hari, 07.00–21.00',
            ],
        ]);

        $this->actingAs($user)
            ->get(route('pelanggan.pesanan.detail', $order->order_number))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Pelanggan/DetailPesanan')
                ->where('order.number', $order->order_number)
                ->where('order.payment.method', 'Transfer bank')
                ->where('order.payment.accounts.0.bankName', 'BCA')
                ->where('order.payment.accounts.0.accountNumber', '1234567890')
                ->where('order.payment.businessName', 'Cleanora Laundry'));
    }

    public function test_order_detail_does_not_expose_another_customers_order(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $order = $this->makeOrder($owner);

        $this->actingAs($other)
            ->get(route('pelanggan.pesanan.detail', $order->order_number))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('order', null));
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
            'is_active' => true,
        ]);

        $customer = Customer::query()->create([
            'name' => 'Ayu Lestari',
            'whatsapp' => '6281234567890',
            'user_id' => $user->id,
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
            'actual_weight' => 3.5,
            'estimated_price' => 24000,
            'final_price' => 28000,
            'status' => OrderStatus::MenungguPembayaran->value,
            'payment_status' => 'belum_dibayar',
            'invoiced_at' => now(),
        ], $overrides));

        $order->items()->create([
            'service_id' => $service->id,
            'service_name' => $service->name,
            'unit' => $service->unit,
            'estimated_quantity' => 3,
            'actual_quantity' => 3.5,
            'unit_price' => $service->price,
            'subtotal' => 28000,
        ]);

        return $order;
    }
}
