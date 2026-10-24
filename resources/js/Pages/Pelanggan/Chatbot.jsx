import '../../../css/chatbot.css';

import { orderServices } from '@/Data/services';
import CleanoraLayout from '@/Layouts/CleanoraLayout';
import { Link } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const rupiah = (value) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`;

const timeLabel = () =>
    new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date());

const formatDuration = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const serviceKeywords = [
    { id: 'cuci-setrika', keywords: ['cuci setrika', 'cuci dan setrika'] },
    { id: 'cuci-kering', keywords: ['cuci kering'] },
    { id: 'express', keywords: ['express', 'kilat'] },
    { id: 'bed-cover', keywords: ['bed cover', 'bedcover', 'selimut'] },
    { id: 'sepatu', keywords: ['sepatu'] },
    { id: 'setrika', keywords: ['setrika'] },
    { id: 'kemeja', keywords: ['kemeja'] },
    { id: 'celana', keywords: ['celana'] },
    { id: 'jaket', keywords: ['jaket'] },
    { id: 'boneka', keywords: ['boneka'] },
];

function findService(text) {
    const lower = text.toLowerCase();
    const byName = orderServices.find((service) =>
        lower.includes(service.name.toLowerCase()),
    );

    if (byName) {
        return byName;
    }

    const byKeyword = serviceKeywords.find((item) =>
        item.keywords.some((keyword) => lower.includes(keyword)),
    );

    return byKeyword
        ? orderServices.find((service) => service.id === byKeyword.id)
        : null;
}

function parseQuantity(text) {
    const match = text.replace(',', '.').match(/(\d+(?:\.\d+)?)/);

    return match ? Number(match[1]) : null;
}

const initialMessages = () => [
    {
        id: 'greeting',
        role: 'bot',
        time: timeLabel(),
        text: 'Halo! Aku Cleanora Assistant, asisten laundry dari Cleanora. Aku bisa membantu menyusun pesanan lewat obrolan santai.',
    },
    {
        id: 'ask-name',
        role: 'bot',
        time: timeLabel(),
        text: 'Sebelum mulai, siapa nama kamu?',
    },
];

const emptyDraft = {
    name: '',
    serviceId: '',
    quantity: null,
    method: '',
    address: '',
    confirmed: false,
};

const methodLabel = (method) =>
    method === 'jemput' ? 'Dijemput' : 'Antar sendiri';

export default function PelangganChatbot() {
    const [messages, setMessages] = useState(initialMessages);
    const [stage, setStage] = useState('name');
    const [draft, setDraft] = useState(emptyDraft);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordSeconds, setRecordSeconds] = useState(0);
    const [toast, setToast] = useState('');

    const idRef = useRef(100);
    const timersRef = useRef([]);
    const recordTimerRef = useRef(null);
    const messagesRef = useRef(null);
    const inputRef = useRef(null);

    const nextId = useCallback(() => {
        idRef.current += 1;

        return idRef.current;
    }, []);

    const selectedService = useMemo(
        () => orderServices.find((service) => service.id === draft.serviceId),
        [draft.serviceId],
    );

    const scheduleReply = useCallback(
        (items, options = {}) => {
            setIsTyping(true);

            const timer = window.setTimeout(() => {
                setMessages((previous) => [
                    ...previous,
                    ...items.map((item) => ({
                        id: nextId(),
                        role: 'bot',
                        time: timeLabel(),
                        ...item,
                    })),
                ]);
                setIsTyping(false);

                if (options.stage) {
                    setStage(options.stage);
                }

                if (options.draft) {
                    setDraft((previous) => ({ ...previous, ...options.draft }));
                }

                inputRef.current?.focus();
            }, 700);

            timersRef.current.push(timer);
        },
        [nextId],
    );

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const element = messagesRef.current;

            if (element) {
                element.scrollTop = element.scrollHeight;
            }
        }, 60);

        return () => window.clearTimeout(timer);
    }, [messages, isTyping, isRecording]);

    useEffect(() => {
        if (!toast) {
            return undefined;
        }

        const timer = window.setTimeout(() => setToast(''), 3200);

        return () => window.clearTimeout(timer);
    }, [toast]);

    useEffect(
        () => () => {
            timersRef.current.forEach((timer) => window.clearTimeout(timer));

            if (recordTimerRef.current) {
                window.clearInterval(recordTimerRef.current);
            }
        },
        [],
    );

    const restartConversation = useCallback(() => {
        timersRef.current.forEach((timer) => window.clearTimeout(timer));
        timersRef.current = [];

        if (recordTimerRef.current) {
            window.clearInterval(recordTimerRef.current);
            recordTimerRef.current = null;
        }

        setIsRecording(false);
        setRecordSeconds(0);
        setIsTyping(false);
        setInput('');
        setDraft(emptyDraft);
        setStage('name');
        setMessages(initialMessages());
        setToast('Percakapan dimulai ulang');
    }, []);

    const showSummary = (overrides = {}) => {
        const nextDraft = { ...draft, ...overrides };
        const service = orderServices.find(
            (item) => item.id === nextDraft.serviceId,
        );

        if (!service || !nextDraft.quantity) {
            scheduleReply([
                {
                    text: 'Sepertinya ada detail yang belum lengkap. Mari pilih layanannya lagi, ya.',
                },
            ]);

            setStage('service');

            return;
        }

        scheduleReply(
            [
                {
                    text: 'Terima kasih! Aku sudah menyusun ringkasan pesananmu. Periksa detailnya dulu, ya.',
                },
                {
                    summary: {
                        serviceName: service.name,
                        quantity: nextDraft.quantity,
                        unit: service.unit,
                        unitPrice: service.price,
                        total: Math.round(service.price * nextDraft.quantity),
                        method: nextDraft.method,
                        address: nextDraft.address,
                    },
                },
            ],
            { stage: 'summary', draft: overrides },
        );
    };

    const handleUserText = (text) => {
        if (stage === 'name') {
            const name = text.replace(/\s+/g, ' ').trim().slice(0, 60);

            setDraft((previous) => ({ ...previous, name }));
            scheduleReply(
                [
                    {
                        text: `Senang berkenalan, ${name}! Layanan apa yang kamu butuhkan?`,
                    },
                    {
                        text: 'Kamu bisa ketik sendiri, misalnya "cuci dan setrika 3 kg", atau pilih salah satu layanan di bawah.',
                    },
                ],
                { stage: 'service' },
            );

            return;
        }

        if (stage === 'service') {
            const service = findService(text);

            if (!service) {
                scheduleReply([
                    {
                        text: 'Maaf, aku belum menemukan layanan itu. Coba sebutkan salah satu layanan berikut: Cuci Kering, Cuci dan Setrika, Setrika Saja, Cuci Express, Bed Cover, atau Cuci Sepatu.',
                    },
                ]);

                return;
            }

            const quantity = parseQuantity(text);

            if (quantity && quantity >= service.min && quantity <= 100) {
                scheduleReply(
                    [
                        {
                            text: `${service.name} untuk ${quantity} ${service.unit}. Mau diantar sendiri ke outlet atau dijemput?`,
                        },
                    ],
                    {
                        stage: 'method',
                        draft: { serviceId: service.id, quantity },
                    },
                );

                return;
            }

            setDraft((previous) => ({ ...previous, serviceId: service.id }));
            scheduleReply(
                [
                    { text: `${service.name}, pilihan yang bagus.` },
                    {
                        text:
                            service.unit === 'kg'
                                ? `Berapa perkiraan berat cucianmu? Minimal ${service.min} kg.`
                                : `Berapa ${service.unit} yang ingin dirawat? Minimal ${service.min} ${service.unit}.`,
                    },
                ],
                { stage: 'quantity', draft: { serviceId: service.id } },
            );

            return;
        }

        if (stage === 'quantity') {
            if (!selectedService) {
                setStage('service');
                scheduleReply([
                    { text: 'Layanannya belum terpilih. Layanan apa yang kamu butuhkan?' },
                ]);

                return;
            }

            const quantity = parseQuantity(text);

            if (!quantity || quantity < selectedService.min) {
                scheduleReply([
                    {
                        text: `Jumlahnya minimal ${selectedService.min} ${selectedService.unit}. Coba tulis lagi, ya.`,
                    },
                ]);

                return;
            }

            if (quantity > 100) {
                scheduleReply([
                    {
                        text: 'Jumlahnya terlalu besar untuk satu pesanan. Silakan hubungi outlet untuk pesanan dalam jumlah banyak.',
                    },
                ]);

                return;
            }

            scheduleReply(
                [
                    {
                        text: `Siap, ${quantity} ${selectedService.unit} ${selectedService.name}. Mau diantar sendiri ke outlet atau dijemput?`,
                    },
                ],
                { stage: 'method', draft: { quantity } },
            );

            return;
        }

        if (stage === 'method') {
            const lower = text.toLowerCase();
            const wantsPickup =
                /jemput|dijemput|ambil di rumah|ke rumah/.test(lower);
            const wantsDropoff =
                /antar sendiri|sendiri|ke outlet|datang|drop/.test(lower);

            if (wantsPickup && !wantsDropoff) {
                scheduleReply(
                    [
                        {
                            text: 'Baik, cucian akan dijemput. Boleh tulis alamat lengkap penjemputan?',
                        },
                    ],
                    { stage: 'address', draft: { method: 'jemput' } },
                );

                return;
            }

            if (wantsDropoff) {
                showSummary({ method: 'antar-sendiri' });

                return;
            }

            scheduleReply([
                {
                    text: 'Aku belum yakin dengan pilihannya. Pilih "Antar sendiri" atau "Dijemput", ya.',
                },
            ]);

            return;
        }

        if (stage === 'address') {
            if (text.trim().length < 8) {
                scheduleReply([
                    {
                        text: 'Alamatnya terlalu singkat. Tulis nama jalan, nomor rumah, dan patokan agar petugas mudah menemukan lokasimu.',
                    },
                ]);

                return;
            }

            showSummary({ address: text.trim().slice(0, 300) });

            return;
        }

        if (stage === 'summary') {
            if (/konfirmasi|setuju|ya|lanjut/i.test(text)) {
                const summaryMessage = [...messages]
                    .reverse()
                    .find((message) => message.summary);

                if (summaryMessage) {
                    confirmOrder(summaryMessage.id);
                }

                return;
            }

            if (/ubah|ganti|edit/i.test(text)) {
                editOrder();

                return;
            }

            scheduleReply([
                {
                    text: 'Silakan periksa ringkasan di atas, lalu pilih "Konfirmasi pesanan" atau "Ubah data".',
                },
            ]);

            return;
        }

        if (/pesan lagi|ulang|mulai ulang|lagi/i.test(text)) {
            restartConversation();

            return;
        }

        scheduleReply([
            {
                text: 'Kamu bisa mulai pesanan baru lewat tombol "Mulai ulang" di atas, atau lanjut ke halaman Pesan Manual.',
            },
        ]);
    };

    const sendMessage = (value) => {
        const text = value.trim();

        if (!text || isTyping || isRecording) {
            return;
        }

        setMessages((previous) => [
            ...previous,
            { id: nextId(), role: 'user', time: timeLabel(), text },
        ]);
        setInput('');
        handleUserText(text);
    };

    const confirmOrder = (messageId) => {
        setMessages((previous) =>
            previous.map((message) =>
                message.id === messageId
                    ? { ...message, confirmed: true }
                    : message,
            ),
        );
        setDraft((previous) => ({ ...previous, confirmed: true }));
        setStage('done');
        setToast('Pesanan dikonfirmasi');

        scheduleReply([
            {
                text: `Baik, pesanan untuk ${draft.name || 'kamu'} sudah kusiapkan. Nomor pesanan akan diterbitkan setelah pesanan tersimpan di sistem.`,
            },
            {
                text: 'Catatan: halaman ini masih berupa simulasi tampilan. Hubungkan chatbot ke backend agar pesanan benar-benar tersimpan dan notifikasi WhatsApp terkirim.',
            },
        ]);
    };

    const editOrder = () => {
        setDraft((previous) => ({
            ...previous,
            serviceId: '',
            quantity: null,
            method: '',
            address: '',
            confirmed: false,
        }));
        setStage('service');
        scheduleReply([
            {
                text: 'Baik, kita ubah detail pesanannya. Layanan apa yang kamu butuhkan?',
            },
        ]);
    };

    const startRecording = () => {
        if (isRecording || isTyping) {
            return;
        }

        setIsRecording(true);
        setRecordSeconds(0);
        recordTimerRef.current = window.setInterval(() => {
            setRecordSeconds((seconds) => seconds + 1);
        }, 1000);
    };

    const finishRecording = () => {
        if (!isRecording) {
            return;
        }

        const duration = Math.max(recordSeconds, 1);

        if (recordTimerRef.current) {
            window.clearInterval(recordTimerRef.current);
            recordTimerRef.current = null;
        }

        setIsRecording(false);
        setRecordSeconds(0);
        setMessages((previous) => [
            ...previous,
            {
                id: nextId(),
                role: 'user',
                time: timeLabel(),
                voiceDuration: duration,
            },
        ]);
        scheduleReply([
            { text: 'Aku sudah menerima pesan suaramu.' },
            {
                text: 'Transkripsi suara otomatis akan aktif setelah chatbot terhubung ke Gemini. Sementara ini, ketik pesanmu agar aku bisa membantu menyusun pesanan.',
            },
        ]);
    };

    const quickReplies = useMemo(() => {
        if (isTyping || isRecording) {
            return [];
        }

        if (stage === 'service') {
            return [
                'Cuci dan setrika 3 kg',
                'Cuci kering 3 kg',
                'Cuci sepatu 1 pasang',
            ];
        }

        if (stage === 'quantity' && selectedService) {
            const step = selectedService.unit === 'kg' ? 2 : 1;
            const values = [selectedService.min, selectedService.min + step];

            return values.map(
                (value) => `${value} ${selectedService.unit}`,
            );
        }

        if (stage === 'method') {
            return ['Antar sendiri', 'Dijemput'];
        }

        if (stage === 'done') {
            return ['Pesan lagi'];
        }

        return [];
    }, [isRecording, isTyping, selectedService, stage]);

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage(input);
        }
    };

    return (
        <CleanoraLayout
            title="Chatbot AI"
            active="chatbot"
            pageClassName="cleanora-chat-page"
        >
            <section className="chat-hero">
                <div className="container chat-hero-content">
                    <div className="chat-hero-text">
                        <div className="breadcrumb">
                            <Link href={route('pelanggan.dashboard')}>
                                Beranda
                            </Link>
                            <span>/</span>
                            <span>Chatbot AI</span>
                        </div>

                        <span className="section-label">CHATBOT AI CLEANORA</span>

                        <h1>
                            Ceritakan Cucianmu,
                            <br />
                            Biar AI yang <em>Menyusun.</em>
                        </h1>

                        <p>
                            Tidak perlu mengisi formulir panjang. Ceritakan
                            kebutuhan laundry lewat teks atau pesan suara,
                            lalu periksa ringkasan pesanan yang disusun
                            Cleanora Assistant.
                        </p>

                        <div className="chat-hero-badges">
                            <span>Pesan lewat teks</span>
                            <span>Input suara</span>
                            <span>Ringkasan otomatis</span>
                        </div>
                    </div>

                    <aside className="chat-hero-note">
                        <div className="hero-note-icon">✧</div>
                        <strong>Asisten laundry harian</strong>
                        <p>
                            Cleanora Assistant membantu mencocokkan layanan,
                            jumlah, dan metode penyerahan. Keputusan akhir
                            tetap ada di tanganmu.
                        </p>
                        <span className="hero-note-status">
                            <span className="status-dot"></span>
                            Siap membantu
                        </span>
                    </aside>

                    <div className="chat-hero-decoration">✧</div>
                </div>
            </section>

            <section className="chat-section">
                <div className="container chat-layout">
                    <div className="chat-panel">
                        <div className="chat-panel-header">
                            <div className="chat-bot-avatar">✧</div>
                            <div className="chat-bot-meta">
                                <strong>Cleanora Assistant</strong>
                                <small>
                                    <span className="status-dot"></span>
                                    Online · Asisten laundry AI
                                </small>
                            </div>

                            <button
                                type="button"
                                className="chat-restart"
                                onClick={restartConversation}
                            >
                                ↻ <span>Mulai ulang</span>
                            </button>
                        </div>

                        <div
                            className="chat-messages"
                            ref={messagesRef}
                            aria-live="polite"
                        >
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`chat-row ${message.role}`}
                                >
                                    {message.role === 'bot' && (
                                        <div className="chat-row-avatar">
                                            ✧
                                        </div>
                                    )}

                                    <div className="chat-stack">
                                        {message.text && (
                                            <div className="chat-bubble">
                                                {message.text}
                                            </div>
                                        )}

                                        {message.voiceDuration && (
                                            <div className="chat-bubble chat-voice">
                                                <span className="voice-icon">
                                                    ♫
                                                </span>
                                                <span
                                                    className="voice-wave"
                                                    aria-hidden="true"
                                                >
                                                    <i></i>
                                                    <i></i>
                                                    <i></i>
                                                    <i></i>
                                                    <i></i>
                                                    <i></i>
                                                    <i></i>
                                                </span>
                                                <span className="voice-duration">
                                                    {formatDuration(
                                                        message.voiceDuration,
                                                    )}
                                                </span>
                                            </div>
                                        )}

                                        {message.summary && (
                                            <div className="assistant-summary">
                                                <div className="assistant-summary-header">
                                                    <span>RINGKASAN PESANAN</span>
                                                    <span
                                                        className="assistant-summary-badge"
                                                    >
                                                        {message.confirmed
                                                            ? 'Terkonfirmasi'
                                                            : 'Estimasi'}
                                                    </span>
                                                </div>

                                                <div className="assistant-summary-rows">
                                                    <div className="assistant-summary-row">
                                                        <span>Layanan</span>
                                                        <strong>
                                                            {
                                                                message.summary
                                                                    .serviceName
                                                            }
                                                        </strong>
                                                    </div>

                                                    <div className="assistant-summary-row">
                                                        <span>Jumlah</span>
                                                        <strong>
                                                            {
                                                                message.summary
                                                                    .quantity
                                                            }{' '}
                                                            {
                                                                message.summary
                                                                    .unit
                                                            }
                                                        </strong>
                                                    </div>

                                                    <div className="assistant-summary-row">
                                                        <span>Metode</span>
                                                        <strong>
                                                            {methodLabel(
                                                                message.summary
                                                                    .method,
                                                            )}
                                                        </strong>
                                                    </div>

                                                    {message.summary
                                                        .address && (
                                                        <div className="assistant-summary-row">
                                                            <span>Alamat</span>
                                                            <strong>
                                                                {
                                                                    message.summary
                                                                        .address
                                                                }
                                                            </strong>
                                                        </div>
                                                    )}

                                                    <div className="assistant-summary-row">
                                                        <span>Tarif</span>
                                                        <strong>
                                                            {rupiah(
                                                                message.summary
                                                                    .unitPrice,
                                                            )}
                                                            /
                                                            {
                                                                message.summary
                                                                    .unit
                                                            }
                                                        </strong>
                                                    </div>
                                                </div>

                                                <div className="assistant-summary-total">
                                                    <div>
                                                        <span>
                                                            Estimasi biaya
                                                        </span>
                                                        <strong>
                                                            {rupiah(
                                                                message.summary
                                                                    .total,
                                                            )}
                                                        </strong>
                                                    </div>
                                                    <small>
                                                        Estimasi ini belum
                                                        termasuk biaya
                                                        tambahan. Harga final
                                                        mengikuti berat aktual.
                                                    </small>
                                                </div>

                                                {message.confirmed ? (
                                                    <div className="assistant-confirmed">
                                                        <span>✓</span>
                                                        Pesanan dikonfirmasi
                                                    </div>
                                                ) : (
                                                    <div className="assistant-summary-actions">
                                                        <button
                                                            type="button"
                                                            className="btn btn-primary"
                                                            onClick={() =>
                                                                confirmOrder(
                                                                    message.id,
                                                                )
                                                            }
                                                        >
                                                            Konfirmasi pesanan
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline"
                                                            onClick={editOrder}
                                                        >
                                                            Ubah data
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <span className="chat-time">
                                            {message.time}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="chat-row bot">
                                    <div className="chat-row-avatar">✧</div>
                                    <div
                                        className="chat-typing"
                                        aria-label="Cleanora Assistant sedang menulis"
                                    >
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            )}

                            {quickReplies.length > 0 && (
                                <div className="chat-suggestions">
                                    {quickReplies.map((reply) => (
                                        <button
                                            key={reply}
                                            type="button"
                                            className="chat-suggestion"
                                            onClick={() => sendMessage(reply)}
                                        >
                                            {reply}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="chat-composer">
                            {isRecording ? (
                                <div
                                    className="chat-recording"
                                    aria-live="polite"
                                >
                                    <span className="recording-dot"></span>
                                    <span className="recording-label">
                                        Merekam suara...
                                    </span>
                                    <span
                                        className="recording-wave"
                                        aria-hidden="true"
                                    >
                                        <i></i>
                                        <i></i>
                                        <i></i>
                                        <i></i>
                                        <i></i>
                                    </span>
                                    <span className="recording-time">
                                        {formatDuration(recordSeconds)}
                                    </span>
                                    <button
                                        type="button"
                                        className="recording-stop"
                                        onClick={finishRecording}
                                    >
                                        Hentikan
                                    </button>
                                </div>
                            ) : (
                                <div className="chat-input-row">
                                    <textarea
                                        ref={inputRef}
                                        rows={1}
                                        value={input}
                                        placeholder="Tulis pesan untuk Cleanora Assistant..."
                                        maxLength={500}
                                        aria-label="Tulis pesan"
                                        onChange={(event) =>
                                            setInput(event.target.value)
                                        }
                                        onKeyDown={handleKeyDown}
                                    />

                                    <button
                                        type="button"
                                        className="chat-mic"
                                        aria-label="Rekam pesan suara"
                                        onClick={startRecording}
                                        disabled={isTyping}
                                    >
                                        ♫
                                    </button>
                                    <button
                                        type="button"
                                        className="chat-send"
                                        aria-label="Kirim pesan"
                                        onClick={() => sendMessage(input)}
                                        disabled={!input.trim() || isTyping}
                                    >
                                        ↑
                                    </button>
                                </div>
                            )}

                            <p className="chat-disclaimer">
                                Cleanora Assistant bisa keliru. Periksa
                                ringkasan sebelum mengonfirmasi pesanan.
                            </p>
                        </div>
                    </div>

                    <aside className="chat-side">
                        <div className="chat-side-card">
                            <span className="section-label">
                                CARA KERJA
                            </span>
                            <h2>
                                Tiga Langkah <em>Sederhana.</em>
                            </h2>
                            <p>
                                Kamu tidak perlu menghafal menu. Cukup jawab
                                pertanyaan yang diberikan.
                            </p>

                            <div className="chat-steps">
                                <div className="chat-step">
                                    <span className="chat-step-number">
                                        01
                                    </span>
                                    <div>
                                        <strong>Ceritakan kebutuhanmu</strong>
                                        <p>
                                            Sapa asisten dan sebutkan layanan
                                            laundry yang kamu inginkan.
                                        </p>
                                    </div>
                                </div>

                                <div className="chat-step">
                                    <span className="chat-step-number">
                                        02
                                    </span>
                                    <div>
                                        <strong>Lengkapi detail pesanan</strong>
                                        <p>
                                            Tentukan jumlah, metode penyerahan,
                                            dan alamat jika memilih jemput.
                                        </p>
                                    </div>
                                </div>

                                <div className="chat-step">
                                    <span className="chat-step-number">
                                        03
                                    </span>
                                    <div>
                                        <strong>Periksa ringkasan</strong>
                                        <p>
                                            Cek layanan, jumlah, dan estimasi
                                            biaya sebelum konfirmasi.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="chat-side-card">
                            <span className="section-label">CONTOH</span>
                            <h2>
                                Tulis dengan <em>Bebas.</em>
                            </h2>
                            <p>
                                Gunakan bahasa sehari-hari. Contoh pesan yang
                                bisa kamu coba:
                            </p>

                            <ul className="chat-side-list">
                                <li>
                                    "Cuci dan setrika 3 kg, dijemput sore ini."
                                </li>
                                <li>
                                    "Cuci sepatu 2 pasang, antar sendiri ke
                                    outlet."
                                </li>
                                <li>"Bed cover 1 pcs, mau dijemput."</li>
                            </ul>
                        </div>

                        <div className="chat-side-card chat-side-cta">
                            <span className="section-label light-label">
                                ALTERNATIF
                            </span>
                            <h2>Lebih suka isi formulir?</h2>
                            <p>
                                Gunakan halaman Pesan Manual jika kamu ingin
                                mengisi detail pesanan langkah demi langkah.
                            </p>

                            <Link
                                href={route('pelanggan.pesan')}
                                className="btn"
                            >
                                Pesan Manual <span>→</span>
                            </Link>
                        </div>
                    </aside>
                </div>
            </section>

            {toast && (
                <div className="chat-toast" role="status">
                    <span>✓</span>
                    {toast}
                </div>
            )}
        </CleanoraLayout>
    );
}
