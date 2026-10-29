import '../../../css/pengusaha-chatbot.css';

import AdminIcon from '@/Components/Pengusaha/AdminIcon';
import {
    chatbotAudioOptions,
    chatbotDefaults,
    chatbotFallbackOptions,
    chatbotGuardrailOptions,
    chatbotQuickPrompts,
    chatbotToneOptions,
} from '@/Data/adminChatbot';
import { formatRupiah } from '@/Data/adminOrders';
import PengusahaLayout from '@/Layouts/PengusahaLayout';
import { Link, router, usePage } from '@inertiajs/react';
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

const createPreviewToken = () => {
    const random =
        typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

    return `owner-preview-${random}`.slice(0, 64);
};

const readAudioDuration = (file) =>
    new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const audio = new Audio();
        const finish = (duration) => {
            URL.revokeObjectURL(url);
            audio.removeAttribute('src');
            resolve(duration);
        };

        audio.onloadedmetadata = () =>
            finish(Number.isFinite(audio.duration) ? audio.duration : 0);
        audio.onerror = () => finish(0);
        audio.src = url;
        audio.load();
    });

const firstError = (error) => {
    const errors = error?.response?.data?.errors;

    if (errors && typeof errors === 'object') {
        const first = Object.values(errors).flat()[0];

        if (first) {
            return first;
        }
    }

    return (
        error?.response?.data?.message ||
        error?.message ||
        'Pesan uji gagal dikirim. Coba lagi.'
    );
};

