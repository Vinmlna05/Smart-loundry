import '../../../css/lacak-pesanan.css';

import CleanoraLayout from '@/Layouts/CleanoraLayout';
import { Link } from '@inertiajs/react';
import { useRef, useState } from 'react';

const rupiah = (value) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`;

const DEMO_ORDER = {
    number: 'LDR-20261024-0001',
    phone: '081234567890',
    customerName: 'Ayu',
    service: 'Cuci dan Setrika',
    weight: '4 kg',
    price: 32000,
    status: 'Menunggu pembayaran',
    statusTone: 'warning',
    payment: 'Belum dibayar',
    paymentTone: 'warning',
    method: 'Dijemput & diantar',
    schedule: 'Sabtu, 24 Oktober 2026 · 09.00–10.00',
    updatedAt: '25 Oktober 2026, 09.10 WIB',
    progress: 3,
    totalSteps: 7,
    steps: [
        {
            state: 'done',
            title: 'Pesanan dikonfirmasi',
            time: '24 Okt 2026 · 08.15',
            description:
                'Pesanan LDR-20261024-0001 diterima dan masuk antrean penjemputan.',
        },
        {
            state: 'done',
            title: 'Cucian diterima dan ditimbang',
            time: '24 Okt 2026 · 09.40',
            description:
                'Berat aktual 4 kg. Biaya final Rp32.000 sudah dihitung.',
        },
        {
            state: 'current',
            title: 'Menunggu pembayaran',
            time: '25 Okt 2026 · 09.10',
            description:
                'Nota dan instruksi pembayaran sudah dikirim ke WhatsApp-mu. Unggah bukti transfer di halaman detail pesanan.',
        },
        {
            state: 'upcoming',
            title: 'Pembayaran lunas',
            time: 'Menunggu verifikasi',
            description:
                'Status diperbarui setelah admin memverifikasi bukti transfer.',
        },
        {
            state: 'upcoming',
            title: 'Cucian diproses',
            time: 'Belum dimulai',
            description:
                'Cucian masuk proses pencucian dan penyetrikaan setelah lunas.',
        },
        {
            state: 'upcoming',
            title: 'Dalam pengantaran',
            time: 'Belum dijadwalkan',
            description:
                'Kurir mengantar cucian ke alamat setelah proses selesai.',
        },
        {
            state: 'upcoming',
            title: 'Diterima pelanggan',
            time: 'Menunggu konfirmasi',
            description:
                'Status selesai tercatat setelah cucian kamu terima dengan baik.',
        },
    ],
};

const normalizePhone = (value) => {
    const digits = value.replace(/\D/g, '');

    if (digits.startsWith('62')) {
        return `0${digits.slice(2)}`;
    }

    if (digits.startsWith('8')) {
        return `0${digits}`;
    }

    return digits;
};

function StatusBadge({ tone = 'primary', children }) {
    return (
        <span className={`track-badge track-badge--${tone}`}>{children}</span>
    );
}

function SummaryCard({ order }) {
    return (
        <div className="track-card">
            <span className="section-label">RINGKASAN</span>
            <h2>Detail pesanan.</h2>
            <p>Data mengikuti pesanan yang tersimpan di sistem.</p>

            <div className="track-summary-list">
                <div className="track-summary-row">
                    <span>Layanan</span>
                    <strong>{order.service}</strong>
                </div>
                <div className="track-summary-row">
                    <span>Berat aktual</span>
                    <strong>{order.weight}</strong>
                </div>
                <div className="track-summary-row">
                    <span>Metode</span>
                    <strong>{order.method}</strong>
                </div>
                <div className="track-summary-row">
                    <span>Jadwal jemput</span>
                    <strong>{order.schedule}</strong>
                </div>
                <div className="track-summary-row">
                    <span>Pembayaran</span>
                    <StatusBadge tone={order.paymentTone}>
                        {order.payment}
                    </StatusBadge>
                </div>
            </div>

            <div className="track-total">
                <span>Total biaya</span>
                <strong>{rupiah(order.price)}</strong>
            </div>

            <Link
                href={route('pelanggan.pesanan.detail', order.number)}
                className="btn btn-primary track-detail-button"
            >
                Lihat detail dan nota <span aria-hidden="true">→</span>
            </Link>
        </div>
    );
}

function HelpCard() {
    return (
        <div className="track-card">
            <span className="section-label">BUTUH BANTUAN?</span>
            <h2>Sertakan nomor pesanan.</h2>
            <p>
                Saat menghubungi kami, sebutkan nomor pesanan agar pemeriksaan
                lebih cepat.
            </p>

            <div className="track-help-list">
                <Link
                    href={route('pelanggan.chatbot')}
                    className="track-help-item"
                >
                    <span>Tanya chatbot</span>
                    <span>→</span>
                </Link>
                <Link
                    href={route('pelanggan.pesan')}
                    className="track-help-item"
                >
                    <span>Pesan manual</span>
                    <span>→</span>
                </Link>
                <Link
                    href={route('pelanggan.layanan')}
                    className="track-help-item"
                >
                    <span>Layanan dan tarif</span>
                    <span>→</span>
                </Link>
            </div>
        </div>
    );
}

function LegendCard() {
    return (
        <div className="track-card">
            <span className="section-label">ARTI STATUS</span>
            <h2>Status pesanan.</h2>
            <p>Warna dan teks badge membantu membaca tahap cucian.</p>

            <div className="track-legend">
                <div className="track-legend-item">
                    <StatusBadge tone="success">Lunas</StatusBadge>
                    <small>Pembayaran diterima</small>
                </div>
                <div className="track-legend-item">
                    <StatusBadge tone="primary">Diproses</StatusBadge>
                    <small>Sedang dikerjakan</small>
                </div>
                <div className="track-legend-item">
                    <StatusBadge tone="warning">Menunggu</StatusBadge>
                    <small>Perlu tindakanmu</small>
                </div>
                <div className="track-legend-item">
                    <StatusBadge tone="danger">Dibatalkan</StatusBadge>
                    <small>Pesanan tidak lanjut</small>
                </div>
            </div>
        </div>
    );
}

function Guide() {
    return (
        <div className="track-guide">
            <span className="section-label">CARA MELACAK</span>
            <h2>
                Tiga Langkah yang <em>Mudah.</em>
            </h2>
            <p>
                Pelacakan memakai nomor pesanan dan nomor WhatsApp yang dipakai
                saat memesan. Tanpa keduanya, data pesanan tidak ditampilkan.
            </p>

            <div className="track-guide-grid">
                <div className="track-guide-item">
                    <div className="track-guide-num">1</div>
                    <strong>Siapkan nomor pesanan</strong>
                    <p>Contoh format: LDR-20261024-0001.</p>
                </div>
                <div className="track-guide-item">
                    <div className="track-guide-num">2</div>
                    <strong>Masukkan nomor WhatsApp</strong>
                    <p>Gunakan nomor yang sama saat pesanan dibuat.</p>
                </div>
                <div className="track-guide-item">
                    <div className="track-guide-num">3</div>
                    <strong>Lihat status terbaru</strong>
                    <p>Riwayat dari penjemputan sampai diterima.</p>
                </div>
            </div>

            <div className="track-guide-note">
                <span aria-hidden="true">✧</span>
                <span>
                    Tahap pengembangan: pelacakan nyata aktif setelah pesanan
                    tersimpan di backend. Untuk mencoba tampilan, gunakan
                    tombol contoh pelacakan di atas.
                </span>
            </div>
        </div>
    );
}

function TrackingResult({ order, onReset }) {
    const percentage = (order.progress / order.totalSteps) * 100;

    return (
        <div className="track-result">
            <div className="track-result-head">
                <div>
                    <span className="section-label">PESANAN DITEMUKAN</span>
                    <div className="track-number-row">
                        <h2>{order.number}</h2>
                        <StatusBadge tone={order.statusTone}>
                            {order.status}
                        </StatusBadge>
                    </div>
                    <p>
                        Atas nama {order.customerName} · Terakhir diperbarui{' '}
                        {order.updatedAt}
                    </p>
                </div>

                <button
                    type="button"
                    className="track-reset"
                    onClick={onReset}
                >
                    Lacak pesanan lain
                </button>
            </div>

            <div className="track-progress">
                <div className="track-progress-meta">
                    <span>Progres pesanan</span>
                    <strong>
                        {order.progress} dari {order.totalSteps} tahap
                    </strong>
                </div>
                <div
                    className="track-progress-bar"
                    role="progressbar"
                    aria-label="Progres pesanan"
                    aria-valuemin={0}
                    aria-valuemax={order.totalSteps}
                    aria-valuenow={order.progress}
                >
                    <span style={{ width: `${percentage}%` }} />
                </div>
            </div>

            <div className="track-timeline-wrap">
                <div className="track-timeline-head">
                    <h3>Riwayat status</h3>
                    <p>Diperbarui petugas setiap tahap selesai.</p>
                </div>

                <ol className="track-timeline">
                    {order.steps.map((step, index) => (
                        <li
                            key={step.title}
                            className={`track-step ${step.state}`}
                        >
                            <span className="track-marker" aria-hidden="true">
                                {step.state === 'done'
                                    ? '✓'
                                    : step.state === 'current'
                                      ? '•'
                                      : index + 1}
                            </span>
                            <div className="track-step-body">
                                <div className="track-step-head">
                                    <strong>{step.title}</strong>
                                    <span>{step.time}</span>
                                </div>
                                <p>{step.description}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
}

export default function LacakPesanan() {
    const [orderNumber, setOrderNumber] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState('');

    const formRef = useRef(null);
    const orderInputRef = useRef(null);
    const resultsRef = useRef(null);

    const revealResults = () => {
        window.setTimeout(() => {
            const reduceMotion = window.matchMedia(
                '(prefers-reduced-motion: reduce)',
            ).matches;

            resultsRef.current?.scrollIntoView({
                behavior: reduceMotion ? 'auto' : 'smooth',
                block: 'start',
            });
        }, 60);
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const normalizedOrder = orderNumber.trim().toUpperCase();
        const normalizedPhone = normalizePhone(phoneNumber);

        if (!normalizedOrder || normalizedPhone.length < 9) {
            setError(
                'Lengkapi nomor pesanan dan nomor WhatsApp yang valid, lalu coba lagi.',
            );
            setStatus('idle');

            return;
        }

        setError('');
        setStatus(
            normalizedOrder === DEMO_ORDER.number &&
                normalizedPhone === DEMO_ORDER.phone
                ? 'found'
                : 'missing',
        );
        revealResults();
    };

    const handleDemo = () => {
        setOrderNumber(DEMO_ORDER.number);
        setPhoneNumber(DEMO_ORDER.phone);
        setError('');
        setStatus('found');
        revealResults();
    };

    const handleReset = () => {
        setStatus('idle');
        setError('');
        setOrderNumber('');
        setPhoneNumber('');
        orderInputRef.current?.focus();
    };

    const handleRetry = () => {
        setStatus('idle');
        setError('');
        formRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        });
        orderInputRef.current?.focus();
    };

    return (
        <CleanoraLayout
            title="Lacak Pesanan — Cleanora"
            active="lacak"
            pageClassName="cleanora-track-page"
        >
            <section className="track-hero">
                <div className="container track-hero-content">
                    <nav className="breadcrumb" aria-label="Breadcrumb">
                        <Link href={route('pelanggan.dashboard')}>
                            Beranda
                        </Link>
                        <span aria-hidden="true">/</span>
                        <span>Lacak Pesanan</span>
                    </nav>

                    <span className="section-label">LACAK PESANAN</span>
                    <h1>
                        Pantau Cucianmu,
                        <br />
                        <em>Tanpa Ragu.</em>
                    </h1>
                    <p>
                        Masukkan nomor pesanan dan nomor WhatsApp untuk melihat
                        posisi cucian, mulai dari penjemputan sampai diterima
                        kembali.
                    </p>

                    <div className="track-hero-badges">
                        <span>Riwayat tiap tahap</span>
                        <span>Status diperbarui petugas</span>
                        <span>Akses dengan nomor pesanan</span>
                    </div>
                </div>

                <span className="track-hero-decoration" aria-hidden="true">
                    ✧
                </span>
            </section>

            <section className="track-section">
                <div className="container">
                    <div className="track-search" ref={formRef}>
                        <div className="track-search-head">
                            <div>
                                <span className="section-label">
                                    MULAI PELACAKAN
                                </span>
                                <h2>
                                    Cek Status <em>Cucianmu.</em>
                                </h2>
                                <p>
                                    Nomor pesanan ada di nota atau pesan
                                    konfirmasi yang kamu terima.
                                </p>
                            </div>
                        </div>

                        <form className="track-form" onSubmit={handleSubmit}>
                            <div className="track-field">
                                <label htmlFor="order-number">
                                    Nomor pesanan
                                </label>
                                <input
                                    id="order-number"
                                    ref={orderInputRef}
                                    type="text"
                                    value={orderNumber}
                                    onChange={(event) =>
                                        setOrderNumber(
                                            event.target.value.toUpperCase(),
                                        )
                                    }
                                    placeholder="Contoh: LDR-20261024-0001"
                                    maxLength={30}
                                    autoComplete="off"
                                    aria-invalid={Boolean(error)}
                                    aria-describedby={
                                        error ? 'track-error' : undefined
                                    }
                                />
                            </div>

                            <div className="track-field">
                                <label htmlFor="phone-number">
                                    Nomor WhatsApp
                                </label>
                                <input
                                    id="phone-number"
                                    type="tel"
                                    inputMode="tel"
                                    value={phoneNumber}
                                    onChange={(event) =>
                                        setPhoneNumber(event.target.value)
                                    }
                                    placeholder="Contoh: 081234567890"
                                    maxLength={20}
                                    autoComplete="tel"
                                    aria-invalid={Boolean(error)}
                                    aria-describedby={
                                        error ? 'track-error' : undefined
                                    }
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary track-submit"
                            >
                                Lacak Pesanan <span aria-hidden="true">→</span>
                            </button>
                        </form>

                        {error && (
                            <div
                                className="track-error"
                                id="track-error"
                                role="alert"
                            >
                                <span aria-hidden="true">!</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="track-search-foot">
                            <button
                                type="button"
                                className="track-demo"
                                onClick={handleDemo}
                            >
                                Coba contoh pelacakan →
                            </button>
                            <span className="track-search-note">
                                Tahap pengembangan · data pelacakan masih
                                simulasi.
                            </span>
                        </div>
                    </div>

                    <div className="track-results" ref={resultsRef}>
                        <div className="track-layout">
                            <div className="track-main">
                                {status === 'found' && (
                                    <TrackingResult
                                        order={DEMO_ORDER}
                                        onReset={handleReset}
                                    />
                                )}

                                {status === 'missing' && (
                                    <div className="track-missing">
                                        <div
                                            className="track-missing-icon"
                                            aria-hidden="true"
                                        >
                                            ?
                                        </div>
                                        <h2>Pesanan tidak ditemukan.</h2>
                                        <p>
                                            Periksa kembali nomor pesanan dan
                                            nomor WhatsApp. Pastikan keduanya
                                            sama dengan yang dipakai saat
                                            memesan, lalu coba lagi.
                                        </p>
                                        <div className="track-missing-actions">
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                onClick={handleRetry}
                                            >
                                                Coba lagi
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-outline"
                                                onClick={handleDemo}
                                            >
                                                Gunakan contoh
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {status === 'idle' && <Guide />}
                            </div>

                            <aside className="track-aside">
                                {status === 'found' ? (
                                    <>
                                        <SummaryCard order={DEMO_ORDER} />
                                        <HelpCard />
                                    </>
                                ) : (
                                    <>
                                        <LegendCard />
                                        <HelpCard />
                                    </>
                                )}
                            </aside>
                        </div>
                    </div>
                </div>
            </section>
        </CleanoraLayout>
    );
}
