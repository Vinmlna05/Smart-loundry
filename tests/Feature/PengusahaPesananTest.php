<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PengusahaPesananTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/pengusaha/pesanan')->assertRedirect(route('login'));
    }

    public function test_pengusaha_can_view_order_management(): void
    {
        $user = User::factory()->pengusaha()->create();

        $this->actingAs($user)
            ->get('/pengusaha/pesanan')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Pengusaha/Pesanan')
                ->where('auth.user.role', 'pengusaha'));
    }

    public function test_pengusaha_can_view_order_detail(): void
    {
        $user = User::factory()->pengusaha()->create();

        $this->actingAs($user)
            ->get('/pengusaha/pesanan/LDR-20261024-0001')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Pengusaha/DetailPesanan')
                ->where('nomorPesanan', 'LDR-20261024-0001')
                ->where('auth.user.role', 'pengusaha'));
    }

    public function test_pelanggan_cannot_view_pengusaha_order_management(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/pengusaha/pesanan')
            ->assertRedirect(route('pelanggan.dashboard'));
    }

    public function test_pelanggan_cannot_view_pengusaha_order_detail(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/pengusaha/pesanan/LDR-20261024-0001')
            ->assertRedirect(route('pelanggan.dashboard'));
    }
}
