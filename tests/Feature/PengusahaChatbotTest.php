<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Chatbot\ChatbotSettings;
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

    public function test_pengusaha_can_save_chatbot_rules(): void
    {
        $user = User::factory()->pengusaha()->create();
        $token = 'test-csrf-token';

        $this->withSession(['_token' => $token])
            ->actingAs($user)
            ->post('/pengusaha/chatbot', [
                '_token' => $token,
                'enabled' => true,
                'botName' => 'Nova',
                'tone' => 'Ringkas',
                'greeting' => 'Halo, ada yang bisa dibantu?',
                'systemPrompt' => 'Hanya jawab seputar laundry dan jangan mengarang tarif.',
                'autoServices' => true,
                'includeOutlets' => false,
                'includeDurations' => true,
                'guardrails' => [
                    'priceFromList' => true,
                    'noInventedServices' => true,
                    'askMissingOnly' => true,
                    'offerManual' => false,
                ],
                'fallbackAction' => 'Minta pelanggan menghubungi outlet',
                'maxMessages' => 30,
                'rateLimitPerHour' => 12,
                'maxAudioSeconds' => 90,
                'storeTranscripts' => false,
            ])
            ->assertRedirect()
            ->assertSessionHas('status', 'Pengaturan chatbot disimpan.');

        $settings = app(ChatbotSettings::class)->all();

        $this->assertSame('Ringkas', $settings['tone']);
        $this->assertFalse($settings['includeOutlets']);
        $this->assertFalse($settings['guardrails']['offerManual']);
        $this->assertSame(90, $settings['maxAudioSeconds']);
    }
}
