<?php

namespace App\Services\Business;

use App\Models\Setting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class BusinessProfile
{
    public const SETTING_KEY = 'business_profile';

    public const MAX_BANK_ACCOUNTS = 3;

    /**
     * @return array<string, mixed>
     */
    public function defaults(): array
    {
        return [
            'businessName' => 'Cleanora Laundry',
            'whatsapp' => '0812-3456-7890',
            'outletAddress' => 'Jl. Merdeka No. 18, Bandung',
            'operatingHours' => 'Setiap hari, 07.00–21.00',
            'bankAccounts' => [],
            'qrisPath' => null,
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
        $current = $this->all();
        $settings = $this->normalize([
            ...$current,
            ...$data,
            'qrisPath' => $current['qrisPath'],
        ]);

        Setting::query()->updateOrCreate(
            ['key' => self::SETTING_KEY],
            ['value' => $settings],
        );

        return $settings;
    }

    /**
     * @return array<string, mixed>
     */
    public function updateQris(UploadedFile $file): array
    {
        $current = $this->all();
        $path = $file->store('payment-qris', 'public');

        $settings = [
            ...$current,
            'qrisPath' => $path,
        ];

        Setting::query()->updateOrCreate(
            ['key' => self::SETTING_KEY],
            ['value' => $settings],
        );

        return $settings;
    }

    public function qrisUrl(?string $path = null): ?string
    {
        $path ??= $this->all()['qrisPath'];

        if (! is_string($path) || $path === '') {
            return null;
        }

        return '/storage/'.ltrim(str_replace('\\', '/', $path), '/');
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function normalize(array $data): array
    {
        $defaults = $this->defaults();
        $accounts = is_array($data['bankAccounts'] ?? null)
            ? $this->normalizeAccounts($data['bankAccounts'])
            : [];

        return [
            'businessName' => $this->text($data['businessName'] ?? null, $defaults['businessName'], 100),
            'whatsapp' => $this->text($data['whatsapp'] ?? null, $defaults['whatsapp'], 30),
            'outletAddress' => $this->text($data['outletAddress'] ?? null, $defaults['outletAddress'], 240),
            'operatingHours' => $this->text($data['operatingHours'] ?? null, $defaults['operatingHours'], 120),
            'bankAccounts' => $accounts,
            'qrisPath' => $this->nullableText($data['qrisPath'] ?? null, 240),
        ];
    }

    /**
     * @param  array<int, mixed>  $accounts
     * @return array<int, array{bankName: string, accountNumber: string, accountHolder: string, isPrimary: bool}>
     */
    private function normalizeAccounts(array $accounts): array
    {
        $normalized = [];

        foreach ($accounts as $index => $account) {
            if (! is_array($account)) {
                continue;
            }

            $bankName = $this->nullableText($account['bankName'] ?? null, 60);
            $accountNumber = $this->nullableText($account['accountNumber'] ?? null, 40);
            $accountHolder = $this->nullableText($account['accountHolder'] ?? null, 100);

            if ($bankName === null || $accountNumber === null || $accountHolder === null) {
                continue;
            }

            $normalized[] = [
                'bankName' => $bankName,
                'accountNumber' => $accountNumber,
                'accountHolder' => $accountHolder,
                'isPrimary' => (bool) ($account['isPrimary'] ?? false),
            ];
        }

        $normalized = array_slice($normalized, 0, self::MAX_BANK_ACCOUNTS);

        if ($normalized === []) {
            return [];
        }

        $primaryIndex = null;

        foreach ($normalized as $index => $account) {
            if (! $account['isPrimary']) {
                continue;
            }

            if ($primaryIndex === null) {
                $primaryIndex = $index;
            } else {
                $normalized[$index]['isPrimary'] = false;
            }
        }

        if ($primaryIndex === null) {
            $normalized[0]['isPrimary'] = true;
        }

        return $normalized;
    }

    private function text(mixed $value, string $default, int $max): string
    {
        if (! is_string($value) || trim($value) === '') {
            return $default;
        }

        return mb_substr(trim($value), 0, $max);
    }

    private function nullableText(mixed $value, int $max): ?string
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        return mb_substr(trim($value), 0, $max);
    }
}
