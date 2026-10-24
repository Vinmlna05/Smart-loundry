<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PengusahaLaporanTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/pengusaha/laporan')->assertRedirect(route('login'));
    }

    public function test_pengusaha_can_view_transaction_report(): void
    {
        $user = User::factory()->pengusaha()->create();

        $this->actingAs($user)
            ->get('/pengusaha/laporan')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Pengusaha/Laporan')
                ->where('auth.user.role', 'pengusaha'));
    }

    public function test_pelanggan_cannot_view_transaction_report(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/pengusaha/laporan')
            ->assertRedirect(route('pelanggan.dashboard'));
    }
}
