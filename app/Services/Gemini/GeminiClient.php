<?php

namespace App\Services\Gemini;

use Illuminate\Http\Client\Response;
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

        $lastDecodeError = null;

        for ($attempt = 1; $attempt <= 2; $attempt++) {
            $response = $this->request($apiKey, $systemInstruction, $contents);
            $text = $this->extractText($response);

            try {
                $decoded = json_decode($text, true, 512, JSON_THROW_ON_ERROR);

                if (is_array($decoded)) {
                    return $decoded;
                }

                $lastDecodeError = new GeminiException('Jawaban AI tidak dapat dibaca.');
            } catch (Throwable $exception) {
                $lastDecodeError = $exception;
            }
        }

        throw new GeminiException(
            'Jawaban AI tidak berformat JSON setelah dicoba ulang.',
            previous: $lastDecodeError,
        );
    }

    /**
     * @param  array<int, array<string, mixed>>  $contents
     */
    private function request(
        string $apiKey,
        string $systemInstruction,
        array $contents,
    ): Response {
        $url = rtrim((string) config('gemini.endpoint'), '/')
            .'/models/'.config('gemini.model').':generateContent';

        try {
            $response = Http::connectTimeout(10)
                ->timeout((int) config('gemini.timeout', 60))
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
                        'maxOutputTokens' => (int) config('gemini.max_output_tokens', 1024),
                        'responseMimeType' => 'application/json',
                        'responseSchema' => $this->schema(),
                    ],
                ]);
        } catch (Throwable $exception) {
            report($exception);

            throw new GeminiException(
                'Layanan AI sedang tidak dapat dihubungi.',
                previous: $exception,
            );
        }

        if ($response->failed()) {
            $reason = data_get($response->json(), 'error.message');
            $reason = is_string($reason) && trim($reason) !== ''
                ? ' '.mb_substr(trim($reason), 0, 240)
                : '';

            throw new GeminiException(
                'Layanan AI menolak permintaan (HTTP '.$response->status().').'.$reason,
            );
        }

        return $response;
    }

    private function extractText(Response $response): string
    {
        $parts = data_get(
            $response->json(),
            'candidates.0.content.parts',
            [],
        );

        $text = collect(is_array($parts) ? $parts : [])
            ->pluck('text')
            ->filter(fn (mixed $part) => is_string($part) && trim($part) !== '')
            ->implode('');

        if (trim($text) === '') {
            throw new GeminiException('Layanan AI tidak memberikan jawaban.');
        }

        $text = trim($text);

        return preg_replace('/^```(?:json)?\s*|\s*```$/', '', $text) ?? $text;
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
