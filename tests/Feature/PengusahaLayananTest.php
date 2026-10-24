<?php

namespace Tests\Feature;

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
}
