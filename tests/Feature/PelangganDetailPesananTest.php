<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
