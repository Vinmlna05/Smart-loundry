<?php

namespace Tests\Feature;

use App\Models\ChatSession;
use App\Models\Service;
use App\Models\User;
use App\Services\Chatbot\ChatbotSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PengusahaChatbotTest extends TestCase
{
    use RefreshDatabase;

    private function service(): Service
    {
        return Service::query()->create([
            'slug' => 'cuci-setrika',
            'name' => 'Cuci dan Setrika',
            'category' => 'kiloan',
            'description' => 'Cuci, kering, setrika.',
            'unit' => 'kg',
            'price' => 8000,
            'min_quantity' => 3,
            'step_quantity' => 0.5,
            'estimated_hours' => 52,
            'is_active' => true,
            'sort_order' => 1,
        ]);
    }

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

    public function test_owner_can_test_the_real_chatbot_without_saving_a_session(): void
    {
        $service = $this->service();
        $user = User::factory()->pengusaha()->create();
        $token = 'test-csrf-token';

        config(['gemini.api_key' => 'test-key']);

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'reply' => 'Data lengkap. Ringkasan pesanan siap diperiksa.',
                                        'transcript' => null,
                                        'wants_to_order' => true,
                                        'handoff_to_manual' => false,
                                        'order' => [
                                            'name' => 'Ayu Lestari',
                                            'whatsapp' => '081234567890',
                                            'service_id' => $service->id,
                                            'estimated_quantity' => 3,
                                            'intake_method' => 'antar',
                                            'address' => null,
                                            'schedule_date' => now()->addDay()->toDateString(),
                                            'schedule_time' => '10:00-12:00',
                                            'notes' => null,
                                        ],
                                    ]),
                                ],
                            ],
                        ],
                    ],
                ],
            ]),
        ]);

        $this->withSession(['_token' => $token])
            ->actingAs($user)
            ->postJson('/pengusaha/chatbot/uji', [
                '_token' => $token,
                'session_token' => 'owner-preview-test-123',
                'message' => 'Cuci dan setrika 3 kg, antar sendiri besok jam 10.',
            ])
            ->assertOk()
            ->assertJsonPath('ai_status', 'ok')
            ->assertJsonPath('summary.total', 24000)
            ->assertJsonPath('summary.order.name', 'Ayu Lestari');

        $this->assertDatabaseCount('chat_sessions', 0);
        $this->assertDatabaseCount('chat_messages', 0);
    }

    public function test_owner_stats_exclude_preview_sessions_and_show_recent_chats(): void
    {
        $user = User::factory()->pengusaha()->create();

        ChatSession::query()->create([
            'token' => 'customer-chat-session',
            'source' => 'chatbot',
        ]);

        ChatSession::query()->create([
            'token' => 'owner-preview-session',
            'source' => 'owner_preview',
        ]);

        $this->actingAs($user)
            ->get('/pengusaha/chatbot')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Pengusaha/Chatbot')
                ->where('stats.conversationsToday', 1)
                ->has('recentSessions', 1)
                ->where('recentSessions.0.customer', 'Tamu'));
    }
}
