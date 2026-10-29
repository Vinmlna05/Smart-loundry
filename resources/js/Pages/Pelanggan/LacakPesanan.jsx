import '../../../css/lacak-pesanan.css';

import CleanoraLayout from '@/Layouts/CleanoraLayout';
import { Link, router, useForm } from '@inertiajs/react';
import { useRef } from 'react';

const rupiah = (value) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`;

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
                    <span>Berat / jumlah</span>
                    <strong>{order.weight}</strong>
                </div>
                <div className="track-summary-row">
                    <span>Metode</span>
                    <strong>{order.method}</strong>
                </div>
                <div className="track-summary-row">
                    <span>Jadwal penyerahan</span>
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
                    Nomor pesanan tampil setelah pesanan dikonfirmasi. Simpan
                    nomor tersebut beserta nomor WhatsApp yang kamu pakai saat
                    memesan.
                </span>
            </div>
        </div>
    );
}

function TrackingResult({ order, onReset }) {
    const percentage = order.totalSteps
        ? (order.progress / order.totalSteps) * 100
        : 0;

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
                            key={`${step.title}-${index}`}
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

function OrdersCard({ orders = [] }) {
    return (
        <section className="track-orders" aria-labelledby="track-orders-title">
            <div className="track-orders-head">
                <div>
                    <span className="section-label">DAFTAR PESANAN</span>
                    <h2 id="track-orders-title">
                        Semua Pesanan <em>Kamu.</em>
                    </h2>
                    <p>
                        Nomor pesanan di bawah bisa langsung dipakai pada
                        formulir pelacakan di atas.
                    </p>
                </div>
                <span className="track-orders-count">
                    {orders.length} pesanan
                </span>
            </div>

            <div className="track-orders-table-wrap">
                <table className="track-orders-table">
                    <thead>
                        <tr>
                            <th scope="col">Nomor pesanan</th>
                            <th scope="col">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={2} className="track-orders-empty">
                                    <span aria-hidden="true">✧</span>
                                    Belum ada pesanan. Pesanan yang kamu buat
                                    akan muncul di sini.
                                </td>
                            </tr>
                        ) : (
                            orders.map((item) => (
                                <tr key={item.number}>
                                    <td>
                                        <span className="track-order-number">
                                            <span
                                                className="track-order-icon"
                                                aria-hidden="true"
                                            >
                                                ✦
                                            </span>
                                            {item.number}
                                        </span>
                                    </td>
                                    <td>
                                        <StatusBadge tone={item.tone}>
                                            {item.status}
                                        </StatusBadge>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

export default function LacakPesanan({
    order = null,
    searched = false,
    orders = [],
    lookup = {},
}) {
    const formRef = useRef(null);
    const orderInputRef = useRef(null);
    const resultsRef = useRef(null);

    const { data, setData, post, processing, errors, clearErrors } = useForm({
        order_number: lookup.order_number ?? '',
        whatsapp: lookup.whatsapp ?? '',
    });

    const status = order ? 'found' : searched ? 'missing' : 'idle';
    const errorMessage =
        errors.order_number || errors.whatsapp || '';

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

        post(route('pelanggan.lacak-pesanan.cari'), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => revealResults(),
            onError: () => {
                formRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            },
        });
    };

    const handleReset = () => {
        setData({ order_number: '', whatsapp: '' });
        clearErrors();

        router.get(
            route('pelanggan.lacak-pesanan'),
            {},
            { preserveScroll: true, preserveState: true },
        );

        orderInputRef.current?.focus();
    };

    const handleRetry = () => {
        clearErrors();
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
                                    value={data.order_number}
                                    onChange={(event) =>
                                        setData(
                                            'order_number',
                                            event.target.value.toUpperCase(),
                                        )
                                    }
                                    placeholder="Contoh: LDR-20261024-0001"
                                    maxLength={30}
                                    autoComplete="off"
                                    required
                                    aria-invalid={Boolean(errors.order_number)}
                                    aria-describedby={
                                        errorMessage ? 'track-error' : undefined
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
                                    value={data.whatsapp}
                                    onChange={(event) =>
                                        setData('whatsapp', event.target.value)
                                    }
                                    placeholder="Contoh: 081234567890"
                                    maxLength={20}
                                    autoComplete="tel"
                                    required
                                    aria-invalid={Boolean(errors.whatsapp)}
                                    aria-describedby={
                                        errorMessage ? 'track-error' : undefined
                                    }
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary track-submit"
                                disabled={processing}
                            >
                                {processing ? (
                                    'Mencari pesanan…'
                                ) : (
                                    <>
                                        Lacak Pesanan{' '}
                                        <span aria-hidden="true">→</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {errorMessage && (
                            <div
                                className="track-error"
                                id="track-error"
                                role="alert"
                            >
                                <span aria-hidden="true">!</span>
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        <div className="track-search-foot">
                            <span className="track-search-note">
                                Nomor pesanan dan nomor WhatsApp harus sama
                                dengan yang dipakai saat memesan.
                            </span>
                        </div>
                    </div>

                    <OrdersCard orders={orders} />

                    <div className="track-results" ref={resultsRef}>
                        <div className="track-layout">
                            <div className="track-main">
                                {status === 'found' && (
                                    <TrackingResult
                                        order={order}
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
                                            <Link
                                                href={route('pelanggan.pesan')}
                                                className="btn btn-outline"
                                            >
                                                Buat pesanan baru
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                {status === 'idle' && <Guide />}
                            </div>

                            <aside className="track-aside">
                                {status === 'found' ? (
                                    <>
                                        <SummaryCard order={order} />
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
