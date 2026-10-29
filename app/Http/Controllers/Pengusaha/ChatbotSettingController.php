<?php

namespace App\Http\Controllers\Pengusaha;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChatbotSettingsRequest;
use App\Models\ChatSession;
use App\Models\Order;
use App\Services\Catalog\ServiceCatalog;
use App\Services\Chatbot\ChatbotAssistant;
use App\Services\Chatbot\ChatbotSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ChatbotSettingController extends Controller
{
    public function index(ChatbotSettings $settings, ServiceCatalog $catalog): Response
    {
        $conversationsToday = ChatSession::query()
            ->where('source', 'chatbot')
            ->whereDate('created_at', today())
            ->count();

        $ordersToday = Order::query()
            ->where('source', 'chatbot')
            ->whereDate('created_at', today())
            ->count();

        return Inertia::render('Pengusaha/Chatbot', [
            'settings' => $settings->all(),
            'services' => $catalog->options(),
            'stats' => [
                'conversationsToday' => $conversationsToday,
                'ordersFromChatbot' => $ordersToday,
                'completionRate' => $conversationsToday > 0
                    ? (int) round(min(100, ($ordersToday / $conversationsToday) * 100))
                    : 0,
            ],
            'knowledge' => [
                'outletCount' => 1,
                'hours' => '08.00-20.00',
                'area' => 'Bandung',
            ],
            'recentSessions' => ChatSession::query()
                ->where('source', 'chatbot')
                ->with('user:id,name')
                ->withCount('messages')
                ->latest('updated_at')
                ->limit(5)
                ->get()
                ->map(function (ChatSession $session) {
                    $lastMessage = $session->messages()
                        ->latest('id')
                        ->first(['role', 'content']);

                    return [
                        'id' => $session->id,
                        'customer' => $session->user?->name ?: 'Tamu',
                        'messageCount' => $session->messages_count,
                        'lastMessage' => $lastMessage?->content,
                        'lastRole' => $lastMessage?->role,
                        'updatedAt' => $session->updated_at?->toIso8601String(),
                    ];
                })
                ->values()
                ->all(),
        ]);
    }

    public function update(ChatbotSettingsRequest $request, ChatbotSettings $settings): RedirectResponse
    {
        $settings->update($request->validated());

        return back()->with('status', 'Pengaturan chatbot disimpan.');
    }

    public function test(
        Request $request,
        ChatbotSettings $settings,
        ServiceCatalog $catalog,
        ChatbotAssistant $assistant,
    ): JsonResponse {
        $settingsData = $settings->all();
        $maxAudioSeconds = (int) $settingsData['maxAudioSeconds'];

        $validated = $request->validate([
            'session_token' => ['required', 'string', 'min:8', 'max:64', 'regex:/^[A-Za-z0-9-]+$/'],
            'message' => ['nullable', 'string', 'max:1000', 'required_without:audio'],
            'audio' => [
                'nullable',
                'file',
                'max:8192',
                'mimetypes:audio/wav,audio/x-wav,audio/mpeg,audio/ogg,audio/webm,audio/mp4,audio/x-m4a,audio/aac,audio/flac',
            ],
            'audio_seconds' => ['nullable', 'integer', 'min:1', 'required_with:audio', 'max:'.$maxAudioSeconds],
        ], [
            'session_token.required' => 'Sesi uji tidak ditemukan. Muat ulang halaman, ya.',
            'message.required_without' => 'Tulis pesan atau unggah voice note.',
            'audio.max' => 'Ukuran voice note terlalu besar.',
            'audio.mimetypes' => 'Format voice note tidak didukung.',
            'audio_seconds.required_with' => 'Durasi voice note tidak terbaca.',
            'audio_seconds.max' => 'Durasi voice note maksimal '.$maxAudioSeconds.' detik.',
        ]);

        try {
            $result = $assistant->respond(
                $validated['session_token'],
                $validated['message'] ?? null,
                $request->file('audio'),
                isset($validated['audio_seconds']) ? (int) $validated['audio_seconds'] : null,
                $request->user(),
                $settingsData,
                $catalog->options(),
                'owner_preview',
                false,
            );
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'session_token' => $validated['session_token'],
                'reply' => 'Uji chatbot gagal diproses. Coba lagi atau periksa konfigurasi Gemini.',
                'transcript' => null,
                'missing_fields' => [],
                'handoff_to_manual' => false,
                'summary' => null,
                'ai_status' => 'error',
            ], 200);
        }

        return response()->json($result);
    }
}
