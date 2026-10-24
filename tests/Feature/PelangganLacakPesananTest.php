<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PelangganLacakPesananTest extends TestCase
{
    use RefreshDatabase;

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

    public function test_pengusaha_is_redirected_to_their_own_dashboard(): void
    {
        $user = User::factory()->pengusaha()->create();

        $this->actingAs($user)
            ->get('/pelanggan/lacak-pesanan')
            ->assertRedirect(route('pengusaha.dashboard'));
    }
}
