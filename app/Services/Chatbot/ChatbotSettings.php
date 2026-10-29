<?php

namespace App\Services\Chatbot;

use App\Models\Setting;

class ChatbotSettings
{
    public const SETTING_KEY = 'chatbot';

    /**
     * @return array<string, mixed>
     */
    public function defaults(): array
    {
        return [
            'enabled' => true,
            'botName' => 'Nova',
            'tone' => 'Ramah',
            'greeting' => 'Halo! Aku Nova, asisten Cleanora. Mau pesan laundry, cek tarif, atau tanya jadwal penjemputan?',
            'systemPrompt' => "Kamu adalah Nova, asisten Cleanora Laundry & Care.\n\n"
                ."Tugasmu:\n"
                ."1. Bantu pelanggan memahami layanan, tarif, dan alur pemesanan.\n"
                ."2. Kumpulkan nama, nomor WhatsApp, layanan, perkiraan berat, metode penyerahan, jadwal, dan alamat jika diperlukan.\n"
                ."3. Jangan mengarang layanan, tarif, promo, atau ketersediaan outlet.\n"
                ."4. Jika data pesanan belum lengkap, tanyakan hanya data yang kurang.\n"
                .'5. Jika permintaan di luar topik laundry atau kamu tidak yakin, tawarkan Pesan Manual.',
            'autoServices' => true,
            'includeOutlets' => true,
            'includeDurations' => true,
            'guardrails' => [
                'priceFromList' => true,
                'noInventedServices' => true,
                'askMissingOnly' => true,
                'offerManual' => true,
            ],
            'fallbackAction' => 'Tawarkan Pesan Manual',
            'maxMessages' => 24,
            'rateLimitPerHour' => 10,
            'maxAudioSeconds' => 60,
            'storeTranscripts' => true,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function all(): array
    {
        $stored = Setting::query()->find(self::SETTING_KEY)?->value;

        return $this->normalize(is_array($stored) ? $stored : []);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function update(array $data): array
    {
        $settings = $this->normalize($data);

        Setting::query()->updateOrCreate(
            ['key' => self::SETTING_KEY],
            ['value' => $settings],
        );

        return $settings;
    }

    /**
     * Settings that are safe to send to the customer chatbot page.
     *
     * @return array<string, mixed>
     */
    public function publicSettings(): array
    {
        $settings = $this->all();

        return [
            'enabled' => $settings['enabled'],
            'botName' => $settings['botName'],
            'greeting' => $settings['greeting'],
            'tone' => $settings['tone'],
            'maxAudioSeconds' => $settings['maxAudioSeconds'],
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function normalize(array $data): array
    {
        $defaults = $this->defaults();

        $guardrails = is_array($data['guardrails'] ?? null)
            ? $data['guardrails']
            : [];

        return [
            'enabled' => (bool) ($data['enabled'] ?? $defaults['enabled']),
            'botName' => $this->string($data['botName'] ?? null, $defaults['botName'], 32),
            'tone' => in_array($data['tone'] ?? null, ['Ramah', 'Ringkas', 'Formal'], true)
                ? $data['tone']
                : $defaults['tone'],
            'greeting' => $this->string($data['greeting'] ?? null, $defaults['greeting'], 240),
            'systemPrompt' => $this->string($data['systemPrompt'] ?? null, $defaults['systemPrompt'], 1600),
            'autoServices' => (bool) ($data['autoServices'] ?? $defaults['autoServices']),
            'includeOutlets' => (bool) ($data['includeOutlets'] ?? $defaults['includeOutlets']),
            'includeDurations' => (bool) ($data['includeDurations'] ?? $defaults['includeDurations']),
            'guardrails' => [
                'priceFromList' => (bool) ($guardrails['priceFromList'] ?? $defaults['guardrails']['priceFromList']),
                'noInventedServices' => (bool) ($guardrails['noInventedServices'] ?? $defaults['guardrails']['noInventedServices']),
                'askMissingOnly' => (bool) ($guardrails['askMissingOnly'] ?? $defaults['guardrails']['askMissingOnly']),
                'offerManual' => (bool) ($guardrails['offerManual'] ?? $defaults['guardrails']['offerManual']),
            ],
            'fallbackAction' => in_array($data['fallbackAction'] ?? null, [
                'Tawarkan Pesan Manual',
                'Minta pelanggan menghubungi outlet',
                'Akhiri percakapan dengan sopan',
            ], true)
                ? $data['fallbackAction']
                : $defaults['fallbackAction'],
            'maxMessages' => $this->boundedInt($data['maxMessages'] ?? null, 5, 60, $defaults['maxMessages']),
            'rateLimitPerHour' => $this->boundedInt($data['rateLimitPerHour'] ?? null, 1, 60, $defaults['rateLimitPerHour']),
            'maxAudioSeconds' => $this->boundedInt($data['maxAudioSeconds'] ?? null, 30, 120, $defaults['maxAudioSeconds']),
            'storeTranscripts' => (bool) ($data['storeTranscripts'] ?? $defaults['storeTranscripts']),
        ];
    }

    private function string(mixed $value, string $default, int $max): string
    {
        if (! is_string($value) || trim($value) === '') {
            return $default;
        }

        return mb_substr(trim($value), 0, $max);
    }

    private function boundedInt(mixed $value, int $min, int $max, int $default): int
    {
        if (! is_numeric($value)) {
            return $default;
        }

        return max($min, min($max, (int) $value));
    }
}
