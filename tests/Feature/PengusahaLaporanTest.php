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

class PengusahaLaporanTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/pengusaha/laporan')->assertRedirect(route('login'));
    }

    public function test_pengusaha_can_view_transaction_report(): void
    {
        $user = User::factory()->pengusaha()->create();

        $this->actingAs($user)
            ->get('/pengusaha/laporan')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Pengusaha/Laporan')
                ->where('auth.user.role', 'pengusaha'));
    }

    public function test_pelanggan_cannot_view_transaction_report(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/pengusaha/laporan')
            ->assertRedirect(route('pelanggan.dashboard'));
    }

    public function test_report_contains_transactions_derived_from_orders(): void
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
            'status' => OrderStatus::Dibatalkan->value,
            'final_price' => 24000,
        ]);

        $this->makeOrder($user, $customer, $service, 'LDR-20261029-0002', [
            'source' => 'chatbot',
            'intake_method' => 'jemput',
            'final_price' => 28000,
            'status' => OrderStatus::Diproses->value,
            'payment_status' => 'lunas',
            'payment_method' => 'QRIS',
            'paid_at' => now(),
        ]);

        $this->actingAs($user)
            ->get('/pengusaha/laporan')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Pengusaha/Laporan')
                ->has('transactions', 2)
                ->where('transactions.0.id', 'LDR-20261029-0002')
                ->where('transactions.0.invoiceNumber', 'INV-20261029-0002')
                ->where('transactions.0.customer', 'Ayu Lestari')
                ->where('transactions.0.phone', '081234567890')
                ->where('transactions.0.source', 'Chatbot AI')
                ->where('transactions.0.intake', 'Dijemput')
                ->where('transactions.0.amount', 28000)
                ->where('transactions.0.paymentStatus', 'Lunas')
                ->where('transactions.0.paymentMethod', 'QRIS')
                ->where('transactions.0.isCanceled', false)
                ->where('transactions.1.id', 'LDR-20261029-0001')
                ->where('transactions.1.paymentStatus', 'Tidak perlu bayar')
                ->where('transactions.1.isCanceled', true));
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
