<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use App\Services\Business\BusinessProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PengusahaProfilUsahaTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login(): void
    {
        $this->patch('/pengusaha/profil', [])->assertRedirect('/login');
    }

    public function test_pelanggan_cannot_update_business_profile(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->patch('/pengusaha/profil', [])
            ->assertRedirect(route('pelanggan.dashboard'));
    }

    public function test_pengusaha_can_save_business_profile_and_bank_accounts(): void
    {
        $user = User::factory()->pengusaha()->create();

        $this->actingAs($user)
            ->patch('/pengusaha/profil', [
                'businessName' => 'Cleanora Laundry',
                'whatsapp' => '0812-3456-7890',
                'outletAddress' => 'Jl. Merdeka No. 18, Bandung',
                'operatingHours' => 'Setiap hari, 07.00–21.00',
                'bankAccounts' => [
                    [
                        'bankName' => 'BCA',
                        'accountNumber' => '1234567890',
                        'accountHolder' => 'Cleanora Laundry',
                        'isPrimary' => false,
                    ],
                    [
                        'bankName' => 'Mandiri',
                        'accountNumber' => '9876543210',
                        'accountHolder' => 'Cleanora Laundry',
                        'isPrimary' => true,
                    ],
                ],
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $stored = Setting::query()->find(BusinessProfile::SETTING_KEY)?->value;

        $this->assertSame('Cleanora Laundry', $stored['businessName']);
        $this->assertCount(2, $stored['bankAccounts']);
        $this->assertFalse($stored['bankAccounts'][0]['isPrimary']);
        $this->assertTrue($stored['bankAccounts'][1]['isPrimary']);
    }

    public function test_only_three_bank_accounts_are_kept(): void
    {
        $user = User::factory()->pengusaha()->create();

        $this->actingAs($user)
            ->patch('/pengusaha/profil', [
                'businessName' => 'Cleanora Laundry',
                'whatsapp' => '0812-3456-7890',
                'bankAccounts' => collect(range(1, 4))
                    ->map(fn (int $index) => [
                        'bankName' => "Bank {$index}",
                        'accountNumber' => '123456789'.$index,
                        'accountHolder' => 'Cleanora Laundry',
                        'isPrimary' => $index === 1,
                    ])
                    ->all(),
            ])
            ->assertSessionHasErrors('bankAccounts');

        $this->assertDatabaseMissing('settings', [
            'key' => BusinessProfile::SETTING_KEY,
        ]);
    }

    public function test_pengusaha_can_upload_qris_image(): void
    {
        Storage::fake('public');

        $user = User::factory()->pengusaha()->create();

        $this->actingAs($user)
            ->post('/pengusaha/profil/qris', [
                'qris' => UploadedFile::fake()->image('qris.png', 600, 600),
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $stored = Setting::query()->find(BusinessProfile::SETTING_KEY)?->value;

        $this->assertNotNull($stored['qrisPath']);
        Storage::disk('public')->assertExists($stored['qrisPath']);
    }

    public function test_qris_must_be_an_image(): void
    {
        Storage::fake('public');

        $user = User::factory()->pengusaha()->create();

        $this->actingAs($user)
            ->post('/pengusaha/profil/qris', [
                'qris' => UploadedFile::fake()->create('qris.pdf', 100, 'application/pdf'),
            ])
            ->assertSessionHasErrors('qris');
    }
}
