<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PengusahaChatbotTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/pengusaha/chatbot')->assertRedirect(route('login'));
    }

    public function test_pengusaha_can_view_chatbot_settings(): void
    {
        $user = User::factory()->pengusaha()->create();

        $this->actingAs($user)
            ->get('/pengusaha/chatbot')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Pengusaha/Chatbot')
                ->where('auth.user.role', 'pengusaha'));
    }

    public function test_pelanggan_cannot_view_chatbot_settings(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/pengusaha/chatbot')
            ->assertRedirect(route('pelanggan.dashboard'));
    }
}
