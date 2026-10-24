<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

        $this->actingAs($user)
            ->get('/pelanggan/layanan')
            ->assertOk();
    }

    public function test_pengusaha_is_redirected_to_their_own_dashboard(): void
    {
        $user = User::factory()->pengusaha()->create();

        $this->actingAs($user)
            ->get('/pelanggan/layanan')
            ->assertRedirect(route('pengusaha.dashboard'));
    }
}
