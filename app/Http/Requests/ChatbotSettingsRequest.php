<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ChatbotSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'pengusaha';
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'enabled' => ['sometimes', 'boolean'],
            'botName' => ['required', 'string', 'max:32'],
            'tone' => ['required', Rule::in(['Ramah', 'Ringkas', 'Formal'])],
            'greeting' => ['required', 'string', 'max:240'],
            'systemPrompt' => ['required', 'string', 'max:1600'],
            'autoServices' => ['sometimes', 'boolean'],
            'includeOutlets' => ['sometimes', 'boolean'],
            'includeDurations' => ['sometimes', 'boolean'],
            'guardrails' => ['sometimes', 'array'],
            'guardrails.*' => ['boolean'],
            'fallbackAction' => [
                'required',
                Rule::in([
                    'Tawarkan Pesan Manual',
                    'Minta pelanggan menghubungi outlet',
                    'Akhiri percakapan dengan sopan',
                ]),
            ],
            'maxMessages' => ['required', 'integer', 'min:5', 'max:60'],
            'rateLimitPerHour' => ['required', 'integer', 'min:1', 'max:60'],
            'maxAudioSeconds' => ['required', 'integer', Rule::in([30, 60, 90, 120])],
            'storeTranscripts' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'botName.required' => 'Nama chatbot wajib diisi.',
            'greeting.required' => 'Sapaan awal wajib diisi.',
            'systemPrompt.required' => 'Prompt sistem wajib diisi.',
            'maxMessages.min' => 'Maksimal pesan per sesi minimal 5.',
            'rateLimitPerHour.min' => 'Batas sesi per jam minimal 1.',
            'maxAudioSeconds.in' => 'Durasi voice note tidak valid.',
        ];
    }
}
