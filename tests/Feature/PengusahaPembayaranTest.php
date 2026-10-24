<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PengusahaPembayaranTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/pengusaha/pembayaran')->assertRedirect(route('login'));
    }

    public function test_pengusaha_can_view_payment_and_invoice_page(): void
    {
        $user = User::factory()->pengusaha()->create();

        $this->actingAs($user)
            ->get('/pengusaha/pembayaran')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Pengusaha/Pembayaran')
                ->where('auth.user.role', 'pengusaha'));
    }

    public function test_pelanggan_cannot_view_payment_and_invoice_page(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/pengusaha/pembayaran')
            ->assertRedirect(route('pelanggan.dashboard'));
    }
}
