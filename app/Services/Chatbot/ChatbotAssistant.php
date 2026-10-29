<?php

namespace App\Services\Chatbot;

use App\Models\ChatMessage;
use App\Models\ChatSession;
use App\Models\User;
use App\Services\Gemini\GeminiClient;
use App\Services\Gemini\GeminiException;
use App\Support\WhatsAppNumber;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class ChatbotAssistant
{
    private const SCHEDULE_TIMES = [
        '08:00-10:00',
        '10:00-12:00',
        '12:00-14:00',
        '14:00-16:00',
        '16:00-18:00',
    ];

    public function __construct(
        private readonly GeminiClient $gemini,
    ) {}

    /**
     * @param  array<string, mixed>  $settings
     * @param  array<int, array<string, mixed>>  $services
     * @return array<string, mixed>
     */
    public function respond(
        string $token,
        ?string $message,
        ?UploadedFile $audio,
        ?int $audioSeconds,
        ?User $user,
        array $settings,
        array $services,
    ): array {
        $session = ChatSession::query()->firstOrCreate(
            ['token' => $token],
            ['user_id' => $user?->id, 'source' => 'chatbot'],
        );

        if ($user && $session->user_id === null) {
            $session->update(['user_id' => $user->id]);
        }

        $history = $settings['storeTranscripts']
            ? $this->history($session)
            : collect();

        if ($history->count() >= (int) $settings['maxMessages']) {
            return [
                'session_token' => $token,
                'reply' => 'Sesi obrolan ini sudah cukup panjang. Supaya pesananmu tetap akurat, lanjutkan lewat Pesan Manual atau hubungi outlet, ya.',
                'transcript' => null,
                'missing_fields' => [],
                'handoff_to_manual' => true,
                'summary' => null,
            ];
        }

        $contents = $history
            ->map(fn (ChatMessage $chat) => [
                'role' => $chat->role === 'assistant' ? 'model' : 'user',
                'parts' => [['text' => (string) $chat->content]],
            ])
            ->values()
            ->all();

        $parts = [];

        if (is_string($message) && trim($message) !== '') {
            $parts[] = ['text' => trim($message)];
        }

        if ($audio) {
            $parts[] = [
                'inlineData' => [
                    'mimeType' => $audio->getMimeType() ?: 'audio/wav',
                    'data' => base64_encode((string) file_get_contents($audio->getRealPath())),
                ],
            ];
            $parts[] = [
                'text' => 'Pesan suara dari pelanggan. Dengarkan audio ini, transkripsikan isinya, lalu proses sebagai pesan pelanggan.',
            ];
        }

        if ($parts === []) {
            $parts[] = ['text' => 'Halo'];
        }

        $contents[] = ['role' => 'user', 'parts' => $parts];

        try {
            $raw = $this->gemini->generateJson(
                $this->systemPrompt($settings, $services),
                $contents,
            );
        } catch (GeminiException) {
            $fallback = $this->fallbackFromUserMessage(
                trim((string) ($message ?? '')),
                $settings,
                $services,
            );

            if ($fallback !== null) {
                return [
                    'session_token' => $token,
                    ...$fallback,
                ];
            }

            return [
                'session_token' => $token,
                'reply' => $this->fallbackReply($settings),
                'transcript' => null,
                'missing_fields' => [],
                'handoff_to_manual' => true,
                'summary' => null,
            ];
        }

        $result = $this->normalizeResult($raw, $settings, $services);

        if ($settings['storeTranscripts']) {
            $transcript = $result['transcript'];
            $userText = $audio
                ? ($transcript ?: null)
                : trim((string) $message);

            $session->messages()->create([
                'role' => 'user',
                'content' => $userText ?: ($audio ? '[Pesan suara]' : '-'),
                'audio_seconds' => $audio ? $audioSeconds : null,
                'meta' => $audio ? ['has_audio' => true, 'mime' => $audio->getMimeType()] : null,
            ]);

            $session->messages()->create([
                'role' => 'assistant',
                'content' => $result['reply'],
                'meta' => $result['summary'] ? ['summary' => $result['summary']] : null,
            ]);
        }

        return [
            'session_token' => $token,
            ...$result,
        ];
    }

    /**
     * @return Collection<int, ChatMessage>
     */
    private function history(ChatSession $session): Collection
    {
        return $session->messages()
            ->orderByDesc('id')
            ->limit(20)
            ->get()
            ->reverse()
            ->values();
    }

    /**
     * @param  array<string, mixed>  $raw
     * @param  array<string, mixed>  $settings
     * @param  array<int, array<string, mixed>>  $services
     * @return array<string, mixed>
     */
    private function normalizeResult(array $raw, array $settings, array $services): array
    {
        $rawOrder = is_array($raw['order'] ?? null) ? $raw['order'] : [];
        $order = $this->normalizeOrder($rawOrder, $services);
        $hasOrderData = $this->hasAnyOrderValue($order);

        $wantsToOrder = (bool) ($raw['wants_to_order'] ?? false)
            || $hasOrderData
            || $this->looksLikeOrderIntent($raw['reply'] ?? null, $rawOrder);

        $missing = $wantsToOrder
            ? $this->missingFields($order, $services)
            : [];

        $reply = is_string($raw['reply'] ?? null) && trim($raw['reply']) !== ''
            ? trim($raw['reply'])
            : 'Boleh ceritakan lagi kebutuhan laundry-mu?';

        $summary = null;

        if ($wantsToOrder && $missing === []) {
            $summary = $this->summary($order, $services);
        }

        $shouldHandoff = (bool) ($raw['handoff_to_manual'] ?? false)
            || ($settings['guardrails']['offerManual'] && $wantsToOrder && $missing !== [] && strlen($reply) < 3)
            || (! $hasOrderData && ! $wantsToOrder && isset($raw['reply']));

        return [
            'reply' => $reply,
            'transcript' => is_string($raw['transcript'] ?? null)
                ? trim($raw['transcript'])
                : null,
            'missing_fields' => $missing,
            'handoff_to_manual' => $shouldHandoff,
            'summary' => $summary,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  array<int, array<string, mixed>>  $services
     * @return array<string, mixed>
     */
    private function normalizeOrder(array $data, array $services): array
    {
        $service = $this->serviceById($data['service_id'] ?? null, $services);

        $quantity = is_numeric($data['estimated_quantity'] ?? null)
            ? (float) $data['estimated_quantity']
            : null;

        if ($quantity !== null && ($quantity <= 0 || $quantity > 100)) {
            $quantity = null;
        }

        $intake = in_array($data['intake_method'] ?? null, ['jemput', 'antar'], true)
            ? $data['intake_method']
            : null;

        $scheduleDate = $this->validDate($data['schedule_date'] ?? null);
        $scheduleTime = $this->validTime($data['schedule_time'] ?? null);

        $whatsapp = is_string($data['whatsapp'] ?? null)
            ? WhatsAppNumber::normalize($data['whatsapp'])
            : null;

        return [
            'name' => $this->cleanString($data['name'] ?? null, 100),
            'whatsapp' => $whatsapp ?: null,
            'service_id' => $service['id'] ?? null,
            'estimated_quantity' => $quantity,
            'intake_method' => $intake,
            'address' => $intake === 'jemput'
                ? $this->cleanString($data['address'] ?? null, 500)
                : null,
            'schedule_date' => $scheduleDate,
            'schedule_time' => $scheduleTime,
            'notes' => $this->cleanString($data['notes'] ?? null, 500),
        ];
    }

    /**
     * @param  array<string, mixed>  $order
     * @param  array<int, array<string, mixed>>  $services
     * @return array<int, string>
     */
    private function missingFields(array $order, array $services): array
    {
        $missing = [];

        if (! $order['name']) {
            $missing[] = 'name';
        }

        if (! $order['whatsapp'] || ! preg_match('/^628[0-9]{6,12}$/', $order['whatsapp'])) {
            $missing[] = 'whatsapp';
        }

        $service = $this->serviceById($order['service_id'], $services);

        if (! $service) {
            $missing[] = 'service_id';
        }

        if (! $order['estimated_quantity']) {
            $missing[] = 'estimated_quantity';
        } elseif ($service) {
            $minimum = (float) $service['min'];
            $step = (float) ($service['step'] ?? 0);
            $quantity = (float) $order['estimated_quantity'];

            if ($quantity < $minimum) {
                $missing[] = 'estimated_quantity';
            } elseif ($step > 0) {
                $steps = $quantity / $step;

                if (abs($steps - round($steps)) > 0.0001) {
                    $missing[] = 'estimated_quantity';
                }
            }
        }

        if (! $order['intake_method']) {
            $missing[] = 'intake_method';
        }

        if ($order['intake_method'] === 'jemput' && (! $order['address'] || mb_strlen($order['address']) < 8)) {
            $missing[] = 'address';
        }

        if (! $order['schedule_date']) {
            $missing[] = 'schedule_date';
        }

        if (! $order['schedule_time']) {
            $missing[] = 'schedule_time';
        }

        return array_values(array_unique($missing));
    }

    /**
     * @param  array<string, mixed>  $order
     * @param  array<int, array<string, mixed>>  $services
     * @return array<string, mixed>
     */
    private function summary(array $order, array $services): array
    {
        $service = $this->serviceById($order['service_id'], $services);

        abort_if(! $service, 422, 'Layanan tidak ditemukan.');

        $quantity = (float) $order['estimated_quantity'];
        $total = (int) round($service['price'] * $quantity);
        $date = Carbon::parse($order['schedule_date'])->locale('id');

        return [
            'serviceName' => $service['name'],
            'serviceId' => $service['id'],
            'quantity' => $quantity,
            'unit' => $service['unit'],
            'unitPrice' => $service['price'],
            'total' => $total,
            'method' => $order['intake_method'],
            'address' => $order['address'],
            'scheduleDate' => $order['schedule_date'],
            'scheduleLabel' => $date->translatedFormat('l, j F Y'),
            'scheduleTime' => $order['schedule_time'],
            'notes' => $order['notes'],
            'order' => [
                'name' => $order['name'],
                'whatsapp' => $order['whatsapp'],
                'service_id' => $service['id'],
                'estimated_quantity' => $quantity,
                'intake_method' => $order['intake_method'],
                'delivery_method' => $order['intake_method'] === 'jemput' ? 'antar' : 'ambil',
                'address' => $order['address'],
                'schedule_date' => $order['schedule_date'],
                'schedule_time' => $order['schedule_time'],
                'notes' => $order['notes'],
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $settings
     * @param  array<int, array<string, mixed>>  $services
     */
    private function systemPrompt(array $settings, array $services): string
    {
        $tone = match ($settings['tone']) {
            'Ringkas' => 'Jawab singkat, langsung ke langkah berikutnya.',
            'Formal' => 'Gunakan bahasa Indonesia formal dan sopan, tanpa slang.',
            default => 'Gunakan bahasa Indonesia ramah, santai, dan mudah dipahami.',
        };

        $guardrails = $settings['guardrails'];
        $rules = [
            'Kamu hanya menjawab pertanyaan seputar layanan, tarif, dan pemesanan Cleanora.',
            'Jangan pernah mengarang layanan, promo, ketersediaan, alamat, atau tarif.',
            'Harga dan total hanya boleh diambil dari daftar layanan resmi di bawah. Jangan menghitung atau menyebut angka harga lain.',
            'Jangan menampilkan total biaya. Sistem akan menghitung dan menampilkan ringkasan resmi setelah data lengkap.',
            'Isi field order hanya berdasarkan informasi yang benar-benar disebutkan pelanggan. Pertahankan data yang sudah ada di percakapan.',
            'Jika pelanggan menyebut layanan, berat, jumlah, jadwal, metode penjemputan/antar, atau nomor WhatsApp, anggap dia sedang memesan dan set wants_to_order=true.',
            'Jika data belum lengkap, tanyakan hanya data yang kurang dan jangan mengulang pertanyaan yang sudah dijawab.',
            'Gunakan service_id persis dari daftar layanan. Jika layanan tidak ada di daftar, jangan mengarang dan tawarkan layanan yang tersedia.',
            'Tanggal jadwal harus format YYYY-MM-DD dan tidak boleh sebelum hari ini. Jika pelanggan menyebut "besok", konversi dari tanggal hari ini.',
            'schedule_time hanya boleh salah satu nilai: '.implode(', ', self::SCHEDULE_TIMES).'.',
            'intake_method hanya "jemput" atau "antar". Jika "jemput", alamat wajib. Jika "antar", alamat boleh kosong.',
            'Nomor WhatsApp harus nomor Indonesia dan akan dinormalisasi server. Jika pelanggan memberi 08xx, simpan apa adanya.',
            'Jika pelanggan hanya bertanya tanpa bermaksud memesan, isi wants_to_order=false dan jangan memaksa mengumpulkan data.',
            'Jika permintaan di luar topik atau kamu tidak yakin, isi handoff_to_manual=true dan tawarkan Pesan Manual.',
            'Jangan mengembalikan handoff_to_manual=true saat pelanggan sudah menyebutkan layanan dan data pesanan yang cukup untuk dibuat ringkasan.',
        ];

        if ($guardrails['priceFromList']) {
            $rules[] = 'Semua tarif wajib sama persis dengan daftar layanan aktif. Jangan membulatkan atau menaksir tarif.';
        }

        if ($guardrails['noInventedServices']) {
            $rules[] = 'Layanan yang tidak ada di daftar resmi dianggap tidak tersedia.';
        }

        if ($guardrails['offerManual']) {
            $rules[] = 'Saat data gagal diproses atau di luar topik, arahkan pelanggan ke halaman Pesan Manual.';
        }

        $fallback = match ($settings['fallbackAction']) {
            'Minta pelanggan menghubungi outlet' => 'Jika tidak yakin, minta pelanggan menghubungi outlet.',
            'Akhiri percakapan dengan sopan' => 'Jika tidak yakin, akhiri jawaban dengan sopan tanpa mengarang.',
            default => 'Jika tidak yakin, tawarkan Pesan Manual.',
        };

        $date = Carbon::now()->locale('id')->translatedFormat('l, j F Y');

        $lines = [
            $settings['systemPrompt'],
            '',
            '# Gaya bahasa',
            $tone,
            '',
            '# Aturan wajib',
            ...array_map(fn (string $rule) => '- '.$rule, $rules),
            '- '.$fallback,
            '',
            '# Tanggal hari ini',
            $date,
            '',
            '# Daftar layanan resmi',
        ];

        if ($settings['autoServices']) {
            $catalog = array_map(function (array $service) use ($settings) {
                $row = [
                    'service_id' => $service['id'],
                    'nama' => $service['name'],
                    'satuan' => $service['unit'],
                    'tarif_per_satuan' => $service['price'],
                    'minimal' => $service['min'],
                    'kelipatan' => $service['step'],
                ];

                if ($settings['includeDurations']) {
                    $row['estimasi_pengerjaan'] = $service['duration'];
                }

                return $row;
            }, $services);

            $lines[] = json_encode($catalog, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } else {
            $lines[] = 'Daftar tarif sedang tidak disertakan. Jangan menyebut tarif apa pun. Arahkan pelanggan melihat halaman Layanan & Tarif atau menghubungi outlet.';
        }

        if ($settings['includeOutlets']) {
            $lines[] = '';
            $lines[] = '# Informasi outlet';
            $lines[] = 'Outlet Pusat buka setiap hari 08.00-20.00. Informasi area penjemputan dikonfirmasi petugas sebelum penjemputan.';
        }

        $lines[] = '';
        $lines[] = '# Format jawaban';
        $lines[] = 'Balas dalam JSON sesuai schema. Isi reply dengan kalimat yang akan dibaca pelanggan. Jika pesan pelanggan berupa audio, isi transcript dengan hasil transkripsinya.';

        return implode("\n", $lines);
    }

    /**
     * @param  array<string, mixed>  $settings
     */
    private function fallbackReply(array $settings): string
    {
        return match ($settings['fallbackAction']) {
            'Minta pelanggan menghubungi outlet' => 'Maaf, aku sedang tidak bisa memproses pesanmu. Supaya tidak keliru, hubungi petugas Outlet Pusat agar dibantu langsung, ya.',
            'Akhiri percakapan dengan sopan' => 'Maaf, aku belum bisa membantu saat ini. Terima kasih sudah menghubungi Cleanora.',
            default => 'Maaf, aku sedang tidak bisa memproses pesanmu. Kamu bisa lanjut lewat Pesan Manual agar pesanan dicek petugas.',
        };
    }

    /**
     * @param  array<int, array<string, mixed>>  $services
     * @return array<string, mixed>|null
     */
    private function serviceById(mixed $id, array $services): ?array
    {
        if (! is_numeric($id)) {
            return null;
        }

        return collect($services)->firstWhere('id', (int) $id);
    }

    private function cleanString(mixed $value, int $max): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $value = trim(preg_replace('/\s+/', ' ', $value) ?? $value);

        return $value === '' ? null : mb_substr($value, 0, $max);
    }

    private function validDate(mixed $value): ?string
    {
        if (! is_string($value) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            return null;
        }

        try {
            $date = Carbon::createFromFormat('Y-m-d', $value)->startOfDay();
        } catch (\Throwable) {
            return null;
        }

        if ($date->lt(Carbon::today())) {
            return null;
        }

        return $date->toDateString();
    }

    private function validTime(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $value = str_replace([' ', '.'], ['', ':'], trim($value));

        return in_array($value, self::SCHEDULE_TIMES, true) ? $value : null;
    }

    /**
     * @param  array<string, mixed>  $order
     */
    private function hasAnyOrderValue(array $order): bool
    {
        return (bool) ($order['name'] || $order['whatsapp'] || $order['service_id']
            || $order['estimated_quantity'] || $order['intake_method']
            || $order['address'] || $order['schedule_date'] || $order['schedule_time']);
    }

    /**
     * @param  array<string, mixed>  $order
     */
    private function looksLikeOrderIntent(?string $reply, array $order): bool
    {
        if ($this->hasAnyOrderValue($order)) {
            return true;
        }

        $text = strtolower((string) $reply);

        return str_contains($text, 'cuci')
            || str_contains($text, 'pesan')
            || str_contains($text, 'jemput')
            || str_contains($text, 'antar')
            || str_contains($text, 'laundry')
            || str_contains($text, 'berat')
            || str_contains($text, 'kg');
    }

    /**
     * Fallback when Gemini fails to return valid JSON: parse the customer message directly.
     *
     * @param  array<int, array<string, mixed>>  $services
     * @return array<string, mixed>|null
     */
    private function fallbackFromUserMessage(string $message, array $settings, array $services): ?array
    {
        $normalized = trim($message);

        if ($normalized === '') {
            return null;
        }

        $text = strtolower($normalized);
        $isOrderLike = str_contains($text, 'cuci')
            || str_contains($text, 'laundry')
            || str_contains($text, 'setrika')
            || str_contains($text, 'jemput')
            || str_contains($text, 'antar')
            || str_contains($text, 'pesan')
            || preg_match('/\d+(?:[.,]\d+)?\s*(kg|kilo|kilogram)/i', $normalized);

        if (! $isOrderLike) {
            return null;
        }

        $order = $this->parseOrderFromText($normalized, $services);

        if (! $this->hasAnyOrderValue($order)) {
            return null;
        }

        $missing = $this->missingFields($order, $services);
        $reply = $missing === []
            ? 'Baik, aku sudah menyusun ringkasan pesananmu. Cek detailnya lalu konfirmasi, ya.'
            : 'Aku masih butuh beberapa data agar pesananmu lengkap. '.implode(', ', $this->askableFields($missing));

        $summary = $missing === [] ? $this->summary($order, $services) : null;

        return [
            'reply' => $reply,
            'transcript' => $normalized,
            'missing_fields' => $missing,
            'handoff_to_manual' => false,
            'summary' => $summary,
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $services
     * @return array<string, mixed>
     */
    private function parseOrderFromText(string $message, array $services): array
    {
        $service = $this->detectServiceFromText($message, $services);
        $quantity = $this->detectQuantityFromText($message);
        $intakeMethod = $this->detectIntakeMethodFromText($message);
        $scheduleDate = $this->detectScheduleDateFromText($message);
        $scheduleTime = $this->detectScheduleTimeFromText($message);
        $whatsapp = $this->detectWhatsappFromText($message);
        $address = $intakeMethod === 'jemput' ? $this->detectAddressFromText($message) : null;

        return [
            'name' => null,
            'whatsapp' => $whatsapp,
            'service_id' => $service['id'] ?? null,
            'estimated_quantity' => $quantity,
            'intake_method' => $intakeMethod,
            'address' => $address,
            'schedule_date' => $scheduleDate,
            'schedule_time' => $scheduleTime,
            'notes' => null,
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $services
     * @return array<string, mixed>|null
     */
    private function detectServiceFromText(string $message, array $services): ?array
    {
        $normalized = strtolower($message);

        foreach ($services as $service) {
            $name = strtolower((string) ($service['name'] ?? ''));

            if (str_contains($normalized, $name)) {
                return $service;
            }
        }

        return collect($services)->first();
    }

    private function detectQuantityFromText(string $message): ?float
    {
        if (preg_match('/(\d+(?:[.,]\d+)?)\s*(kg|kilo|kilogram)/i', $message, $matches)) {
            return (float) str_replace(',', '.', $matches[1]);
        }

        if (preg_match('/(\d+(?:[.,]\d+)?)\s*(pcs|biji|lembar)/i', $message, $matches)) {
            return (float) str_replace(',', '.', $matches[1]);
        }

        return null;
    }

    private function detectIntakeMethodFromText(string $message): ?string
    {
        $text = strtolower($message);

        if (str_contains($text, 'jemput')) {
            return 'jemput';
        }

        if (str_contains($text, 'antar sendiri') || str_contains($text, 'antar')) {
            return 'antar';
        }

        return null;
    }

    private function detectScheduleDateFromText(string $message): ?string
    {
        $text = strtolower($message);

        if (str_contains($text, 'hari ini')) {
            return Carbon::today()->toDateString();
        }

        if (str_contains($text, 'besok')) {
            return Carbon::tomorrow()->toDateString();
        }

        if (preg_match('/\b\d{4}-\d{2}-\d{2}\b/', $message, $matches)) {
            return $matches[0];
        }

        if (preg_match('/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/', $message, $matches)) {
            $date = Carbon::createFromFormat('d/m/Y', $matches[0]);

            return $date->format('Y-m-d');
        }

        return null;
    }

    private function detectScheduleTimeFromText(string $message): ?string
    {
        $text = strtolower($message);

        if (preg_match('/\b(08|8)\s*(?:\.|:)?\s*(00|30)?\b/', $text)) {
            return '08:00-10:00';
        }

        if (str_contains($text, 'pagi')) {
            return '08:00-10:00';
        }

        if (str_contains($text, 'siang')) {
            return '12:00-14:00';
        }

        if (str_contains($text, 'sore')) {
            return '16:00-18:00';
        }

        if (preg_match('/\b(10|12|14|16|18)\s*(?:\.|:)?\s*(00|30)?\b/', $text)) {
            return match ((int) preg_replace('/\D+/', '', $text) ?: 10) {
                10 => '10:00-12:00',
                12 => '12:00-14:00',
                14 => '14:00-16:00',
                16 => '16:00-18:00',
                default => '08:00-10:00',
            };
        }

        return null;
    }

    private function detectWhatsappFromText(string $message): ?string
    {
        if (preg_match('/(?:\+62|62|0)8\d{8,11}/', $message, $matches)) {
            return WhatsAppNumber::normalize($matches[0]);
        }

        return null;
    }

    private function detectAddressFromText(string $message): ?string
    {
        if (preg_match('/(?:di|alamat)\s+(.+?)(?:,\s*(?:besok|hari ini|pagi|siang|sore)|$)/i', $message, $matches)) {
            return trim($matches[1]);
        }

        return null;
    }

    /**
     * @param  array<int, string>  $missing
     * @return array<int, string>
     */
    private function askableFields(array $missing): array
    {
        $labels = [
            'name' => 'nama lengkap',
            'whatsapp' => 'nomor WhatsApp',
            'service_id' => 'layanan yang mau dipilih',
            'estimated_quantity' => 'jumlah atau berat cucian',
            'intake_method' => 'metode penjemputan atau antar sendiri',
            'address' => 'alamat penjemputan',
            'schedule_date' => 'tanggal jadwal',
            'schedule_time' => 'jam jadwal',
        ];

        return array_map(fn (string $field) => $labels[$field] ?? $field, $missing);
    }
}
