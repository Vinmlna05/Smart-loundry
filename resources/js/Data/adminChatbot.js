export const chatbotDefaults = {
    enabled: true,
    botName: 'Nova',
    tone: 'Ramah',
    greeting:
        'Halo! Aku Nova, asisten Cleanora. Mau pesan laundry, cek tarif, atau tanya jadwal penjemputan?',
    systemPrompt: `Kamu adalah Nova, asisten Cleanora Laundry & Care.

Tugasmu:
1. Bantu pelanggan memahami layanan, tarif, dan alur pemesanan.
2. Kumpulkan nama, nomor WhatsApp, layanan, perkiraan berat, metode penyerahan, dan alamat atau jadwal jika diperlukan.
3. Jangan mengarang layanan, tarif, promo, atau ketersediaan outlet.
4. Jika data pesanan belum lengkap, tanyakan hanya data yang kurang.
5. Jika permintaan di luar topik laundry atau kamu tidak yakin, tawarkan Pesan Manual.`,
    autoServices: true,
    includeOutlets: true,
    includeDurations: true,
    guardrails: {
        priceFromList: true,
        noInventedServices: true,
        askMissingOnly: true,
        offerManual: true,
    },
    fallbackAction: 'Tawarkan Pesan Manual',
    maxMessages: 24,
    rateLimitPerHour: 10,
    maxAudioSeconds: '60',
    storeTranscripts: true,
};

export const chatbotToneOptions = [
    {
        value: 'Ramah',
        label: 'Ramah dan santai',
        description: 'Sapaan hangat dengan bahasa sehari-hari.',
    },
    {
        value: 'Ringkas',
        label: 'Ringkas dan langsung',
        description: 'Jawaban pendek, fokus pada langkah berikutnya.',
    },
    {
        value: 'Formal',
        label: 'Formal dan sopan',
        description: 'Nada tenang dengan sapaan yang lebih resmi.',
    },
];

export const chatbotFallbackOptions = [
    'Tawarkan Pesan Manual',
    'Minta pelanggan menghubungi outlet',
    'Akhiri percakapan dengan sopan',
];

export const chatbotAudioOptions = [
    { value: '30', label: '30 detik' },
    { value: '60', label: '60 detik' },
    { value: '90', label: '90 detik' },
    { value: '120', label: '2 menit' },
];

export const chatbotGuardrailOptions = [
    {
        key: 'priceFromList',
        title: 'Tarif hanya dari daftar aktif',
        description:
            'Chatbot hanya menyebutkan tarif layanan yang aktif di database.',
    },
    {
        key: 'noInventedServices',
        title: 'Jangan mengarang layanan',
        description:
            'Layanan, promo, dan ketersediaan outlet harus berasal dari data resmi.',
    },
    {
        key: 'askMissingOnly',
        title: 'Tanyakan data yang kurang',
        description:
            'Hindari menanyakan ulang informasi pesanan yang sudah lengkap.',
    },
    {
        key: 'offerManual',
        title: 'Tawarkan Pesan Manual',
        description:
            'Alihkan ke formulir manual saat permintaan di luar topik atau gagal diproses.',
    },
];

export const chatbotQuickPrompts = [
    'Berapa tarif cuci?',
    'Bisa dijemput?',
    'Jam buka outlet?',
];

export const chatbotPreviewStats = {
    conversationsToday: 48,
    conversationGrowth: '+12%',
    ordersFromChatbot: 19,
    completionRate: 76,
};

export const chatbotKnowledge = {
    outletCount: 1,
    hours: '08.00–20.00',
    area: 'Bandung',
};
