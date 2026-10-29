<?php

namespace App\Http\Requests;

use App\Support\WhatsAppNumber;
use Illuminate\Foundation\Http\FormRequest;

class TrackOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->role === 'pelanggan';
    }

    /**
     * Normalize input before validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'order_number' => is_string($this->order_number)
                ? strtoupper(trim($this->order_number))
                : $this->order_number,
            'whatsapp' => is_string($this->whatsapp)
                ? WhatsAppNumber::normalize($this->whatsapp)
                : $this->whatsapp,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'order_number' => ['required', 'string', 'max:30', 'regex:/^LDR-\d{8}-\d{4}$/'],
            'whatsapp' => ['required', 'string', 'regex:/^628[0-9]{6,12}$/'],
        ];
    }

    /**
     * Indonesian validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'order_number.required' => 'Nomor pesanan wajib diisi.',
            'order_number.regex' => 'Format nomor pesanan tidak valid. Contoh: LDR-20261029-0001.',
            'whatsapp.required' => 'Nomor WhatsApp wajib diisi.',
            'whatsapp.regex' => 'Nomor WhatsApp tidak valid. Gunakan nomor Indonesia, misalnya 081234567890.',
        ];
    }

    /**
     * Friendly attribute names.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'order_number' => 'nomor pesanan',
            'whatsapp' => 'nomor WhatsApp',
        ];
    }
}
