<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PelangganChatbotTest extends TestCase
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

    private function fakeGemini(array $payload): void
    {
        config(['gemini.api_key' => 'test-key']);

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                ['text' => json_encode($payload)],
                            ],
                        ],
                    ],
                ],
            ]),
        ]);
    }

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

    public function test_chatbot_calculates_price_from_the_service_database(): void
    {
        $service = $this->service();

        $this->fakeGemini([
            'reply' => 'Semua data sudah lengkap. Periksa ringkasan pesananmu, ya.',
            'transcript' => null,
            'wants_to_order' => true,
            'handoff_to_manual' => false,
            'order' => [
                'name' => 'Ayu Lestari',
                'whatsapp' => '0812-3456-7890',
                'service_id' => $service->id,
                'estimated_quantity' => 3.5,
                'intake_method' => 'antar',
                'address' => null,
                'schedule_date' => now()->addDay()->toDateString(),
                'schedule_time' => '10:00-12:00',
                'notes' => null,
            ],
        ]);

        $user = User::factory()->create();
        $token = 'test-csrf-token';

        $this->withSession(['_token' => $token])
            ->actingAs($user)
            ->postJson('/pelanggan/chatbot/pesan', [
                '_token' => $token,
                'session_token' => 'session-abc-123',
                'message' => 'Cuci dan setrika 3,5 kg, antar sendiri besok jam 10.',
            ], [
                'X-CSRF-TOKEN' => $token,
                'X-XSRF-TOKEN' => $token,
            ])
            ->assertOk()
            ->assertJsonPath('summary.total', 28000)
            ->assertJsonPath('summary.unitPrice', 8000)
            ->assertJsonPath('summary.order.service_id', $service->id)
            ->assertJsonPath('missing_fields', []);

        Http::assertSent(function (HttpRequest $request) {
            $body = json_decode($request->body(), true);
            $prompt = (string) data_get($body, 'systemInstruction.parts.0.text');

            return str_contains($prompt, 'Cuci dan Setrika')
                && str_contains($prompt, '8000')
                && str_contains($prompt, 'Jangan menampilkan total biaya');
        });
    }

    public function test_chatbot_asks_only_for_missing_fields(): void
    {
        $service = $this->service();

        $this->fakeGemini([
            'reply' => 'Nomor WhatsApp dan jadwal penjemputan masih kosong.',
            'transcript' => null,
            'wants_to_order' => true,
            'handoff_to_manual' => false,
            'order' => [
                'name' => 'Ayu',
                'whatsapp' => null,
                'service_id' => $service->id,
                'estimated_quantity' => 3,
                'intake_method' => 'jemput',
                'address' => 'Jl. Melati No. 12, Bandung',
                'schedule_date' => null,
                'schedule_time' => null,
                'notes' => null,
            ],
        ]);

        $token = 'test-csrf-token';

        $this->withSession(['_token' => $token])
            ->actingAs(User::factory()->create())
            ->postJson('/pelanggan/chatbot/pesan', [
                '_token' => $token,
                'session_token' => 'session-abc-124',
                'message' => 'Saya mau cuci 3 kg dijemput ke Jl. Melati.',
            ], [
                'X-CSRF-TOKEN' => $token,
                'X-XSRF-TOKEN' => $token,
            ])
            ->assertOk()
            ->assertJsonPath('summary', null)
            ->assertJsonPath('missing_fields', ['whatsapp', 'schedule_date', 'schedule_time']);
    }

    public function test_chatbot_keeps_order_summary_when_ai_sets_wants_to_order_false_but_order_data_is_complete(): void
    {
        $service = $this->service();
        $scheduleDate = now()->addDay()->toDateString();

        $this->fakeGemini([
            'reply' => 'Baik, saya catat pesananmu.',
            'transcript' => null,
            'wants_to_order' => false,
            'handoff_to_manual' => false,
            'order' => [
                'name' => 'Ayu Lestari',
                'whatsapp' => '081234567890',
                'service_id' => $service->id,
                'estimated_quantity' => 3,
                'intake_method' => 'jemput',
                'address' => 'Jl. Melati No. 12, Bandung',
                'schedule_date' => $scheduleDate,
                'schedule_time' => '08:00-10:00',
                'notes' => 'Jemput pagi',
            ],
        ]);

        $token = 'test-csrf-token';

        $this->withSession(['_token' => $token])
            ->actingAs(User::factory()->create())
            ->postJson('/pelanggan/chatbot/pesan', [
                '_token' => $token,
                'session_token' => 'session-abc-125',
                'message' => 'Saya mau cuci dan setrika 3 kg, dijemput besok pagi di Jl. Melati No. 12, Bandung.',
            ], [
                'X-CSRF-TOKEN' => $token,
                'X-XSRF-TOKEN' => $token,
            ])
            ->assertOk()
            ->assertJsonPath('summary.order.name', 'Ayu Lestari')
            ->assertJsonPath('summary.order.service_id', $service->id)
            ->assertJsonPath('missing_fields', []);
    }

    public function test_audio_message_is_sent_to_gemini(): void
    {
        $this->fakeGemini([
            'reply' => 'Aku mendengar kamu ingin cuci 3 kg.',
            'transcript' => 'Saya mau cuci 3 kg.',
            'wants_to_order' => true,
            'handoff_to_manual' => false,
            'order' => [
                'name' => null,
                'whatsapp' => null,
                'service_id' => null,
                'estimated_quantity' => 3,
                'intake_method' => null,
                'address' => null,
                'schedule_date' => null,
                'schedule_time' => null,
                'notes' => null,
            ],
        ]);

        $token = 'test-csrf-token';

        $this->withSession(['_token' => $token])
            ->actingAs(User::factory()->create())
            ->post('/pelanggan/chatbot/pesan', [
                '_token' => $token,
                'session_token' => 'session-audio-123',
                'audio' => UploadedFile::fake()->create('voice.wav', 20, 'audio/wav'),
                'audio_seconds' => 5,
            ])
            ->assertOk()
            ->assertJsonPath('transcript', 'Saya mau cuci 3 kg.');

        Http::assertSent(function (HttpRequest $request) {
            $body = json_decode($request->body(), true);
            $parts = data_get($body, 'contents.0.parts', []);

            return collect($parts)->contains(
                fn (array $part) => isset($part['inlineData']['data']),
            );
        });
    }

    public function test_chatbot_confirmation_creates_a_chatbot_order(): void
    {
        $service = $this->service();
        $user = User::factory()->create();

        $token = 'test-csrf-token';

        $response = $this->withSession(['_token' => $token])
            ->actingAs($user)
            ->postJson('/pelanggan/chatbot/konfirmasi', [
                '_token' => $token,
                'name' => 'Ayu Lestari',
                'whatsapp' => '081234567890',
                'service_id' => $service->id,
                'estimated_quantity' => 3,
                'intake_method' => 'antar',
                'delivery_method' => 'ambil',
                'schedule_date' => now()->toDateString(),
                'schedule_time' => '08:00-10:00',
            ], [
                'X-CSRF-TOKEN' => $token,
                'X-XSRF-TOKEN' => $token,
            ])
            ->assertOk();

        $this->assertIsString($response->json('order_number'));

        $order = Order::query()->firstOrFail();

        $this->assertSame('chatbot', $order->source);
        $this->assertSame(24000, $order->estimated_price);
        $this->assertSame($user->id, $order->user_id);
    }

    public function test_chatbot_confirmation_validates_tariff_and_quantity(): void
    {
        $service = $this->service();
        $user = User::factory()->create();

        $token = 'test-csrf-token';

        $this->withSession(['_token' => $token])
            ->actingAs($user)
            ->postJson('/pelanggan/chatbot/konfirmasi', [
                '_token' => $token,
                'name' => 'Ayu',
                'whatsapp' => '081234567890',
                'service_id' => $service->id,
                'estimated_quantity' => 1,
                'intake_method' => 'antar',
                'schedule_date' => now()->toDateString(),
                'schedule_time' => '08:00-10:00',
            ], [
                'X-CSRF-TOKEN' => $token,
                'X-XSRF-TOKEN' => $token,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('estimated_quantity');

        $this->assertDatabaseCount('orders', 0);
    }
}
