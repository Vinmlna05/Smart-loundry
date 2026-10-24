<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PengusahaDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/pengusaha/dashboard')->assertRedirect(route('login'));
    }

    public function test_pengusaha_can_view_their_dashboard(): void
    {
        $user = User::factory()->pengusaha()->create();

        $this->actingAs($user)
            ->get('/pengusaha/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Pengusaha/Dashboard')
                ->where('auth.user.role', 'pengusaha'));
    }

    public function test_pelanggan_is_redirected_to_their_own_dashboard(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/pengusaha/dashboard')
            ->assertRedirect(route('pelanggan.dashboard'));
    }
}
