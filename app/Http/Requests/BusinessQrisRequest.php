<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BusinessQrisRequest extends FormRequest
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
            'qris' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'qris.required' => 'Pilih foto QRIS terlebih dahulu.',
            'qris.image' => 'Berkas QRIS harus berupa gambar.',
            'qris.mimes' => 'Foto QRIS harus berformat JPG atau PNG.',
            'qris.max' => 'Ukuran foto QRIS maksimal 2 MB.',
        ];
    }
}
