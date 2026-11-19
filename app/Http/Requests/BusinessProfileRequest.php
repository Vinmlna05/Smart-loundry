<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BusinessProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'pengusaha';
    }

    protected function prepareForValidation(): void
    {
        $accounts = $this->input('bankAccounts');

        if (! is_array($accounts)) {
            return;
        }

        $accounts = array_values(array_filter($accounts, function ($account) {
            if (! is_array($account)) {
                return false;
            }

            return collect(['bankName', 'accountNumber', 'accountHolder'])
                ->contains(fn (string $key) => is_string($account[$key] ?? null)
                    && trim($account[$key]) !== '');
        }));

        $this->merge([
            'bankAccounts' => $accounts,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'businessName' => ['required', 'string', 'max:100'],
            'whatsapp' => ['required', 'string', 'max:30'],
            'outletAddress' => ['nullable', 'string', 'max:240'],
            'operatingHours' => ['nullable', 'string', 'max:120'],
            'bankAccounts' => ['nullable', 'array', 'max:3'],
            'bankAccounts.*.bankName' => ['required', 'string', 'max:60'],
            'bankAccounts.*.accountNumber' => [
                'required',
                'string',
                'max:40',
                'regex:/^[0-9\s-]+$/',
            ],
            'bankAccounts.*.accountHolder' => ['required', 'string', 'max:100'],
            'bankAccounts.*.isPrimary' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'businessName.required' => 'Nama usaha wajib diisi.',
            'whatsapp.required' => 'Nomor WhatsApp usaha wajib diisi.',
            'bankAccounts.max' => 'Rekening pembayaran maksimal 3.',
            'bankAccounts.*.bankName.required' => 'Nama bank wajib diisi.',
            'bankAccounts.*.accountNumber.required' => 'Nomor rekening wajib diisi.',
            'bankAccounts.*.accountNumber.regex' => 'Nomor rekening hanya boleh berisi angka, spasi, atau tanda hubung.',
            'bankAccounts.*.accountHolder.required' => 'Nama pemilik rekening wajib diisi.',
        ];
    }
}
