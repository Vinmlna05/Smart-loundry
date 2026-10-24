import '../../../css/pengusaha-chatbot.css';

import AdminIcon from '@/Components/Pengusaha/AdminIcon';
import {
    chatbotAudioOptions,
    chatbotDefaults,
    chatbotFallbackOptions,
    chatbotGuardrailOptions,
    chatbotKnowledge,
    chatbotPreviewStats,
    chatbotQuickPrompts,
    chatbotToneOptions,
} from '@/Data/adminChatbot';
import { adminServices } from '@/Data/adminServices';
import { formatRupiah } from '@/Data/adminOrders';
import PengusahaLayout from '@/Layouts/PengusahaLayout';
import { Link } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';

const knowledgeToggles = [
    {
        key: 'autoServices',
        label: 'Sertakan layanan dan tarif aktif',
        description:
            'Daftar layanan disuntikkan dari database setiap percakapan.',
        icon: 'services',
    },
    {
        key: 'includeOutlets',
        label: 'Sertakan outlet dan jam buka',
        description:
            'Chatbot bisa menjawab lokasi, jam operasional, dan penjemputan.',
        icon: 'truck',
    },
    {
        key: 'includeDurations',
        label: 'Sebutkan estimasi pengerjaan',
        description:
            'Estimasi waktu ikut dijelaskan saat pelanggan bertanya.',
        icon: 'queue',
    },
];

