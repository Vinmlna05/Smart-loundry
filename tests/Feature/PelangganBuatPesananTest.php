<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Service;
use App\Models\User;
use Database\Seeders\ServiceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PelangganBuatPesananTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(ServiceSeeder::class);
    }

    public function test_guest_is_redirected_to_login_when_confirming_an_order(): void
    {
        $this->post('/pelanggan/pesan', [])->assertRedirect(route('login'));
    }

    public function test_pengusaha_cannot_confirm_an_order(): void
    {
        $user = User::factory()->pengusaha()->create();

        $this->actingAs($user)
            ->post('/pelanggan/pesan', [])
            ->assertRedirect(route('pengusaha.dashboard'));
    }

    public function test_pelanggan_can_confirm_a_pickup_order(): void
    {
        $service = Service::where('slug', 'cuci-setrika')->firstOrFail();
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/pelanggan/pesan', [
            'name' => 'Ayu Lestari',
            'whatsapp' => '0812-3456-7890',
            'service_id' => $service->id,
            'estimated_quantity' => 3.5,
            'notes' => 'Pisahkan pakaian putih.',
            'intake_method' => 'jemput',
            'address' => 'Jl. Melati No. 12, Bandung',
            'schedule_date' => now()->addDay()->toDateString(),
            'schedule_time' => '10:00-12:00',
        ]);

        $order = Order::with(['customer', 'items', 'statusLogs'])->firstOrFail();

        $response->assertRedirect(route('pelanggan.pesan.berhasil', $order->order_number));
        $this->assertSame($user->id, $order->user_id);
        $this->assertSame('manual', $order->source);
        $this->assertSame('jemput', $order->intake_method);
        $this->assertSame('Jl. Melati No. 12, Bandung', $order->pickup_address);
        $this->assertSame(28000, $order->estimated_price);
        $this->assertSame(OrderStatus::MenungguPenjemputan, $order->status);
        $this->assertSame('6281234567890', $order->customer->whatsapp);
        $this->assertSame('Ayu Lestari', $order->customer->name);
        $this->assertSame(1, $order->items->count());
        $this->assertSame(28000, $order->items->first()->subtotal);
        $this->assertMatchesRegularExpression(
            '/^LDR-\d{8}-\d{4}$/',
            $order->order_number,
        );
        $this->assertSame(
            [
                OrderStatus::Terkonfirmasi->value,
                OrderStatus::MenungguPenjemputan->value,
            ],
            $order->statusLogs->pluck('to_status')->all(),
        );
    }

    public function test_antar_sendiri_order_waits_for_customer_drop_off(): void
    {
        $service = Service::where('slug', 'express')->firstOrFail();
        $user = User::factory()->create();

        $this->actingAs($user)->post('/pelanggan/pesan', [
            'name' => 'Budi',
            'whatsapp' => '08123456789',
            'service_id' => $service->id,
            'estimated_quantity' => 1,
            'intake_method' => 'antar',
            'schedule_date' => now()->toDateString(),
            'schedule_time' => '10:00-12:00',
        ])->assertRedirect();

        $order = Order::firstOrFail();

        $this->assertSame(OrderStatus::MenungguAntaranPelanggan, $order->status);
        $this->assertSame('antar', $order->intake_method);
        $this->assertNull($order->pickup_address);
        $this->assertSame(12000, $order->estimated_price);
    }

    public function test_pickup_order_requires_an_address(): void
    {
        $service = Service::where('slug', 'cuci-kering')->firstOrFail();
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/pelanggan/pesan', [
                'name' => 'Ayu',
                'whatsapp' => '081234567890',
                'service_id' => $service->id,
                'estimated_quantity' => 3,
                'intake_method' => 'jemput',
                'schedule_date' => now()->addDay()->toDateString(),
                'schedule_time' => '08:00-10:00',
            ])
            ->assertSessionHasErrors('address');

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_quantity_below_the_service_minimum_is_rejected(): void
    {
        $service = Service::where('slug', 'cuci-kering')->firstOrFail();
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/pelanggan/pesan', [
                'name' => 'Ayu',
                'whatsapp' => '081234567890',
                'service_id' => $service->id,
                'estimated_quantity' => 1,
                'intake_method' => 'antar',
                'schedule_date' => now()->toDateString(),
                'schedule_time' => '08:00-10:00',
            ])
            ->assertSessionHasErrors('estimated_quantity');

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_invalid_whatsapp_number_is_rejected(): void
    {
        $service = Service::where('slug', 'cuci-kering')->firstOrFail();
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/pelanggan/pesan', [
                'name' => 'Ayu',
                'whatsapp' => '12345',
                'service_id' => $service->id,
                'estimated_quantity' => 3,
                'intake_method' => 'antar',
                'schedule_date' => now()->toDateString(),
                'schedule_time' => '08:00-10:00',
            ])
            ->assertSessionHasErrors('whatsapp');

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_success_page_only_shows_the_owners_order(): void
    {
        $service = Service::where('slug', 'cuci-kering')->firstOrFail();
        $owner = User::factory()->create();
        $other = User::factory()->create();

        $this->actingAs($owner)->post('/pelanggan/pesan', [
            'name' => 'Ayu',
            'whatsapp' => '081234567890',
            'service_id' => $service->id,
            'estimated_quantity' => 3,
            'intake_method' => 'antar',
            'schedule_date' => now()->toDateString(),
            'schedule_time' => '08:00-10:00',
        ]);

        $order = Order::firstOrFail();

        $this->actingAs($owner)
            ->get(route('pelanggan.pesan.berhasil', $order->order_number))
            ->assertOk();

        $this->actingAs($other)
            ->get(route('pelanggan.pesan.berhasil', $order->order_number))
            ->assertNotFound();
    }
}
