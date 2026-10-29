import '../../../css/chatbot.css';

import CleanoraLayout from '@/Layouts/CleanoraLayout';
import { Link, router } from '@inertiajs/react';
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

const methodLabel = (method) =>
    method === 'jemput' ? 'Dijemput' : 'Antar sendiri';

const createSessionToken = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
};

const csrfToken = () => {
    const metaToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content');

    if (metaToken) {
        return metaToken;
    }

    const cookie = document.cookie
        .split('; ')
        .find((item) => item.startsWith('XSRF-TOKEN='));

    if (!cookie) {
        return '';
    }

    return decodeURIComponent(cookie.split('=').slice(1).join('='));
};

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
        'Terjadi kesalahan. Coba lagi, ya.'
    );
};

const writeString = (view, offset, value) => {
    for (let index = 0; index < value.length; index += 1) {
        view.setUint8(offset + index, value.charCodeAt(index));
    }
};

const convertToWav = async (blob) => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;

        if (!AudioContext) {
            return blob;
        }

        const context = new AudioContext();
        const buffer = await context.decodeAudioData(
            await blob.arrayBuffer(),
        );
        const sampleRate = buffer.sampleRate;
        const length = buffer.length;
        const channels = buffer.numberOfChannels;
        const mono = new Float32Array(length);

        for (let channel = 0; channel < channels; channel += 1) {
            const data = buffer.getChannelData(channel);

            for (let index = 0; index < length; index += 1) {
                mono[index] += data[index] / channels;
            }
        }

        const wav = new ArrayBuffer(44 + length * 2);
        const view = new DataView(wav);

        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, 'data');
        view.setUint32(40, length * 2, true);

        let offset = 44;

        for (let index = 0; index < length; index += 1) {
            const sample = Math.max(-1, Math.min(1, mono[index]));
            view.setInt16(
                offset,
                sample < 0 ? sample * 0x8000 : sample * 0x7fff,
                true,
            );
            offset += 2;
        }

        await context.close();

        return new Blob([wav], { type: 'audio/wav' });
    } catch {
        return blob;
    }
};

