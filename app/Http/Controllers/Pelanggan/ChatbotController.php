<?php

namespace App\Http\Controllers\Pelanggan;

use App\Actions\Orders\CreateOrder;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Services\Catalog\ServiceCatalog;
use App\Services\Chatbot\ChatbotAssistant;
use App\Services\Chatbot\ChatbotSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ChatbotController extends Controller
{
    public function index(ChatbotSettings $settings, ServiceCatalog $catalog): Response
    {
        return Inertia::render('Pelanggan/Chatbot', [
            'settings' => $settings->publicSettings(),
            'services' => $catalog->options(),
        ]);
    }

    public function message(
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
            'session_token.required' => 'Sesi percakapan tidak ditemukan. Muat ulang halaman, ya.',
            'message.required_without' => 'Tulis pesan atau kirim voice note.',
            'audio.max' => 'Ukuran voice note terlalu besar.',
            'audio.mimetypes' => 'Format voice note tidak didukung.',
            'audio_seconds.required_with' => 'Durasi voice note tidak terbaca. Coba rekam ulang.',
            'audio_seconds.max' => 'Durasi voice note maksimal '.$maxAudioSeconds.' detik.',
        ]);

        if (! $settingsData['enabled']) {
            return response()->json([
                'session_token' => $validated['session_token'],
                'reply' => 'Chatbot sedang nonaktif. Kamu tetap bisa memesan lewat halaman Pesan Manual.',
                'transcript' => null,
                'missing_fields' => [],
                'handoff_to_manual' => true,
                'summary' => null,
                'ai_status' => 'disabled',
            ]);
        }

        $rateKey = 'chatbot:'.($request->user()?->id ?? $request->ip());
        $limit = (int) $settingsData['rateLimitPerHour'];

        if (RateLimiter::tooManyAttempts($rateKey, $limit)) {
            throw ValidationException::withMessages([
                'message' => 'Terlalu banyak pesan dalam satu jam. Coba lagi nanti atau gunakan Pesan Manual.',
            ]);
        }

        RateLimiter::hit($rateKey, 3600);

        try {
            $result = $assistant->respond(
                $validated['session_token'],
                $validated['message'] ?? null,
                $request->file('audio'),
                isset($validated['audio_seconds']) ? (int) $validated['audio_seconds'] : null,
                $request->user(),
                $settingsData,
                $catalog->options(),
            );
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'session_token' => $validated['session_token'],
                'reply' => 'Maaf, aku sedang tidak bisa memproses pesanmu. Kamu bisa lanjut lewat Pesan Manual agar pesanan dicek petugas.',
                'transcript' => null,
                'missing_fields' => [],
                'handoff_to_manual' => true,
                'summary' => null,
                'ai_status' => 'error',
            ], 200);
        }

        return response()->json($result);
    }

    public function confirm(
        StoreOrderRequest $request,
        CreateOrder $createOrder,
    ): JsonResponse {
        $data = $request->validated();
        $data['source'] = 'chatbot';

        $order = $createOrder->handle($data, $request->user());

        return response()->json([
            'order_number' => $order->order_number,
            'redirect' => route('pelanggan.pesan.berhasil', $order->order_number),
        ]);
    }
}
