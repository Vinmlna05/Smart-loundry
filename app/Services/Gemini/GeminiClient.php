<?php

namespace App\Services\Gemini;

use Illuminate\Support\Facades\Http;
use Throwable;

class GeminiClient
{
    /**
     * Send a conversation to Gemini and require a JSON response.
     *
     * @param  array<int, array<string, mixed>>  $contents
     * @return array<string, mixed>
     */
    public function generateJson(string $systemInstruction, array $contents): array
    {
        $apiKey = (string) config('gemini.api_key');

        if ($apiKey === '') {
            throw new GeminiException('Kunci API Gemini belum dikonfigurasi.');
        }

        $url = rtrim((string) config('gemini.endpoint'), '/')
            .'/models/'.config('gemini.model').':generateContent';

        try {
            $response = Http::timeout((int) config('gemini.timeout', 60))
                ->withHeaders([
                    'x-goog-api-key' => $apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post($url, [
                    'systemInstruction' => [
                        'parts' => [['text' => $systemInstruction]],
                    ],
                    'contents' => $contents,
                    'generationConfig' => [
                        'temperature' => 0.2,
                        'responseMimeType' => 'application/json',
                        'responseSchema' => $this->schema(),
                    ],
                ]);
        } catch (Throwable $exception) {
            report($exception);

            throw new GeminiException('Layanan AI sedang tidak dapat dihubungi.', previous: $exception);
        }

        if ($response->failed()) {
            throw new GeminiException('Layanan AI menolak permintaan.');
        }

        $text = data_get($response->json(), 'candidates.0.content.parts.0.text');

        if (! is_string($text) || trim($text) === '') {
            throw new GeminiException('Layanan AI tidak memberikan jawaban.');
        }

        $text = trim($text);
        $text = preg_replace('/^```(?:json)?\s*|\s*```$/', '', $text) ?? $text;

        try {
            $decoded = json_decode($text, true, 512, JSON_THROW_ON_ERROR);
        } catch (Throwable $exception) {
            throw new GeminiException('Jawaban AI tidak berformat JSON.', previous: $exception);
        }

        if (! is_array($decoded)) {
            throw new GeminiException('Jawaban AI tidak dapat dibaca.');
        }

        return $decoded;
    }

    /**
     * @return array<string, mixed>
     */
    private function schema(): array
    {
        $nullableString = ['type' => 'STRING', 'nullable' => true];

        return [
            'type' => 'OBJECT',
            'properties' => [
                'reply' => ['type' => 'STRING'],
                'transcript' => $nullableString,
                'wants_to_order' => ['type' => 'BOOLEAN'],
                'handoff_to_manual' => ['type' => 'BOOLEAN'],
                'order' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'name' => $nullableString,
                        'whatsapp' => $nullableString,
                        'service_id' => ['type' => 'INTEGER', 'nullable' => true],
                        'estimated_quantity' => ['type' => 'NUMBER', 'nullable' => true],
                        'intake_method' => [
                            'type' => 'STRING',
                            'nullable' => true,
                            'enum' => ['jemput', 'antar'],
                        ],
                        'address' => $nullableString,
                        'schedule_date' => $nullableString,
                        'schedule_time' => $nullableString,
                        'notes' => $nullableString,
                    ],
                ],
            ],
            'required' => ['reply', 'wants_to_order', 'handoff_to_manual', 'order'],
        ];
    }
}
