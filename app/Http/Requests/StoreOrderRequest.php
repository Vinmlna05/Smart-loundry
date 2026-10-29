<?php

namespace App\Http\Requests;

use App\Models\Service;
use App\Support\WhatsAppNumber;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
{
    public const SCHEDULE_TIMES = [
        '08:00-10:00',
        '10:00-12:00',
        '12:00-14:00',
        '14:00-16:00',
        '16:00-18:00',
    ];

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
            'name' => is_string($this->name) ? trim($this->name) : $this->name,
            'whatsapp' => is_string($this->whatsapp)
                ? WhatsAppNumber::normalize($this->whatsapp)
                : $this->whatsapp,
            'notes' => is_string($this->notes) && trim($this->notes) !== ''
                ? trim($this->notes)
                : null,
            'address' => is_string($this->address) && trim($this->address) !== ''
                ? trim($this->address)
                : null,
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
            'name' => ['required', 'string', 'max:100'],
            'whatsapp' => ['required', 'string', 'regex:/^628[0-9]{6,12}$/'],
            'service_id' => [
                'required',
                'integer',
                Rule::exists('services', 'id')->where('is_active', true),
            ],
            'estimated_quantity' => ['required', 'numeric', 'min:0.1', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
            'intake_method' => ['required', Rule::in(['jemput', 'antar'])],
            'delivery_method' => ['nullable', Rule::in(['ambil', 'antar'])],
            'address' => ['nullable', 'string', 'max:500', 'required_if:intake_method,jemput'],
            'schedule_date' => ['required', 'date', 'after_or_equal:today'],
            'schedule_time' => ['required', Rule::in(self::SCHEDULE_TIMES)],
            'source' => ['nullable', Rule::in(['manual', 'chatbot'])],
        ];
    }

    /**
     * Additional checks that need the selected service.
     */
    public function after(): array
    {
        return [
            function ($validator) {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $service = Service::find($this->integer('service_id'));

                if (! $service) {
                    return;
                }

                $quantity = (float) $this->input('estimated_quantity');
                $minimum = (float) $service->min_quantity;
                $step = (float) $service->step_quantity;

                if ($quantity < $minimum) {
                    $validator->errors()->add(
                        'estimated_quantity',
                        "Minimal {$minimum} {$service->unit} untuk layanan {$service->name}.",
                    );

                    return;
                }

                if ($step > 0) {
                    $steps = $quantity / $step;

                    if (abs($steps - round($steps)) > 0.0001) {
                        $validator->errors()->add(
                            'estimated_quantity',
                            "Jumlah harus kelipatan {$step} {$service->unit}.",
                        );
                    }
                }
            },
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
            'name.required' => 'Nama lengkap wajib diisi.',
            'name.max' => 'Nama lengkap maksimal 100 karakter.',
            'whatsapp.required' => 'Nomor WhatsApp wajib diisi.',
            'whatsapp.regex' => 'Nomor WhatsApp tidak valid. Gunakan nomor Indonesia, misalnya 081234567890.',
            'service_id.required' => 'Pilih layanan laundry terlebih dahulu.',
            'service_id.exists' => 'Layanan yang dipilih tidak tersedia.',
            'estimated_quantity.required' => 'Isi jumlah atau berat cucian.',
            'estimated_quantity.numeric' => 'Jumlah atau berat cucian harus berupa angka.',
            'estimated_quantity.min' => 'Jumlah atau berat cucian terlalu kecil.',
            'estimated_quantity.max' => 'Jumlah atau berat cucian maksimal 100.',
            'notes.max' => 'Catatan khusus maksimal 500 karakter.',
            'intake_method.required' => 'Pilih metode penyerahan cucian.',
            'intake_method.in' => 'Metode penyerahan cucian tidak valid.',
            'address.required_if' => 'Alamat penjemputan wajib diisi jika memilih jemput cucian.',
            'address.max' => 'Alamat maksimal 500 karakter.',
            'schedule_date.required' => 'Pilih tanggal penyerahan.',
            'schedule_date.date' => 'Tanggal penyerahan tidak valid.',
            'schedule_date.after_or_equal' => 'Tanggal penyerahan tidak boleh sebelum hari ini.',
            'schedule_time.required' => 'Pilih perkiraan waktu penyerahan.',
            'schedule_time.in' => 'Waktu penyerahan tidak valid.',
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
            'name' => 'nama lengkap',
            'whatsapp' => 'nomor WhatsApp',
            'service_id' => 'layanan',
            'estimated_quantity' => 'jumlah atau berat',
            'notes' => 'catatan khusus',
            'intake_method' => 'metode penyerahan',
            'address' => 'alamat penjemputan',
            'schedule_date' => 'tanggal penyerahan',
            'schedule_time' => 'waktu penyerahan',
        ];
    }
}
