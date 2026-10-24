<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PelangganChatbotTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/pelanggan/chatbot')->assertRedirect(route('login'));
    }

    public function test_pelanggan_can_view_chatbot_page(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/pelanggan/chatbot')
            ->assertOk();
    }

    public function test_pengusaha_is_redirected_to_their_own_dashboard(): void
    {
        $user = User::factory()->pengusaha()->create();

        $this->actingAs($user)
            ->get('/pelanggan/chatbot')
            ->assertRedirect(route('pengusaha.dashboard'));
    }
}