export default function PelangganChatbot({
    settings = {
        enabled: true,
        botName: 'Nova',
        greeting:
            'Halo! Aku Nova, asisten Cleanora. Mau pesan laundry, cek tarif, atau tanya jadwal penjemputan?',
        maxAudioSeconds: 60,
    },
    services = [],
}) {
    const greet = useCallback(
        () => [
            {
                id: 'greeting',
                role: 'bot',
                time: timeLabel(),
                text: settings.greeting,
            },
        ],
        [settings.greeting],
    );

    const [messages, setMessages] = useState(greet);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordSeconds, setRecordSeconds] = useState(0);
    const [toast, setToast] = useState('');
    const [confirmingId, setConfirmingId] = useState(null);
    const [missingFields, setMissingFields] = useState([]);

    const idRef = useRef(100);
    const sessionTokenRef = useRef(createSessionToken());
    const recordSecondsRef = useRef(0);
    const messagesRef = useRef(null);
    const inputRef = useRef(null);
    const recorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const recordTimerRef = useRef(null);
    const maxTimerRef = useRef(null);
    const pendingAudioRef = useRef(null);

    const nextId = useCallback(() => {
        idRef.current += 1;

        return idRef.current;
    }, []);

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

        const timer = window.setTimeout(() => setToast(''), 4000);

        return () => window.clearTimeout(timer);
    }, [toast]);

    useEffect(
        () => () => {
            if (recordTimerRef.current) {
                window.clearInterval(recordTimerRef.current);
            }

            if (maxTimerRef.current) {
                window.clearTimeout(maxTimerRef.current);
            }

            if (recorderRef.current?.state === 'recording') {
                recorderRef.current.stop();
            }

            streamRef.current?.getTracks().forEach((track) => track.stop());
        },
        [],
    );

    const appendBotMessage = (payload) => {
        setMessages((previous) => [
            ...previous,
            {
                id: nextId(),
                role: 'bot',
                time: timeLabel(),
                text: payload.reply,
                summary: payload.summary,
                handoff: payload.handoff_to_manual,
            },
        ]);
    };

    const sendChat = async ({ message, audio, audioSeconds, audioMessageId }) => {
        const form = new FormData();
        const token = csrfToken();

        form.append('_token', token);
        form.append('session_token', sessionTokenRef.current);

        if (message) {
            form.append('message', message);
        }

        if (audio) {
            form.append('audio', audio, 'voice-note.wav');
        }

        if (audioSeconds) {
            form.append('audio_seconds', String(audioSeconds));
        }

        setIsTyping(true);

        try {
            const { data } = await window.axios.post(
                route('pelanggan.chatbot.pesan'),
                form,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-CSRF-TOKEN': token,
                        'X-XSRF-TOKEN': token,
                    },
                },
            );

            if (data.session_token) {
                sessionTokenRef.current = data.session_token;
            }

            if (audioMessageId && data.transcript) {
                setMessages((previous) =>
                    previous.map((item) =>
                        item.id === audioMessageId
                            ? { ...item, transcript: data.transcript }
                            : item,
                    ),
                );
            }

            setMissingFields(data.missing_fields ?? []);
            appendBotMessage(data);
        } catch (error) {
            appendBotMessage({
                reply: firstError(error),
                handoff: true,
            });
        } finally {
            setIsTyping(false);
            inputRef.current?.focus();
        }
    };

    const sendMessage = (value) => {
        const text = String(value ?? '').trim();

        if (!text || isTyping || isRecording || !settings.enabled) {
            return;
        }

        setMessages((previous) => [
            ...previous,
            { id: nextId(), role: 'user', time: timeLabel(), text },
        ]);
        setInput('');
        setMissingFields([]);
        sendChat({ message: text });
    };

    const restartConversation = () => {
        if (recorderRef.current?.state === 'recording') {
            recorderRef.current.stop();
        }

        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        if (recordTimerRef.current) {
            window.clearInterval(recordTimerRef.current);
            recordTimerRef.current = null;
        }

        if (maxTimerRef.current) {
            window.clearTimeout(maxTimerRef.current);
            maxTimerRef.current = null;
        }

        sessionTokenRef.current = createSessionToken();
        setMessages(greet());
        setInput('');
        setIsRecording(false);
        setRecordSeconds(0);
        recordSecondsRef.current = 0;
        setMissingFields([]);
        setIsTyping(false);
        setToast('Percakapan dimulai ulang');
    };

    const confirmOrder = async (message) => {
        if (!message.summary?.order || confirmingId) {
            return;
        }

        setConfirmingId(message.id);

        try {
            const token = csrfToken();
            const payload = { ...message.summary.order, _token: token };

            const { data } = await window.axios.post(
                route('pelanggan.chatbot.konfirmasi'),
                payload,
                {
                    headers: {
                        'X-CSRF-TOKEN': token,
                        'X-XSRF-TOKEN': token,
                    },
                },
            );

            setMessages((previous) =>
                previous.map((item) =>
                    item.id === message.id
                        ? { ...item, confirmed: true }
                        : item,
                ),
            );
            setToast('Pesanan dikonfirmasi');
            router.visit(data.redirect);
        } catch (error) {
            setToast(firstError(error));
        } finally {
            setConfirmingId(null);
        }
    };

    const editOrder = () => {
        setInput('Ubah data pesanan: ');
        inputRef.current?.focus();
    };

    const startRecording = async () => {
        if (isRecording || isTyping || !settings.enabled) {
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
            setToast('Browser ini belum mendukung rekaman suara.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            const mimeType = window.MediaRecorder.isTypeSupported(
                'audio/webm;codecs=opus',
            )
                ? 'audio/webm;codecs=opus'
                : '';

            const recorder = new window.MediaRecorder(
                stream,
                mimeType ? { mimeType } : undefined,
            );

            chunksRef.current = [];
            streamRef.current = stream;
            recorderRef.current = recorder;

            recorder.ondataavailable = (event) => {
                if (event.data?.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            recorder.onstop = async () => {
                if (recordTimerRef.current) {
                    window.clearInterval(recordTimerRef.current);
                    recordTimerRef.current = null;
                }

                if (maxTimerRef.current) {
                    window.clearTimeout(maxTimerRef.current);
                    maxTimerRef.current = null;
                }

                const duration = Math.max(recordSecondsRef.current, 1);
                const blob = new Blob(chunksRef.current, {
                    type: recorder.mimeType || 'audio/webm',
                });

                stream.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
                recorderRef.current = null;
                setIsRecording(false);
                setRecordSeconds(0);
                recordSecondsRef.current = 0;

                if (blob.size === 0) {
                    setToast('Rekaman kosong. Coba rekam lagi, ya.');
                    return;
                }

                const messageId = nextId();

                setMessages((previous) => [
                    ...previous,
                    {
                        id: messageId,
                        role: 'user',
                        time: timeLabel(),
                        voiceDuration: duration,
                    },
                ]);
                setMissingFields([]);

                const wav = await convertToWav(blob);
                pendingAudioRef.current = messageId;
                sendChat({
                    audio: wav,
                    audioSeconds: duration,
                    audioMessageId: messageId,
                });
            };

            recorder.start();
            setIsRecording(true);
            setRecordSeconds(0);
            recordSecondsRef.current = 0;
            recordTimerRef.current = window.setInterval(() => {
                recordSecondsRef.current += 1;
                setRecordSeconds(recordSecondsRef.current);
            }, 1000);
            maxTimerRef.current = window.setTimeout(
                () => {
                    if (recorderRef.current?.state === 'recording') {
                        recorderRef.current.stop();
                    }
                },
                Number(settings.maxAudioSeconds || 60) * 1000,
            );
        } catch {
            setToast(
                'Izin mikrofon ditolak. Aktifkan izin mikrofon lalu coba lagi.',
            );
        }
    };

    const finishRecording = () => {
        if (!isRecording) {
            return;
        }

        if (recorderRef.current?.state === 'recording') {
            recorderRef.current.stop();
        }
    };

    const quickReplies = useMemo(() => {
        if (isTyping || isRecording || !settings.enabled) {
            return [];
        }

        if (missingFields.includes('intake_method')) {
            return ['Dijemput', 'Antar sendiri'];
        }

        if (missingFields.includes('service_id')) {
            return services
                .slice(0, 3)
                .map(
                    (service) =>
                        `${service.name} ${service.min} ${service.unit}`,
                );
        }

        if (missingFields.includes('schedule_time')) {
            return ['08:00-10:00', '12:00-14:00', '16:00-18:00'];
        }

        if (missingFields.includes('schedule_date')) {
            return ['Hari ini', 'Besok'];
        }

        if (messages.length <= 1) {
            return [
                'Cuci dan setrika 3 kg',
                'Berapa tarif cuci?',
                'Bisa dijemput?',
            ];
        }

        return [];
    }, [
        isRecording,
        isTyping,
        messages.length,
        missingFields,
        services,
        settings.enabled,
    ]);

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
                            {settings.enabled ? 'Siap membantu' : 'Sedang nonaktif'}
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
                                <strong>{settings.botName || 'Cleanora Assistant'}</strong>
                                <small>
                                    <span className="status-dot"></span>
                                    {settings.enabled
                                        ? 'Online · Asisten laundry AI'
                                        : 'Offline · Gunakan Pesan Manual'}
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

                                        {message.transcript && (
                                            <p className="chat-transcript">
                                                “{message.transcript}”
                                            </p>
                                        )}

                                        {message.summary && (
                                            <div className="assistant-summary">
                                                <div className="assistant-summary-header">
                                                    <span>RINGKASAN PESANAN</span>
                                                    <span className="assistant-summary-badge">
                                                        {message.confirmed
                                                            ? 'Terkonfirmasi'
                                                            : 'Estimasi'}
                                                    </span>
                                                </div>

                                                <div className="assistant-summary-rows">
                                                    <div className="assistant-summary-row">
                                                        <span>Layanan</span>
                                                        <strong>
                                                            {message.summary.serviceName}
                                                        </strong>
                                                    </div>

                                                    <div className="assistant-summary-row">
                                                        <span>Jumlah</span>
                                                        <strong>
                                                            {message.summary.quantity}{' '}
                                                            {message.summary.unit}
                                                        </strong>
                                                    </div>

                                                    <div className="assistant-summary-row">
                                                        <span>Metode</span>
                                                        <strong>
                                                            {methodLabel(
                                                                message.summary.method,
                                                            )}
                                                        </strong>
                                                    </div>

                                                    {message.summary.address && (
                                                        <div className="assistant-summary-row">
                                                            <span>Alamat</span>
                                                            <strong>
                                                                {message.summary.address}
                                                            </strong>
                                                        </div>
                                                    )}

                                                    <div className="assistant-summary-row">
                                                        <span>Jadwal</span>
                                                        <strong>
                                                            {message.summary.scheduleLabel}{' '}
                                                            ·{' '}
                                                            {message.summary.scheduleTime}
                                                        </strong>
                                                    </div>

                                                    <div className="assistant-summary-row">
                                                        <span>Tarif</span>
                                                        <strong>
                                                            {rupiah(
                                                                message.summary.unitPrice,
                                                            )}
                                                            /{message.summary.unit}
                                                        </strong>
                                                    </div>
                                                </div>

                                                <div className="assistant-summary-total">
                                                    <div>
                                                        <span>Estimasi biaya</span>
                                                        <strong>
                                                            {rupiah(message.summary.total)}
                                                        </strong>
                                                    </div>
                                                    <small>
                                                        Estimasi ini dihitung dari tarif resmi layanan.
                                                        Harga final mengikuti berat aktual.
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
                                                            disabled={
                                                                confirmingId === message.id
                                                            }
                                                            onClick={() =>
                                                                confirmOrder(message)
                                                            }
                                                        >
                                                            {confirmingId === message.id
                                                                ? 'Menyimpan...'
                                                                : 'Konfirmasi pesanan'}
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

                                        {message.handoff && (
                                            <Link
                                                href={route('pelanggan.pesan')}
                                                className="chat-manual-link"
                                            >
                                                Buka Pesan Manual →
                                            </Link>
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
                                        {formatDuration(recordSeconds)} /{' '}
                                        {formatDuration(settings.maxAudioSeconds || 60)}
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
                                        placeholder={
                                            settings.enabled
                                                ? 'Tulis pesan untuk Cleanora Assistant...'
                                                : 'Chatbot sedang nonaktif'
                                        }
                                        maxLength={1000}
                                        aria-label="Tulis pesan"
                                        disabled={!settings.enabled || isTyping}
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
                                        disabled={isTyping || !settings.enabled}
                                    >
                                        ♫
                                    </button>
                                    <button
                                        type="button"
                                        className="chat-send"
                                        aria-label="Kirim pesan"
                                        onClick={() => sendMessage(input)}
                                        disabled={
                                            !input.trim() ||
                                            isTyping ||
                                            !settings.enabled
                                        }
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
                            <span className="section-label">CARA KERJA</span>
                            <h2>
                                Tiga Langkah <em>Sederhana.</em>
                            </h2>
                            <p>
                                Kamu tidak perlu menghafal menu. Cukup jawab
                                pertanyaan yang diberikan.
                            </p>

                            <div className="chat-steps">
                                <div className="chat-step">
                                    <span className="chat-step-number">01</span>
                                    <div>
                                        <strong>Ceritakan kebutuhanmu</strong>
                                        <p>
                                            Sapa asisten dan sebutkan layanan
                                            laundry yang kamu inginkan.
                                        </p>
                                    </div>
                                </div>

                                <div className="chat-step">
                                    <span className="chat-step-number">02</span>
                                    <div>
                                        <strong>Lengkapi detail pesanan</strong>
                                        <p>
                                            Tentukan jumlah, metode penyerahan,
                                            jadwal, dan alamat jika memilih jemput.
                                        </p>
                                    </div>
                                </div>

                                <div className="chat-step">
                                    <span className="chat-step-number">03</span>
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
                                    "Cuci dan setrika 3 kg, dijemput besok pagi."
                                </li>
                                <li>
                                    "Cuci sepatu 2 pasang, antar sendiri ke outlet."
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
