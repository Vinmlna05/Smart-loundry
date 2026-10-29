<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'pengusaha';
    }

    protected function prepareForValidation(): void
    {
        if (! $this->has('description')) {
            return;
        }

        $this->merge([
            'description' => is_string($this->description) && trim($this->description) !== ''
                ? trim($this->description)
                : null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $presence = $this->isMethod('post') ? ['required'] : ['sometimes'];

        return [
            'name' => [...$presence, 'string', 'max:100'],
            'category' => [...$presence, Rule::in(['kiloan', 'satuan', 'tambahan'])],
            'description' => ['nullable', 'string', 'max:500'],
            'unit' => [...$presence, 'string', 'max:20'],
            'price' => [...$presence, 'integer', 'min:0', 'max:10000000'],
            'min_quantity' => [...$presence, 'numeric', 'min:0.1', 'max:100'],
            'step_quantity' => [...$presence, 'numeric', 'min:0.1', 'max:100'],
            'estimated_hours' => ['nullable', 'integer', 'min:1', 'max:720'],
            'is_starting_at' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama layanan wajib diisi.',
            'name.max' => 'Nama layanan maksimal 100 karakter.',
            'category.required' => 'Pilih kategori layanan.',
            'category.in' => 'Kategori layanan tidak valid.',
            'unit.required' => 'Satuan layanan wajib diisi.',
            'price.required' => 'Tarif layanan wajib diisi.',
            'price.integer' => 'Tarif layanan harus berupa angka bulat rupiah.',
            'price.min' => 'Tarif layanan tidak boleh negatif.',
            'min_quantity.required' => 'Jumlah minimal wajib diisi.',
            'min_quantity.min' => 'Jumlah minimal minimal 0,1.',
            'step_quantity.required' => 'Kelipatan jumlah wajib diisi.',
            'step_quantity.min' => 'Kelipatan jumlah minimal 0,1.',
            'estimated_hours.integer' => 'Estimasi pengerjaan harus berupa angka jam.',
            'description.max' => 'Deskripsi maksimal 500 karakter.',
        ];
    }
}
