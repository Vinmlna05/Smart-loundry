<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PengusahaPelangganTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/pengusaha/pelanggan')->assertRedirect(route('login'));
    }

    public function test_pengusaha_can_view_customer_management(): void
    {
        $user = User::factory()->pengusaha()->create();

        $this->actingAs($user)
            ->get('/pengusaha/pelanggan')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Pengusaha/Pelanggan')
                ->where('auth.user.role', 'pengusaha'));
    }

    public function test_pelanggan_cannot_view_customer_management(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/pengusaha/pelanggan')
            ->assertRedirect(route('pelanggan.dashboard'));
    }
}
