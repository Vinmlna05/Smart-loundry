export const services = [
    {
        id: 'cuci-kering',
        category: 'kiloan',
        tag: 'KILOAN',
        number: '01',
        title: 'Cuci Kering',
        description:
            'Pakaian dicuci dan dikeringkan, cocok untuk kebutuhan harian.',
        price: 'Rp6.000',
        unit: '/kg',
        priceLabel: 'Mulai dari',
        meta: ['◷ Estimasi 2–3 hari', 'Min. 3 kg'],
        image: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=800&q=80',
        alt: 'Pakaian bersih setelah dicuci',
        order: { price: 6000, unit: 'kg', min: 3, step: 0.5 },
    },
    {
        id: 'cuci-setrika',
        category: 'kiloan',
        tag: 'KILOAN',
        number: '02',
        title: 'Cuci dan Setrika',
        description:
            'Pakaian dicuci, dikeringkan, disetrika, dan dilipat rapi.',
        price: 'Rp8.000',
        unit: '/kg',
        priceLabel: 'Mulai dari',
        meta: ['◷ Estimasi 2–3 hari', 'Min. 3 kg'],
        image: 'https://images.unsplash.com/photo-1489274495757-95c7c837b101?auto=format&fit=crop&w=800&q=80',
        alt: 'Pakaian rapi siap digunakan',
        popular: 'Pilihan Favorit',
        order: { price: 8000, unit: 'kg', min: 3, step: 0.5 },
    },
    {
        id: 'setrika',
        category: 'kiloan',
        tag: 'KILOAN',
        number: '03',
        title: 'Setrika Saja',
        description:
            'Solusi untuk pakaian bersih yang hanya membutuhkan penyetrikaan.',
        price: 'Rp5.000',
        unit: '/kg',
        priceLabel: 'Mulai dari',
        meta: ['◷ Estimasi 1–2 hari', 'Min. 3 kg'],
        image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=800&q=80',
        alt: 'Perlengkapan menyetrika pakaian',
        order: { price: 5000, unit: 'kg', min: 3, step: 0.5 },
    },
    {
        id: 'express',
        category: 'kiloan',
        tag: 'KILOAN',
        number: '04',
        title: 'Cuci Express',
        description:
            'Pilihan untuk kebutuhan mendesak dengan pengerjaan lebih cepat.',
        price: 'Rp12.000',
        unit: '/kg',
        priceLabel: 'Mulai dari',
        meta: ['◷ Estimasi 6–12 jam', 'Min. 1 kg'],
        image: 'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?auto=format&fit=crop&w=800&q=80',
        alt: 'Pakaian yang sedang diproses',
        order: { price: 12000, unit: 'kg', min: 1, step: 0.5 },
    },
    {
        id: 'bed-cover',
        category: 'satuan',
        tag: 'SATUAN',
        number: '05',
        title: 'Bed Cover',
        description:
            'Perawatan perlengkapan tidur sesuai ukuran dan jenis bahan.',
        price: 'Rp20.000',
        unit: '/pcs',
        priceLabel: 'Mulai dari',
        meta: ['◷ Estimasi 2–4 hari', 'Per ukuran'],
        image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
        alt: 'Perlengkapan tidur yang bersih',
        order: { price: 20000, unit: 'pcs', min: 1, step: 1, startingAt: true },
    },
    {
        id: 'sepatu',
        category: 'satuan',
        tag: 'SATUAN',
        number: '06',
        title: 'Cuci Sepatu',
        description:
            'Perawatan sepatu dengan metode yang disesuaikan dengan material.',
        price: 'Rp25.000',
        unit: '/pasang',
        priceLabel: 'Mulai dari',
        meta: ['◷ Estimasi 2–4 hari', 'Per jenis sepatu'],
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
        alt: 'Sepatu yang membutuhkan perawatan',
        order: {
            price: 25000,
            unit: 'pasang',
            min: 1,
            step: 1,
            startingAt: true,
        },
    },
    {
        id: 'jemput',
        category: 'tambahan',
        tag: 'TAMBAHAN',
        number: '07',
        title: 'Jemput Cucian',
        description:
            'Cucian dijemput dari alamatmu sesuai area dan jadwal yang tersedia.',
        price: 'Mulai Rp0',
        unit: '',
        priceLabel: 'Tarif',
        meta: ['Area tertentu', 'Konfirmasi jadwal'],
        image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
        alt: 'Layanan bantuan untuk kebutuhan rumah',
    },
    {
        id: 'antar',
        category: 'tambahan',
        tag: 'TAMBAHAN',
        number: '08',
        title: 'Antar Cucian',
        description:
            'Cucian selesai dapat diantar sesuai alamat dan jadwal yang disepakati.',
        price: 'Mulai Rp0',
        unit: '',
        priceLabel: 'Tarif',
        meta: ['Area tertentu', 'Konfirmasi jadwal'],
        image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=800&q=80',
        alt: 'Paket yang siap dikirim',
    },
];

export const itemPrices = [
    {
        id: 'kemeja',
        name: 'Kemeja',
        note: 'Cuci dan setrika',
        unit: 'Per potong',
        price: 'Rp5.000',
        order: { price: 5000, unit: 'potong', min: 1, step: 1 },
    },
    {
        id: 'celana',
        name: 'Celana',
        note: 'Bahan umum',
        unit: 'Per potong',
        price: 'Rp6.000',
        order: { price: 6000, unit: 'potong', min: 1, step: 1 },
    },
    {
        id: 'jaket',
        name: 'Jaket',
        note: 'Tergantung bahan dan ukuran',
        unit: 'Per potong',
        price: 'Rp10.000',
        order: { price: 10000, unit: 'potong', min: 1, step: 1 },
    },
    {
        id: 'selimut',
        name: 'Selimut',
        note: 'Tergantung ukuran',
        unit: 'Per buah',
        price: 'Rp15.000',
        order: {
            price: 15000,
            unit: 'buah',
            min: 1,
            step: 1,
            startingAt: true,
        },
    },
    {
        id: 'boneka',
        name: 'Boneka',
        note: 'Tergantung ukuran dan material',
        unit: 'Per buah',
        price: 'Rp10.000',
        order: {
            price: 10000,
            unit: 'buah',
            min: 1,
            step: 1,
            startingAt: true,
        },
    },
];

const orderedServices = services
    .filter((service) => service.order)
    .map((service) => ({
        id: service.id,
        name: service.title,
        ...service.order,
    }));

const orderedItems = itemPrices
    .filter((item) => item.order)
    .map((item) => ({
        id: item.id,
        name: item.name,
        ...item.order,
    }));

export const orderServices = [...orderedServices, ...orderedItems];
