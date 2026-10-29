<?php

namespace Tests\Feature;

use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PelangganLayananTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/pelanggan/layanan')->assertRedirect(route('login'));
    }

    public function test_pelanggan_can_view_services_page(): void
    {
        $user = User::factory()->create();

        Service::query()->create([
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

        $this->actingAs($user)
            ->get('/pelanggan/layanan')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Pelanggan/Layanan')
                ->where('services.0.name', 'Cuci dan Setrika')
                ->where('services.0.price', 8000));
    }

    public function test_pengusaha_is_redirected_to_their_own_dashboard(): void
    {
        $user = User::factory()->pengusaha()->create();

        $this->actingAs($user)
            ->get('/pelanggan/layanan')
            ->assertRedirect(route('pengusaha.dashboard'));
    }
}
