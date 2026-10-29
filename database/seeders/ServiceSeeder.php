<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    /**
     * Seed the laundry services that can be ordered.
     */
    public function run(): void
    {
        $services = [
            ['cuci-kering', 'Cuci Kering', 'kiloan', 'Pakaian dicuci dan dikeringkan, cocok untuk kebutuhan harian.', 'kg', 6000, 3, 0.5, 52, false],
            ['cuci-setrika', 'Cuci dan Setrika', 'kiloan', 'Pakaian dicuci, dikeringkan, disetrika, dan dilipat rapi.', 'kg', 8000, 3, 0.5, 52, false],
            ['setrika', 'Setrika Saja', 'kiloan', 'Solusi untuk pakaian bersih yang hanya membutuhkan penyetrikaan.', 'kg', 5000, 3, 0.5, 34, false],
            ['express', 'Cuci Express', 'kiloan', 'Pilihan untuk kebutuhan mendesak dengan pengerjaan lebih cepat.', 'kg', 12000, 1, 0.5, 10, false],
            ['bed-cover', 'Bed Cover', 'satuan', 'Perawatan perlengkapan tidur sesuai ukuran dan jenis bahan.', 'pcs', 20000, 1, 1, 60, true],
            ['sepatu', 'Cuci Sepatu', 'satuan', 'Perawatan sepatu dengan metode yang disesuaikan dengan material.', 'pasang', 25000, 1, 1, 60, true],
            ['kemeja', 'Kemeja', 'satuan', 'Cuci dan setrika kemeja per potong.', 'potong', 5000, 1, 1, 52, false],
            ['celana', 'Celana', 'satuan', 'Cuci dan setrika celana per potong.', 'potong', 6000, 1, 1, 52, false],
            ['jaket', 'Jaket', 'satuan', 'Perawatan jaket sesuai bahan dan ukuran.', 'potong', 10000, 1, 1, 52, false],
            ['selimut', 'Selimut', 'satuan', 'Perawatan selimut sesuai ukuran.', 'buah', 15000, 1, 1, 60, true],
            ['boneka', 'Boneka', 'satuan', 'Perawatan boneka sesuai ukuran dan material.', 'buah', 10000, 1, 1, 60, true],
        ];

        foreach ($services as $index => [$slug, $name, $category, $description, $unit, $price, $min, $step, $hours, $startingAt]) {
            Service::updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $name,
                    'category' => $category,
                    'description' => $description,
                    'unit' => $unit,
                    'price' => $price,
                    'min_quantity' => $min,
                    'step_quantity' => $step,
                    'estimated_hours' => $hours,
                    'is_starting_at' => $startingAt,
                    'is_active' => true,
                    'sort_order' => $index + 1,
                ],
            );
        }
    }
}