const nextPreviewId = () =>
    `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const buildPreviewReply = (message, settings, sampleService) => {
    const value = message.toLowerCase();

    if (/harga|tarif|biaya|berapa/.test(value)) {
        if (!settings.autoServices) {
            return 'Info layanan dan tarif sedang tidak disertakan. Aktifkan “Sertakan layanan dan tarif aktif” agar aku bisa menyebutkan tarif resmi.';
        }

        if (!sampleService) {
            return 'Belum ada layanan aktif yang bisa aku sebutkan. Tambahkan layanan terlebih dahulu di halaman Layanan & tarif.';
        }

        const duration = settings.includeDurations
            ? ` Estimasi pengerjaan ${sampleService.duration.toLowerCase()} setelah cucian diterima.`
            : '';

        return `Untuk ${sampleService.name}, tarifnya ${formatRupiah(
            sampleService.price,
        )} per ${sampleService.unit}.${duration} Mau aku bantu siapkan pesanannya?`;
    }

    if (/jemput|antar|alamat/.test(value)) {
        if (!settings.includeOutlets) {
            return 'Info penjemputan sedang tidak disertakan. Kamu tetap bisa antar sendiri ke outlet atau gunakan Pesan Manual.';
        }

        return `Bisa. Penjemputan tersedia di area ${chatbotKnowledge.area}. Kirim alamat lengkap dan jadwal jemput, nanti aku bantu catat.`;
    }

    if (/jam|buka|outlet|lokasi/.test(value)) {
        if (!settings.includeOutlets) {
            return 'Info outlet dan jam buka sedang tidak disertakan. Kamu bisa memeriksa halaman outlet atau hubungi petugas.';
        }

        return `Outlet Pusat buka setiap hari ${chatbotKnowledge.hours}. Alamat dan pilihan antar sendiri bisa dilihat di halaman outlet.`;
    }

    if (/pesan|order|cuci/.test(value)) {
        return `Boleh, aku bantu. Kirim nama, nomor WhatsApp, layanan, perkiraan berat, dan pilih jemput atau antar sendiri. Aku hanya akan menanyakan data yang belum lengkap.`;
    }

    if (settings.fallbackAction === 'Minta pelanggan menghubungi outlet') {
        return 'Aku belum bisa memastikan itu. Supaya tidak keliru, hubungi petugas Outlet Pusat agar dibantu langsung, ya.';
    }

    if (settings.fallbackAction === 'Akhiri percakapan dengan sopan') {
        return 'Maaf, aku belum bisa membantu pertanyaan itu. Terima kasih sudah menghubungi Cleanora.';
    }

    return 'Aku belum yakin menjawab itu. Mau aku arahkan ke Pesan Manual supaya pesananmu bisa dicek petugas?';
};

export default function PengusahaChatbot() {
    const [settings, setSettings] = useState(chatbotDefaults);
    const [savedSettings, setSavedSettings] = useState(() =>
        JSON.stringify(chatbotDefaults),
    );
    const [previewInput, setPreviewInput] = useState('');
    const [previewMessages, setPreviewMessages] = useState(() => [
        {
            id: 'chat-greeting',
            role: 'bot',
            text: chatbotDefaults.greeting,
        },
    ]);
    const [toast, setToast] = useState('');
    const chatBodyRef = useRef(null);

    const activeServices = useMemo(
        () => adminServices.filter((service) => service.active),
        [],
    );
    const sampleService =
        activeServices.find(
            (service) => service.name === 'Cuci dan Setrika',
        ) ?? activeServices[0];
    const selectedTone =
        chatbotToneOptions.find(
            (tone) => tone.value === settings.tone,
        ) ?? chatbotToneOptions[0];
    const isDirty = JSON.stringify(settings) !== savedSettings;

    const stats = useMemo(
        () => [
            {
                label: 'Status chatbot',
                value: settings.enabled ? 'Aktif' : 'Nonaktif',
                note: settings.enabled
                    ? 'Siap menerima pesan pelanggan'
                    : 'Pelanggan melihat chatbot nonaktif',
                trend: settings.enabled ? 'Online' : 'Jeda',
                trendTone: settings.enabled ? 'is-up' : 'is-warning',
                tone: settings.enabled ? 'is-green' : 'is-gold',
                icon: 'chatbot',
            },
            {
                label: 'Percakapan hari ini',
                value: String(chatbotPreviewStats.conversationsToday),
                note: 'Dari halaman Chatbot AI pelanggan',
                trend: chatbotPreviewStats.conversationGrowth,
                trendTone: 'is-up',
                tone: 'is-blue',
                icon: 'message',
            },
            {
                label: 'Pesanan dari chatbot',
                value: String(chatbotPreviewStats.ordersFromChatbot),
                note: `${Math.round(
                    (chatbotPreviewStats.ordersFromChatbot /
                        chatbotPreviewStats.conversationsToday) *
                        100,
                )}% dari percakapan berujung pesanan`,
                trend: 'Manual + AI',
                trendTone: 'is-up',
                tone: 'is-teal',
                icon: 'orders',
            },
            {
                label: 'Penyelesaian',
                value: `${chatbotPreviewStats.completionRate}%`,
                note: 'Percakapan yang berhasil diarahkan',
                trend: '+6% minggu ini',
                trendTone: 'is-up',
                tone: 'is-green',
                icon: 'trend',
            },
        ],
        [settings.enabled],
    );

    useEffect(() => {
        setPreviewMessages((previous) => {
            const firstMessage = previous[0];

            if (!firstMessage || firstMessage.role !== 'bot') {
                return previous;
            }

            const nextText = settings.greeting;

            if (firstMessage.text === nextText) {
                return previous;
            }

            return [{ ...firstMessage, text: nextText }, ...previous.slice(1)];
        });
    }, [settings.greeting]);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop =
                chatBodyRef.current.scrollHeight;
        }
    }, [previewMessages]);

    useEffect(() => {
        if (!toast) {
            return undefined;
        }

        const timeout = window.setTimeout(() => setToast(''), 3000);

        return () => window.clearTimeout(timeout);
    }, [toast]);

    const updateField = (key, value) => {
        setSettings((previous) => ({ ...previous, [key]: value }));
    };

    const updateGuardrail = (key, value) => {
        setSettings((previous) => ({
            ...previous,
            guardrails: { ...previous.guardrails, [key]: value },
        }));
    };

    const saveSettings = (event) => {
        event.preventDefault();
        setSavedSettings(JSON.stringify(settings));
        setToast(
            'Pengaturan chatbot disimpan pada pratinjau lokal.',
        );
    };

    const discardChanges = () => {
        setSettings(JSON.parse(savedSettings));
        setToast('Perubahan dibatalkan.');
    };

    const resetPreview = () => {
        setPreviewInput('');
        setPreviewMessages([
            {
                id: 'chat-greeting',
                role: 'bot',
                text: settings.greeting,
            },
        ]);
    };

    const sendPreviewMessage = (value) => {
        const message = String(value ?? '').trim();

        if (!message || !settings.enabled) {
            return;
        }

        const reply = buildPreviewReply(
            message,
            settings,
            sampleService,
        );

        setPreviewMessages((previous) => [
            ...previous,
            { id: nextPreviewId(), role: 'user', text: message },
            { id: nextPreviewId(), role: 'bot', text: reply },
        ]);
        setPreviewInput('');
    };

    const submitPreview = (event) => {
        event.preventDefault();
        sendPreviewMessage(previewInput);
    };

    return (
        <PengusahaLayout
            title="Pengaturan Chatbot AI - Cleanora"
            active="chatbot"
            breadcrumb="Chatbot AI"
        >
            <div className="admin-page-head">
                <div className="admin-page-heading">
                    <span className="admin-eyebrow">
                        <span aria-hidden="true">✦</span>
                        Asisten pelanggan
                    </span>
                    <h1>
                        Pengaturan <em>Chatbot AI.</em>
                    </h1>
                    <p>
                        Atur sapaan, pengetahuan layanan, dan batasan jawaban
                        chatbot. Pratinjau di samping memakai balasan contoh,
                        bukan panggilan Gemini langsung.
                    </p>
                </div>

                <div className="admin-head-actions">
                    <span className="admin-sample-badge">
                        <span aria-hidden="true" />
                        Data contoh
                    </span>
                    <button
                        type="submit"
                        form="admin-chatbot-form"
                        className="admin-button admin-button-primary"
                        disabled={!isDirty}
                    >
                        <AdminIcon name="check" size={15} />
                        Simpan pengaturan
                    </button>
                </div>
            </div>

            <section className="admin-stats" aria-label="Ringkasan chatbot">
                {stats.map((stat) => (
                    <article
                        key={stat.label}
                        className={`admin-stat ${stat.tone}`}
                    >
                        <div className="admin-stat-top">
                            <span className="admin-stat-icon">
                                <AdminIcon name={stat.icon} size={19} />
                            </span>
                            <span
                                className={`admin-stat-trend ${stat.trendTone}`}
                            >
                                {stat.trend}
                            </span>
                        </div>
                        <p>{stat.label}</p>
                        <strong>{stat.value}</strong>
                        <span className="admin-stat-note">
                            {stat.note}
                        </span>
                    </article>
                ))}
            </section>

            <div className="admin-chatbot-layout">
                <form
                    id="admin-chatbot-form"
                    className="admin-chatbot-form"
                    onSubmit={saveSettings}
                >
                    <div className="admin-chatbot-stack">
                        <section className="admin-card admin-chatbot-card">
                            <div className="admin-chatbot-card-head">
                                <div>
                                    <span className="admin-card-label">
                                        IDENTITAS
                                    </span>
                                    <h2>Nama dan sambutan</h2>
                                    <p>
                                        Tampilkan asisten dengan karakter yang
                                        sesuai dengan Cleanora.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={settings.enabled}
                                    className={`admin-chatbot-main-switch${
                                        settings.enabled
                                            ? ' is-active'
                                            : ''
                                    }`}
                                    onClick={() =>
                                        updateField(
                                            'enabled',
                                            !settings.enabled,
                                        )
                                    }
                                >
                                    <span
                                        className="admin-chatbot-main-track"
                                        aria-hidden="true"
                                    >
                                        <span />
                                    </span>
                                    {settings.enabled
                                        ? 'Aktif'
                                        : 'Nonaktif'}
                                </button>
                            </div>

                            <div className="admin-chatbot-body">
                                <div className="admin-chatbot-form-grid">
                                    <label
                                        className="admin-chatbot-field"
                                        htmlFor="chatbot-name"
                                    >
                                        <span>Nama chatbot</span>
                                        <input
                                            id="chatbot-name"
                                            type="text"
                                            value={settings.botName}
                                            maxLength={32}
                                            onChange={(event) =>
                                                updateField(
                                                    'botName',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Contoh: Nova"
                                        />
                                        <small>
                                            Nama ini tampil di gelembung
                                            balasan dan halaman pelanggan.
                                        </small>
                                    </label>

                                    <label
                                        className="admin-chatbot-field"
                                        htmlFor="chatbot-tone"
                                    >
                                        <span>Gaya bahasa</span>
                                        <select
                                            id="chatbot-tone"
                                            value={settings.tone}
                                            onChange={(event) =>
                                                updateField(
                                                    'tone',
                                                    event.target.value,
                                                )
                                            }
                                        >
                                            {chatbotToneOptions.map(
                                                (tone) => (
                                                    <option
                                                        key={tone.value}
                                                        value={tone.value}
                                                    >
                                                        {tone.label}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                        <small>
                                            {selectedTone.description}
                                        </small>
                                    </label>

                                    <div className="admin-chatbot-field admin-chatbot-field-wide">
                                        <div className="admin-chatbot-label-row">
                                            <label htmlFor="chatbot-greeting">
                                                Sapaan awal
                                            </label>
                                            <span>
                                                {settings.greeting.length}/240
                                            </span>
                                        </div>
                                        <textarea
                                            id="chatbot-greeting"
                                            rows={3}
                                            maxLength={240}
                                            value={settings.greeting}
                                            onChange={(event) =>
                                                updateField(
                                                    'greeting',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <small>
                                            Kalimat pertama yang dilihat
                                            pelanggan saat membuka chatbot.
                                        </small>
                                    </div>
                                </div>

                                <div className="admin-chatbot-language">
                                    <span className="admin-chatbot-language-icon">
                                        <AdminIcon
                                            name="message"
                                            size={16}
                                        />
                                    </span>
                                    <div>
                                        <strong>Bahasa Indonesia</strong>
                                        <small>
                                            Bahasa jawaban mengikuti konteks
                                            pelanggan. Nama layanan tetap
                                            memakai istilah Cleanora.
                                        </small>
                                    </div>
                                    <span className="admin-status is-info">
                                        <span aria-hidden="true" />
                                        Tetap
                                    </span>
                                </div>
                            </div>
                        </section>

                        <section className="admin-card admin-chatbot-card">
                            <div className="admin-chatbot-card-head">
                                <div>
                                    <span className="admin-card-label">
                                        PENGETAHUAN
                                    </span>
                                    <h2>Informasi layanan</h2>
                                    <p>
                                        Sumber jawaban chatbot selalu diambil
                                        dari data resmi laundry.
                                    </p>
                                </div>
                                <Link
                                    href={route('pengusaha.layanan')}
                                    className="admin-chatbot-head-link"
                                >
                                    Kelola layanan
                                    <AdminIcon name="arrow" size={14} />
                                </Link>
                            </div>

                            <div className="admin-chatbot-body">
                                <div className="admin-chatbot-source-grid">
                                    <div>
                                        <span className="admin-chatbot-source-icon is-teal">
                                            <AdminIcon
                                                name="services"
                                                size={17}
                                            />
                                        </span>
                                        <span>Layanan aktif</span>
                                        <strong>
                                            {activeServices.length}
                                        </strong>
                                        <small>Tarif dan estimasi</small>
                                    </div>
                                    <div>
                                        <span className="admin-chatbot-source-icon is-blue">
                                            <AdminIcon
                                                name="truck"
                                                size={17}
                                            />
                                        </span>
                                        <span>Outlet</span>
                                        <strong>
                                            {chatbotKnowledge.outletCount}
                                        </strong>
                                        <small>
                                            Buka {chatbotKnowledge.hours}
                                        </small>
                                    </div>
                                    <div>
                                        <span className="admin-chatbot-source-icon is-green">
                                            <AdminIcon
                                                name="check"
                                                size={17}
                                            />
                                        </span>
                                        <span>Sumber data</span>
                                        <strong>Database</strong>
                                        <small>Disuntik dari backend</small>
                                    </div>
                                </div>

                                <div className="admin-chatbot-service-chips">
                                    {activeServices
                                        .slice(0, 4)
                                        .map((service) => (
                                            <span key={service.id}>
                                                {service.name}
                                            </span>
                                        ))}
                                    {activeServices.length > 4 && (
                                        <span className="is-more">
                                            +{activeServices.length - 4}{' '}
                                            lainnya
                                        </span>
                                    )}
                                </div>

                                <div className="admin-chatbot-toggle-list">
                                    {knowledgeToggles.map((toggle) => (
                                        <label
                                            key={toggle.key}
                                            className="admin-chatbot-toggle"
                                        >
                                            <span className="admin-chatbot-toggle-icon">
                                                <AdminIcon
                                                    name={toggle.icon}
                                                    size={16}
                                                />
                                            </span>
                                            <span className="admin-chatbot-toggle-copy">
                                                <strong>
                                                    {toggle.label}
                                                </strong>
                                                <small>
                                                    {toggle.description}
                                                </small>
                                            </span>
                                            <span className="admin-chatbot-switch-control">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        settings[
                                                            toggle.key
                                                        ]
                                                    }
                                                    onChange={(event) =>
                                                        updateField(
                                                            toggle.key,
                                                            event.target
                                                                .checked,
                                                        )
                                                    }
                                                />
                                                <span
                                                    className="admin-chatbot-track"
                                                    aria-hidden="true"
                                                >
                                                    <span />
                                                </span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section className="admin-card admin-chatbot-card">
                            <div className="admin-chatbot-card-head">
                                <div>
                                    <span className="admin-card-label">
                                        ATURAN JAWABAN
                                    </span>
                                    <h2>Perilaku dan batasan</h2>
                                    <p>
                                        Panduan ini dikirim sebagai prompt
                                        sistem ke Gemini dari backend.
                                    </p>
                                </div>
                                <span className="admin-chatbot-count">
                                    {
                                        Object.values(
                                            settings.guardrails,
                                        ).filter(Boolean).length
                                    }
                                    /4 aturan
                                </span>
                            </div>

                            <div className="admin-chatbot-body">
                                <div className="admin-chatbot-field">
                                    <div className="admin-chatbot-label-row">
                                        <label htmlFor="chatbot-prompt">
                                            Prompt sistem
                                        </label>
                                        <span>
                                            {settings.systemPrompt.length}
                                            /1600
                                        </span>
                                    </div>
                                    <textarea
                                        id="chatbot-prompt"
                                        className="admin-chatbot-prompt"
                                        rows={8}
                                        maxLength={1600}
                                        value={settings.systemPrompt}
                                        onChange={(event) =>
                                            updateField(
                                                'systemPrompt',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    <small>
                                        Tulis tugas, nada, dan hal yang tidak
                                        boleh dilakukan chatbot. Daftar
                                        layanan tetap disuntikkan terpisah
                                        dari database.
                                    </small>
                                </div>

                                <div className="admin-chatbot-guardrails">
                                    {chatbotGuardrailOptions.map(
                                        (guardrail) => (
                                            <label
                                                key={guardrail.key}
                                                className="admin-chatbot-check"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        settings
                                                            .guardrails[
                                                            guardrail.key
                                                        ]
                                                    }
                                                    onChange={(event) =>
                                                        updateGuardrail(
                                                            guardrail.key,
                                                            event.target
                                                                .checked,
                                                        )
                                                    }
                                                />
                                                <span
                                                    className="admin-chatbot-check-box"
                                                    aria-hidden="true"
                                                >
                                                    <AdminIcon
                                                        name="check"
                                                        size={11}
                                                    />
                                                </span>
                                                <span>
                                                    <strong>
                                                        {guardrail.title}
                                                    </strong>
                                                    <small>
                                                        {
                                                            guardrail.description
                                                        }
                                                    </small>
                                                </span>
                                            </label>
                                        ),
                                    )}
                                </div>

                                <label
                                    className="admin-chatbot-field admin-chatbot-fallback"
                                    htmlFor="chatbot-fallback"
                                >
                                    <span>Jika chatbot tidak yakin</span>
                                    <select
                                        id="chatbot-fallback"
                                        value={settings.fallbackAction}
                                        onChange={(event) =>
                                            updateField(
                                                'fallbackAction',
                                                event.target.value,
                                            )
                                        }
                                    >
                                        {chatbotFallbackOptions.map(
                                            (option) => (
                                                <option
                                                    key={option}
                                                    value={option}
                                                >
                                                    {option}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                    <small>
                                        Tindakan ini dipakai saat pertanyaan
                                        di luar topik atau hasil ekstraksi
                                        tidak valid.
                                    </small>
                                </label>
                            </div>
                        </section>

                        <section className="admin-card admin-chatbot-card">
                            <div className="admin-chatbot-card-head">
                                <div>
                                    <span className="admin-card-label">
                                        KEAMANAN
                                    </span>
                                    <h2>Batas dan penyimpanan</h2>
                                    <p>
                                        Jaga biaya API dan lindungi data
                                        pelanggan selama percakapan.
                                    </p>
                                </div>
                            </div>

                            <div className="admin-chatbot-body">
                                <div className="admin-chatbot-form-grid admin-chatbot-limit-grid">
                                    <label
                                        className="admin-chatbot-field"
                                        htmlFor="chatbot-max-messages"
                                    >
                                        <span>Maksimal pesan per sesi</span>
                                        <input
                                            id="chatbot-max-messages"
                                            type="number"
                                            min={5}
                                            max={60}
                                            value={settings.maxMessages}
                                            onChange={(event) =>
                                                updateField(
                                                    'maxMessages',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <small>
                                            Setelah batas tercapai, chatbot
                                            menawarkan Pesan Manual.
                                        </small>
                                    </label>

                                    <label
                                        className="admin-chatbot-field"
                                        htmlFor="chatbot-rate-limit"
                                    >
                                        <span>Batas sesi per jam</span>
                                        <input
                                            id="chatbot-rate-limit"
                                            type="number"
                                            min={1}
                                            max={60}
                                            value={
                                                settings.rateLimitPerHour
                                            }
                                            onChange={(event) =>
                                                updateField(
                                                    'rateLimitPerHour',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <small>
                                            Dihitung per alamat IP atau sesi
                                            untuk mencegah penyalahgunaan.
                                        </small>
                                    </label>

                                    <label
                                        className="admin-chatbot-field"
                                        htmlFor="chatbot-audio-limit"
                                    >
                                        <span>Durasi voice note</span>
                                        <select
                                            id="chatbot-audio-limit"
                                            value={
                                                settings.maxAudioSeconds
                                            }
                                            onChange={(event) =>
                                                updateField(
                                                    'maxAudioSeconds',
                                                    event.target.value,
                                                )
                                            }
                                        >
                                            {chatbotAudioOptions.map(
                                                (option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                        <small>
                                            Audio lebih panjang ditolak dengan
                                            pesan yang menjelaskan batasnya.
                                        </small>
                                    </label>
                                </div>

                                <label className="admin-chatbot-toggle admin-chatbot-transcript">
                                    <span className="admin-chatbot-toggle-icon">
                                        <AdminIcon
                                            name="orders"
                                            size={16}
                                        />
                                    </span>
                                    <span className="admin-chatbot-toggle-copy">
                                        <strong>
                                            Simpan transkrip percakapan
                                        </strong>
                                        <small>
                                            Dipakai untuk audit dan perbaikan
                                            prompt. Audio mentah tidak
                                            disimpan permanen.
                                        </small>
                                    </span>
                                    <span className="admin-chatbot-switch-control">
                                        <input
                                            type="checkbox"
                                            checked={
                                                settings.storeTranscripts
                                            }
                                            onChange={(event) =>
                                                updateField(
                                                    'storeTranscripts',
                                                    event.target.checked,
                                                )
                                            }
                                        />
                                        <span
                                            className="admin-chatbot-track"
                                            aria-hidden="true"
                                        >
                                            <span />
                                        </span>
                                    </span>
                                </label>

                                <p className="admin-chatbot-security-note">
                                    <AdminIcon name="alert" size={15} />
                                    Kunci API Gemini hanya disimpan di server.
                                    Jangan pernah menaruhnya di pengaturan
                                    browser atau mengirimkannya ke halaman
                                    pelanggan.
                                </p>
                            </div>
                        </section>

                        <div className="admin-chatbot-savebar">
                            <div>
                                <strong>
                                    {isDirty
                                        ? 'Ada perubahan belum disimpan.'
                                        : 'Semua perubahan tersimpan.'}
                                </strong>
                                <span>
                                    {isDirty
                                        ? 'Simpan untuk memperbarui pratinjau lokal.'
                                        : 'Pengaturan masih berupa data contoh dan belum masuk backend.'}
                                </span>
                            </div>
                            <div className="admin-chatbot-savebar-actions">
                                <button
                                    type="button"
                                    className="admin-button admin-button-outline"
                                    disabled={!isDirty}
                                    onClick={discardChanges}
                                >
                                    Batalkan
                                </button>
                                <button
                                    type="submit"
                                    className="admin-button admin-button-primary"
                                    disabled={!isDirty}
                                >
                                    Simpan pengaturan
                                </button>
                            </div>
                        </div>
                    </div>
                </form>

                <aside className="admin-chatbot-side">
                    <section className="admin-card admin-chat-preview">
                        <div className="admin-chat-preview-head">
                            <div className="admin-chat-preview-identity">
                                <span className="admin-chat-preview-avatar">
                                    <AdminIcon name="spark" size={18} />
                                </span>
                                <div>
                                    <strong>
                                        {settings.botName || 'Chatbot'}
                                    </strong>
                                    <small>
                                        <span
                                            className={
                                                settings.enabled
                                                    ? 'is-online'
                                                    : 'is-offline'
                                            }
                                            aria-hidden="true"
                                        />
                                        {settings.enabled
                                            ? 'Aktif menerima pesan'
                                            : 'Sedang nonaktif'}
                                    </small>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="admin-chat-reset"
                                onClick={resetPreview}
                            >
                                Reset
                            </button>
                        </div>

                        <div className="admin-chat-preview-window">
                            {!settings.enabled && (
                                <div className="admin-chat-offline">
                                    <AdminIcon name="alert" size={15} />
                                    Chatbot sedang nonaktif. Pelanggan tetap
                                    bisa memakai Pesan Manual.
                                </div>
                            )}

                            <div
                                className="admin-chat-messages"
                                ref={chatBodyRef}
                                aria-live="polite"
                            >
                                {previewMessages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`admin-chat-row is-${message.role}`}
                                    >
                                        {message.role === 'bot' && (
                                            <span
                                                className="admin-chat-avatar"
                                                aria-hidden="true"
                                            >
                                                ✦
                                            </span>
                                        )}
                                        <div
                                            className={`admin-chat-bubble is-${message.role}`}
                                        >
                                            {message.text}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="admin-chat-quick">
                                <span>Pertanyaan cepat</span>
                                <div>
                                    {chatbotQuickPrompts.map((prompt) => (
                                        <button
                                            key={prompt}
                                            type="button"
                                            disabled={!settings.enabled}
                                            onClick={() =>
                                                sendPreviewMessage(prompt)
                                            }
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <form
                                className="admin-chat-input"
                                onSubmit={submitPreview}
                            >
                                <input
                                    type="text"
                                    value={previewInput}
                                    onChange={(event) =>
                                        setPreviewInput(event.target.value)
                                    }
                                    disabled={!settings.enabled}
                                    placeholder={
                                        settings.enabled
                                            ? 'Tulis pesan untuk mencoba...'
                                            : 'Chatbot sedang nonaktif'
                                    }
                                    aria-label="Pesan pratinjau chatbot"
                                />
                                <button
                                    type="submit"
                                    aria-label="Kirim pesan pratinjau"
                                    disabled={
                                        !settings.enabled ||
                                        !previewInput.trim()
                                    }
                                >
                                    <AdminIcon name="arrow" size={16} />
                                </button>
                            </form>

                            <p className="admin-chat-sample-note">
                                Balasan contoh untuk pratinjau tampilan.
                                Gemini tidak dipanggil dari halaman ini.
                            </p>
                        </div>
                    </section>

                    <section className="admin-card admin-chatbot-server">
                        <div className="admin-chatbot-server-head">
                            <span className="admin-chatbot-server-icon">
                                <AdminIcon name="chatbot" size={18} />
                            </span>
                            <div>
                                <span className="admin-card-label">
                                    KONEKSI AI
                                </span>
                                <strong>Gemini API</strong>
                                <small>Diproses melalui backend Laravel</small>
                            </div>
                            <span className="admin-status is-success">
                                <span aria-hidden="true" />
                                Siap
                            </span>
                        </div>

                        <ul className="admin-chatbot-server-list">
                            <li>
                                <AdminIcon name="check" size={13} />
                                Kunci API tidak pernah dikirim ke browser.
                            </li>
                            <li>
                                <AdminIcon name="check" size={13} />
                                Hasil ekstraksi pesanan divalidasi server.
                            </li>
                            <li>
                                <AdminIcon name="check" size={13} />
                                Data layanan diambil dari database aktif.
                            </li>
                        </ul>

                        <p className="admin-chatbot-server-note">
                            Pengaturan pada halaman ini adalah pratinjau
                            frontend. Penyimpanan dan panggilan Gemini belum
                            terhubung.
                        </p>
                    </section>
                </aside>
            </div>

            {toast && (
                <div className="admin-toast" role="status">
                    <span>
                        <AdminIcon name="check" size={14} />
                    </span>
                    {toast}
                </div>
            )}
        </PengusahaLayout>
    );
}
