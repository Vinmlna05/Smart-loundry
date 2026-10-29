<?php

namespace Tests\Feature;

use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PengusahaLayananTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/pengusaha/layanan')->assertRedirect(route('login'));
    }

    public function test_pengusaha_can_view_service_management(): void
    {
        $user = User::factory()->pengusaha()->create();

        $this->actingAs($user)
            ->get('/pengusaha/layanan')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Pengusaha/Layanan')
                ->where('auth.user.role', 'pengusaha'));
    }

    public function test_pelanggan_cannot_view_service_management(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/pengusaha/layanan')
            ->assertRedirect(route('pelanggan.dashboard'));
    }

    public function test_pengusaha_can_add_a_service(): void
    {
        $user = User::factory()->pengusaha()->create();

        $this->actingAs($user)
            ->post('/pengusaha/layanan', [
                'name' => 'Cuci Gorden',
                'category' => 'satuan',
                'description' => 'Pembersihan gorden per pcs.',
                'unit' => 'pcs',
                'price' => 35000,
                'min_quantity' => 1,
                'step_quantity' => 1,
                'estimated_hours' => 72,
                'is_active' => true,
                'is_starting_at' => false,
            ])
            ->assertRedirect()
            ->assertSessionHas('status', 'Layanan ditambahkan.');

        $this->assertDatabaseHas('services', [
            'name' => 'Cuci Gorden',
            'slug' => 'cuci-gorden',
            'category' => 'satuan',
            'price' => 35000,
            'is_active' => true,
        ]);
    }

    public function test_pengusaha_can_change_a_service_tariff(): void
    {
        $user = User::factory()->pengusaha()->create();
        $service = Service::query()->create([
            'slug' => 'cuci-kering',
            'name' => 'Cuci Kering',
            'category' => 'kiloan',
            'unit' => 'kg',
            'price' => 6000,
            'min_quantity' => 3,
            'step_quantity' => 0.5,
            'estimated_hours' => 52,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $this->actingAs($user)
            ->patch(route('pengusaha.layanan.update', $service), [
                'price' => 7500,
            ])
            ->assertRedirect();

        $this->assertSame(7500, $service->fresh()->price);
    }

    public function test_pengusaha_can_toggle_service_status(): void
    {
        $user = User::factory()->pengusaha()->create();
        $service = Service::query()->create([
            'slug' => 'cuci-kering',
            'name' => 'Cuci Kering',
            'category' => 'kiloan',
            'unit' => 'kg',
            'price' => 6000,
            'min_quantity' => 3,
            'step_quantity' => 0.5,
            'estimated_hours' => 52,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $this->actingAs($user)
            ->patch(route('pengusaha.layanan.update', $service), [
                'is_active' => false,
            ])
            ->assertRedirect();

        $this->assertFalse($service->fresh()->is_active);
    }

    public function test_pelanggan_cannot_change_services(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->post('/pengusaha/layanan', [])
            ->assertRedirect(route('pelanggan.dashboard'));

        $this->assertDatabaseCount('services', 0);
    }
}