export default function PengusahaChatbot({
    settings: initialSettings = chatbotDefaults,
    services = [],
    stats: serverStats = {},
    knowledge = {},
    recentSessions = [],
}) {
    const page = usePage();
    const { flash } = page.props;
    const csrfToken = page.props.csrf_token || '';
    const [settings, setSettings] = useState(initialSettings);
    const [savedSettings, setSavedSettings] = useState(() =>
        JSON.stringify(initialSettings),
    );
    const [previewInput, setPreviewInput] = useState('');
    const [previewMessages, setPreviewMessages] = useState(() => [
        {
            id: 'chat-greeting',
            role: 'bot',
            text: initialSettings.greeting,
        },
    ]);
    const [previewBusy, setPreviewBusy] = useState(false);
    const [previewAudio, setPreviewAudio] = useState(null);
    const [previewAudioSeconds, setPreviewAudioSeconds] = useState(0);
    const [toast, setToast] = useState('');
    const chatBodyRef = useRef(null);
    const audioInputRef = useRef(null);
    const previewSessionRef = useRef(createPreviewToken());

    const activeServices = useMemo(() => services, [services]);
    const selectedTone =
        chatbotToneOptions.find(
            (tone) => tone.value === settings.tone,
        ) ?? chatbotToneOptions[0];
    const isDirty = JSON.stringify(settings) !== savedSettings;
    const conversationsToday = Number(
        serverStats.conversationsToday ?? 0,
    );
    const ordersFromChatbot = Number(
        serverStats.ordersFromChatbot ?? 0,
    );
    const completionRate = Number(serverStats.completionRate ?? 0);
    const outletKnowledge = {
        outletCount: knowledge.outletCount ?? 1,
        hours: knowledge.hours ?? '08.00-20.00',
        area: knowledge.area ?? 'Bandung',
    };

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
                value: String(conversationsToday),
                note: 'Dari halaman Chatbot AI pelanggan',
                trend: 'Hari ini',
                trendTone: 'is-up',
                tone: 'is-blue',
                icon: 'message',
            },
            {
                label: 'Pesanan dari chatbot',
                value: String(ordersFromChatbot),
                note:
                    conversationsToday > 0
                        ? `${completionRate}% percakapan berujung pesanan`
                        : 'Belum ada percakapan hari ini',
                trend: 'Manual + AI',
                trendTone: 'is-up',
                tone: 'is-teal',
                icon: 'orders',
            },
            {
                label: 'Penyelesaian',
                value: `${completionRate}%`,
                note: 'Percakapan yang berhasil diarahkan',
                trend: 'Hari ini',
                trendTone: 'is-up',
                tone: 'is-green',
                icon: 'trend',
            },
        ],
        [
            completionRate,
            conversationsToday,
            ordersFromChatbot,
            settings.enabled,
        ],
    );

    useEffect(() => {
        if (flash?.status) {
            setToast(flash.status);
        }
    }, [flash?.status]);

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

        router.post(
            route('pengusaha.chatbot.update'),
            { ...settings, _token: csrfToken },
            {
                preserveScroll: true,
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                },
                onSuccess: () => {
                    setSavedSettings(JSON.stringify(settings));
                    setToast('Pengaturan chatbot disimpan.');
                },
                onError: () => {
                    setToast('Periksa kembali isian pengaturan chatbot.');
                },
            },
        );
    };

    const discardChanges = () => {
        setSettings(JSON.parse(savedSettings));
        setToast('Perubahan dibatalkan.');
    };

    const resetPreview = () => {
        previewSessionRef.current = createPreviewToken();
        setPreviewInput('');
        setPreviewAudio(null);
        setPreviewAudioSeconds(0);
        setPreviewMessages([
            {
                id: 'chat-greeting',
                role: 'bot',
                text: settings.greeting,
            },
        ]);
    };

    const handlePreviewAudio = async (event) => {
        const file = event.target.files?.[0];

        event.target.value = '';

        if (!file) {
            return;
        }

        const duration = await readAudioDuration(file);
        const maxSeconds = Number(settings.maxAudioSeconds || 60);

        if (!duration) {
            setToast('Durasi audio tidak terbaca. Coba file lain.');
            return;
        }

        if (duration > maxSeconds) {
            setToast(
                `Durasi voice note maksimal ${maxSeconds} detik.`,
            );
            return;
        }

        setPreviewAudio(file);
        setPreviewAudioSeconds(Math.max(1, Math.ceil(duration)));
    };

    const sendPreviewMessage = async (value) => {
        const message = String(value ?? '').trim();

        if (
            (!message && !previewAudio) ||
            previewBusy ||
            !settings.enabled
        ) {
            return;
        }

        const session = previewSessionRef.current;
        const audio = previewAudio;
        const audioSeconds = previewAudioSeconds;

        setPreviewMessages((previous) => [
            ...previous,
            {
                id: nextPreviewId(),
                role: 'user',
                text: message,
                audioName: audio?.name,
                audioDuration: audio ? audioSeconds : null,
            },
        ]);
        setPreviewInput('');
        setPreviewAudio(null);
        setPreviewAudioSeconds(0);
        setPreviewBusy(true);

        try {
            const form = new FormData();

            form.append('_token', csrfToken);
            form.append('session_token', session);

            if (message) {
                form.append('message', message);
            }

            if (audio) {
                form.append('audio', audio, audio.name);
                form.append('audio_seconds', String(audioSeconds));
            }

            const { data } = await window.axios.post(
                route('pengusaha.chatbot.uji'),
                form,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                },
            );

            if (previewSessionRef.current !== session) {
                return;
            }

            setPreviewMessages((previous) => [
                ...previous,
                {
                    id: nextPreviewId(),
                    role: 'bot',
                    text: data.reply,
                    transcript: data.transcript,
                    summary: data.summary,
                    handoff: data.handoff_to_manual,
                },
            ]);

            if (data.ai_status === 'fallback') {
                setToast(
                    'Gemini gagal, balasan memakai fallback lokal. Periksa kuota atau kunci API.',
                );
            }
        } catch (error) {
            if (previewSessionRef.current !== session) {
                return;
            }

            const text = firstError(error);

            setPreviewMessages((previous) => [
                ...previous,
                {
                    id: nextPreviewId(),
                    role: 'bot',
                    text,
                },
            ]);
            setToast(text);
        } finally {
            if (previewSessionRef.current === session) {
                setPreviewBusy(false);
            }
        }
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
                        chatbot. Aturan yang disimpan langsung dipakai chatbot
                        pelanggan melalui backend.
                    </p>
                </div>

                <div className="admin-head-actions">
                    <span className="admin-sample-badge">
                        <span aria-hidden="true" />
                        Tersimpan di database
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
                                            {outletKnowledge.outletCount}
                                        </strong>
                                        <small>
                                            Buka {outletKnowledge.hours}
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
                                        ? 'Simpan agar chatbot pelanggan memakai aturan terbaru.'
                                        : 'Aturan tersimpan dan dipakai chatbot pelanggan.'}
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
                                        <div className="admin-chat-stack">
                                            <div
                                                className={`admin-chat-bubble is-${message.role}`}
                                            >
                                                {message.text}
                                            </div>

                                            {message.audioName && (
                                                <span className="admin-chat-audio">
                                                    <AdminIcon
                                                        name="message"
                                                        size={11}
                                                    />
                                                    {message.audioName} ·{' '}
                                                    {message.audioDuration}s
                                                </span>
                                            )}

                                            {message.transcript && (
                                                <span className="admin-chat-transcript">
                                                    “{message.transcript}”
                                                </span>
                                            )}

                                            {message.summary && (
                                                <div className="admin-chat-summary">
                                                    <span>
                                                        Ringkasan pesanan
                                                    </span>
                                                    <strong>
                                                        {
                                                            message.summary
                                                                .serviceName
                                                        }{' '}
                                                        ·{' '}
                                                        {
                                                            message.summary
                                                                .quantity
                                                        }{' '}
                                                        {
                                                            message.summary
                                                                .unit
                                                        }
                                                    </strong>
                                                    <small>
                                                        Estimasi{' '}
                                                        {formatRupiah(
                                                            message.summary
                                                                .total,
                                                        )}
                                                    </small>
                                                </div>
                                            )}

                                            {message.handoff && (
                                                <span className="admin-chat-handoff">
                                                    Arahkan pelanggan ke
                                                    Pesan Manual
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {previewBusy && (
                                    <div className="admin-chat-row is-bot">
                                        <span
                                            className="admin-chat-avatar"
                                            aria-hidden="true"
                                        >
                                            <AdminIcon
                                                name="spark"
                                                size={11}
                                            />
                                        </span>
                                        <div className="admin-chat-bubble is-bot admin-chat-busy">
                                            Sedang memproses...
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="admin-chat-quick">
                                <span>Pertanyaan cepat</span>
                                <div>
                                    {chatbotQuickPrompts.map((prompt) => (
                                        <button
                                            key={prompt}
                                            type="button"
                                            disabled={
                                                !settings.enabled ||
                                                previewBusy
                                            }
                                            onClick={() =>
                                                sendPreviewMessage(prompt)
                                            }
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {previewAudio && (
                                <div className="admin-chat-attachment">
                                    <AdminIcon name="message" size={12} />
                                    <span>
                                        {previewAudio.name} ·{' '}
                                        {previewAudioSeconds}s
                                    </span>
                                    <button
                                        type="button"
                                        aria-label="Hapus voice note"
                                        onClick={() => {
                                            setPreviewAudio(null);
                                            setPreviewAudioSeconds(0);
                                        }}
                                    >
                                        <AdminIcon name="close" size={11} />
                                    </button>
                                </div>
                            )}

                            <input
                                ref={audioInputRef}
                                type="file"
                                accept="audio/*"
                                hidden
                                onChange={handlePreviewAudio}
                            />

                            <form
                                className="admin-chat-input"
                                onSubmit={submitPreview}
                            >
                                <button
                                    type="button"
                                    className="admin-chat-attach"
                                    aria-label="Unggah voice note"
                                    disabled={!settings.enabled || previewBusy}
                                    onClick={() =>
                                        audioInputRef.current?.click()
                                    }
                                >
                                    <AdminIcon name="message" size={15} />
                                </button>
                                <input
                                    type="text"
                                    value={previewInput}
                                    onChange={(event) =>
                                        setPreviewInput(event.target.value)
                                    }
                                    disabled={!settings.enabled || previewBusy}
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
                                        previewBusy ||
                                        (!previewInput.trim() &&
                                            !previewAudio)
                                    }
                                >
                                    <AdminIcon name="arrow" size={16} />
                                </button>
                            </form>

                            <p className="admin-chat-sample-note">
                                Uji ini memakai Gemini dan aturan yang sudah
                                disimpan. Simpan perubahan dulu sebelum
                                mencoba aturan baru.
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
                            Pengaturan disimpan di database dan dipakai backend
                            saat pelanggan mengirim teks atau voice note.
                        </p>
                    </section>

                    <section className="admin-card admin-chatbot-recent">
                        <div className="admin-chatbot-server-head">
                            <span className="admin-chatbot-server-icon">
                                <AdminIcon name="message" size={18} />
                            </span>
                            <div>
                                <span className="admin-card-label">
                                    PERCAKAPAN TERBARU
                                </span>
                                <strong>Aktivitas pelanggan</strong>
                                <small>Lima sesi terakhir dari chatbot</small>
                            </div>
                        </div>

                        {recentSessions.length === 0 ? (
                            <p className="admin-chatbot-recent-empty">
                                Belum ada percakapan. Sesi pelanggan akan
                                muncul di sini setelah chatbot dipakai.
                            </p>
                        ) : (
                            <ul className="admin-chatbot-recent-list">
                                {recentSessions.map((session) => (
                                    <li key={session.id}>
                                        <div>
                                            <strong>
                                                {session.customer}
                                            </strong>
                                            <small>
                                                {session.lastMessage ||
                                                    'Belum ada pesan'}
                                            </small>
                                        </div>
                                        <span>
                                            {session.messageCount} pesan
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
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
