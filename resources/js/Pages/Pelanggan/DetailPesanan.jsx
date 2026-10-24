import '../../../css/detail-pesanan.css';

import CleanoraLayout from '@/Layouts/CleanoraLayout';
import { Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const rupiah = (value) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`;

const ACCOUNT = {
    bank: 'BCA',
    number: '1234567890',
    holder: 'Cleanora Laundry',
};

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const formatFileSize = (bytes) => {
    if (bytes < 1024 * 1024) {
        return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const DEMO_ORDER = {
    number: 'LDR-20261024-0001',
    customer: {
        name: 'Ayu Lestari',
        phone: '0812-3456-7890',
    },
    source: 'Pesan Manual',
    status: 'Menunggu pembayaran',
    statusTone: 'warning',
    paymentStatus: 'Belum dibayar',
    paymentTone: 'warning',
    createdAt: '24 Oktober 2026, 08.15 WIB',
    updatedAt: '25 Oktober 2026, 09.10 WIB',
    invoiceDate: '25 Oktober 2026',
    method: 'Dijemput & diantar',
    schedule: 'Sabtu, 24 Oktober 2026 · 09.00–10.00',
    location: 'Jl. Melati No. 12, Bandung',
    estimatedWeight: '3,5 kg',
    actualWeight: '4 kg',
    estimatedPrice: 28000,
    subtotal: 32000,
    deliveryFee: 0,
    total: 32000,
    items: [
        {
            name: 'Cuci dan Setrika',
            note: 'Pakaian harian',
            quantity: '4 kg',
            unitPrice: 8000,
            total: 32000,
        },
    ],
    nextStep:
        'Unggah bukti transfer agar admin dapat memverifikasi pembayaran dan cucian segera diproses.',
    note: 'Harga final dihitung dari berat aktual setelah penimbangan. Estimasi awal tetap disimpan sebagai pembanding.',
};

function StatusBadge({ tone = 'primary', children }) {
    return (
        <span className={`detail-badge detail-badge--${tone}`}>{children}</span>
    );
}

function OverviewCard({ order }) {
    return (
        <div className="detail-card overview-card">
            <div className="overview-head">
                <div>
                    <span className="section-label">STATUS PESANAN</span>
                    <h2>{order.status}</h2>
                    <p>{order.nextStep}</p>
                </div>

                <div className="overview-badges">
                    <StatusBadge tone={order.statusTone}>
                        {order.status}
                    </StatusBadge>
                    <StatusBadge tone={order.paymentTone}>
                        {order.paymentStatus}
                    </StatusBadge>
                </div>
            </div>

            <div className="overview-grid">
                <div className="overview-item">
                    <span>Pelanggan</span>
                    <strong>{order.customer.name}</strong>
                    <small>{order.customer.phone}</small>
                </div>
                <div className="overview-item">
                    <span>Sumber pesanan</span>
                    <strong>{order.source}</strong>
                    <small>Dibuat {order.createdAt}</small>
                </div>
                <div className="overview-item">
                    <span>Metode</span>
                    <strong>{order.method}</strong>
                    <small>{order.schedule}</small>
                </div>
                <div className="overview-item">
                    <span>Lokasi</span>
                    <strong>{order.location}</strong>
                    <small>Diperbarui {order.updatedAt}</small>
                </div>
            </div>

            {order.paymentStatus !== 'Lunas' && (
                <a href="#pembayaran" className="btn btn-primary overview-cta">
                    Selesaikan pembayaran <span aria-hidden="true">→</span>
                </a>
            )}
        </div>
    );
}

function InvoiceCard({ order }) {
    return (
        <div className="detail-card invoice-card" id="nota">
            <div className="invoice-toolbar">
                <span className="section-label">NOTA LAUNDRY</span>
                <button
                    type="button"
                    className="invoice-print"
                    onClick={() => window.print()}
                >
                    Cetak nota <span aria-hidden="true">↗</span>
                </button>
            </div>

            <div className="invoice-sheet">
                <div className="invoice-head">
                    <div className="invoice-brand">
                        <span className="invoice-brand-icon" aria-hidden="true">
                            ✦
                        </span>
                        <div>
                            <strong>Cleanora</strong>
                            <small>Laundry &amp; Care</small>
                        </div>
                    </div>

                    <div className="invoice-meta">
                        <span>Nomor nota</span>
                        <strong>{order.number}</strong>
                        <small>Diterbitkan {order.invoiceDate}</small>
                    </div>
                </div>

                <div className="invoice-parties">
                    <div className="invoice-party">
                        <span>Ditagihkan kepada</span>
                        <strong>{order.customer.name}</strong>
                        <small>{order.customer.phone}</small>
                    </div>
                    <div className="invoice-party">
                        <span>Penyerahan</span>
                        <strong>{order.method}</strong>
                        <small>{order.schedule}</small>
                        <small>{order.location}</small>
                    </div>
                    <div className="invoice-party">
                        <span>Status pembayaran</span>
                        <StatusBadge tone={order.paymentTone}>
                            {order.paymentStatus}
                        </StatusBadge>
                        <small>Status pesanan: {order.status}</small>
                    </div>
                </div>

                <div className="invoice-table-wrap">
                    <table className="invoice-table">
                        <thead>
                            <tr>
                                <th scope="col">Layanan</th>
                                <th scope="col">Jumlah</th>
                                <th scope="col">Harga</th>
                                <th scope="col">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items.map((item) => (
                                <tr key={item.name}>
                                    <td
                                        data-label="Layanan"
                                        className="invoice-item-name"
                                    >
                                        <strong>{item.name}</strong>
                                        <small>{item.note}</small>
                                    </td>
                                    <td data-label="Jumlah">{item.quantity}</td>
                                    <td data-label="Harga">
                                        {rupiah(item.unitPrice)}
                                    </td>
                                    <td data-label="Subtotal">
                                        <strong>{rupiah(item.total)}</strong>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="invoice-bottom">
                    <div className="invoice-note">
                        <span className="invoice-note-icon" aria-hidden="true">
                            ✧
                        </span>
                        <div>
                            <strong>Catatan</strong>
                            <p>{order.note}</p>
                        </div>
                    </div>

                    <div className="invoice-totals">
                        <div className="invoice-total-row">
                            <span>Subtotal layanan</span>
                            <strong>{rupiah(order.subtotal)}</strong>
                        </div>
                        <div className="invoice-total-row">
                            <span>Biaya antar</span>
                            <strong>
                                {order.deliveryFee === 0
                                    ? 'Gratis'
                                    : rupiah(order.deliveryFee)}
                            </strong>
                        </div>
                        <div className="invoice-total-row invoice-grand">
                            <span>Total final</span>
                            <strong>{rupiah(order.total)}</strong>
                        </div>
                        <div className="invoice-total-row invoice-estimate">
                            <span>
                                Estimasi awal · {order.estimatedWeight}
                            </span>
                            <span>{rupiah(order.estimatedPrice)}</span>
                        </div>
                    </div>
                </div>

                <div className="invoice-footer">
                    <p>
                        Terima kasih sudah mempercayakan cucianmu kepada
                        Cleanora.
                    </p>
                    <span>Cleanora · Laundry &amp; Care</span>
                </div>
            </div>
        </div>
    );
}

function PaymentCard({ order }) {
    const [file, setFile] = useState(null);
    const [fileError, setFileError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [copied, setCopied] = useState(false);
    const [copyStatus, setCopyStatus] = useState('');

    const previewUrl = useMemo(() => {
        if (!file || !file.type.startsWith('image/')) {
            return null;
        }

        return URL.createObjectURL(file);
    }, [file]);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const acceptFile = (selected) => {
        if (!selected) {
            return;
        }

        if (!ALLOWED_TYPES.includes(selected.type)) {
            setFile(null);
            setFileError('Format file harus JPG, PNG, atau PDF.');

            return;
        }

        if (selected.size > MAX_FILE_SIZE) {
            setFile(null);
            setFileError(
                'Ukuran file maksimal 2 MB. Pilih file yang lebih kecil.',
            );

            return;
        }

        setFileError('');
        setFile(selected);
        setSubmitted(false);
    };

    const handleFileChange = (event) => {
        acceptFile(event.target.files?.[0]);
        event.target.value = '';
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setIsDragging(false);
        acceptFile(event.dataTransfer.files?.[0]);
    };

    const handleRemove = () => {
        setFile(null);
        setFileError('');
        setSubmitted(false);
    };

    const handleSubmitProof = () => {
        if (!file) {
            setFileError('Pilih file bukti transfer terlebih dahulu.');

            return;
        }

        setFileError('');
        setSubmitted(true);
    };

    const handleReplace = () => {
        setFile(null);
        setSubmitted(false);
        setFileError('');
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(ACCOUNT.number);
            setCopied(true);
            setCopyStatus('Nomor rekening disalin.');
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopyStatus(`Salin manual: ${ACCOUNT.number}`);
        }
    };

    return (
        <div className="detail-card payment-card" id="pembayaran">
            <div className="payment-head">
                <span className="section-label">PEMBAYARAN</span>
                <StatusBadge tone={order.paymentTone}>
                    {order.paymentStatus}
                </StatusBadge>
            </div>

            <h2>Selesaikan pembayaran.</h2>
            <p>
                Nota final sudah diterbitkan. Transfer sesuai total, lalu unggah
                bukti agar admin dapat memverifikasi.
            </p>

            <div className="payment-amount">
                <span>Total final</span>
                <strong>{rupiah(order.total)}</strong>
                <small>
                    Estimasi awal {rupiah(order.estimatedPrice)} · berat aktual{' '}
                    {order.actualWeight}
                </small>
            </div>

            <div className="bank-box">
                <div className="bank-head">
                    <span>Transfer ke</span>
                    <span className="bank-badge">{ACCOUNT.bank}</span>
                </div>
                <div className="bank-row">
                    <div>
                        <strong>{ACCOUNT.number}</strong>
                        <small>a.n. {ACCOUNT.holder}</small>
                    </div>
                    <button
                        type="button"
                        className="bank-copy"
                        onClick={handleCopy}
                    >
                        {copied ? 'Tersalin ✓' : 'Salin'}
                    </button>
                </div>
                <small className="bank-note">
                    Rekening contoh untuk simulasi.
                </small>
                {copyStatus && (
                    <small className="bank-copy-status" role="status">
                        {copyStatus}
                    </small>
                )}
            </div>

            <div className="payment-divider">Unggah bukti</div>

            {submitted ? (
                <div className="upload-success" role="status">
                    <span className="upload-success-icon" aria-hidden="true">
                        ✓
                    </span>
                    <div>
                        <strong>Bukti transfer terkirim.</strong>
                        <p>
                            Admin akan memverifikasi maksimal 1×24 jam. Status
                            pembayaran diperbarui setelah bukti dicek.
                        </p>
                        <button
                            type="button"
                            className="upload-replace"
                            onClick={handleReplace}
                        >
                            Ganti bukti transfer
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <span className="upload-title">Bukti transfer</span>
                    <label
                        htmlFor="proof-upload"
                        className={[
                            'upload-zone',
                            isDragging ? 'is-dragging' : '',
                            file ? 'has-file' : '',
                        ]
                            .filter(Boolean)
                            .join(' ')}
                        onDragOver={(event) => {
                            event.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                    >
                        <input
                            id="proof-upload"
                            type="file"
                            className="upload-input"
                            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                            onChange={handleFileChange}
                        />

                        {file ? (
                            <div className="upload-selected">
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="Pratinjau bukti transfer"
                                    />
                                ) : (
                                    <span className="upload-file-icon">
                                        PDF
                                    </span>
                                )}
                                <div className="upload-file-info">
                                    <strong>{file.name}</strong>
                                    <small>
                                        {formatFileSize(file.size)} · Siap
                                        dikirim
                                    </small>
                                </div>
                                <button
                                    type="button"
                                    className="upload-remove"
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        handleRemove();
                                    }}
                                >
                                    Hapus
                                </button>
                            </div>
                        ) : (
                            <div className="upload-placeholder">
                                <span
                                    className="upload-icon"
                                    aria-hidden="true"
                                >
                                    ↑
                                </span>
                                <strong>Pilih file atau seret ke sini</strong>
                                <small>JPG, PNG, atau PDF · maksimal 2 MB</small>
                            </div>
                        )}
                    </label>

                    {fileError && (
                        <p className="upload-error" role="alert">
                            {fileError}
                        </p>
                    )}

                    <button
                        type="button"
                        className="btn btn-primary payment-submit"
                        onClick={handleSubmitProof}
                    >
                        Kirim bukti transfer <span aria-hidden="true">→</span>
                    </button>

                    <p className="upload-note">
                        Tahap pengembangan: file belum benar-benar diunggah ke
                        server.
                    </p>
                </>
            )}
        </div>
    );
}

function ActionsCard() {
    return (
        <div className="detail-card actions-card">
            <span className="section-label">AKSI CEPAT</span>
            <h2>Lanjutkan pesanan.</h2>

            <div className="detail-action-list">
                <Link
                    href={route('pelanggan.lacak-pesanan')}
                    className="detail-action-item"
                >
                    <span>Lacak pesanan</span>
                    <span>→</span>
                </Link>
                <Link
                    href={route('pelanggan.pesan')}
                    className="detail-action-item"
                >
                    <span>Pesan lagi</span>
                    <span>→</span>
                </Link>
                <Link
                    href={route('pelanggan.chatbot')}
                    className="detail-action-item"
                >
                    <span>Tanya chatbot</span>
                    <span>→</span>
                </Link>
            </div>
        </div>
    );
}

function DetailHero({ order }) {
    return (
        <section className="detail-hero">
            <div className="container detail-hero-content">
                <div className="breadcrumb">
                    <Link href={route('pelanggan.dashboard')}>Beranda</Link>
                    <span aria-hidden="true">/</span>
                    <Link href={route('pelanggan.lacak-pesanan')}>
                        Lacak Pesanan
                    </Link>
                    <span aria-hidden="true">/</span>
                    <span>Detail Pesanan</span>
                </div>

                <span className="section-label">DETAIL PESANAN</span>
                <h1>
                    Nota dan Status <em>Pesananmu.</em>
                </h1>
                <p>
                    Periksa rincian biaya, status pembayaran, dan bukti transfer
                    dalam satu tempat.
                </p>

                <div className="detail-order-strip">
                    <div>
                        <span>Nomor pesanan</span>
                        <strong>{order.number}</strong>
                    </div>
                    <div className="detail-order-badges">
                        <StatusBadge tone={order.statusTone}>
                            {order.status}
                        </StatusBadge>
                        <StatusBadge tone={order.paymentTone}>
                            {order.paymentStatus}
                        </StatusBadge>
                    </div>
                </div>
            </div>

            <span className="detail-hero-decoration" aria-hidden="true">
                ✦
            </span>
        </section>
    );
}

export default function DetailPesanan({ nomorPesanan }) {
    const normalizedNumber = String(nomorPesanan ?? '').toUpperCase();
    const order =
        normalizedNumber === DEMO_ORDER.number ? DEMO_ORDER : null;

    if (!order) {
        return (
            <CleanoraLayout
                title="Detail Pesanan — Cleanora"
                active="lacak"
                pageClassName="cleanora-detail-page"
            >
                <section className="detail-hero">
                    <div className="container detail-hero-content">
                        <div className="breadcrumb">
                            <Link href={route('pelanggan.dashboard')}>
                                Beranda
                            </Link>
                            <span aria-hidden="true">/</span>
                            <Link href={route('pelanggan.lacak-pesanan')}>
                                Lacak Pesanan
                            </Link>
                            <span aria-hidden="true">/</span>
                            <span>Detail Pesanan</span>
                        </div>

                        <span className="section-label">DETAIL PESANAN</span>
                        <h1>
                            Nota dan Status <em>Pesananmu.</em>
                        </h1>
                        <p>
                            Periksa rincian biaya, status pembayaran, dan bukti
                            transfer dalam satu tempat.
                        </p>
                    </div>
                </section>

                <section className="detail-section">
                    <div className="container">
                        <div className="detail-card detail-missing">
                            <div
                                className="detail-missing-icon"
                                aria-hidden="true"
                            >
                                ?
                            </div>
                            <h2>Pesanan tidak ditemukan.</h2>
                            <p>
                                Nomor pesanan <strong>{normalizedNumber}</strong>{' '}
                                tidak cocok dengan data mana pun. Periksa kembali
                                nomor dari nota atau pesan konfirmasi.
                            </p>
                            <div className="detail-missing-actions">
                                <Link
                                    href={route('pelanggan.lacak-pesanan')}
                                    className="btn btn-primary"
                                >
                                    Lacak pesanan
                                </Link>
                                <Link
                                    href={route(
                                        'pelanggan.pesanan.detail',
                                        DEMO_ORDER.number,
                                    )}
                                    className="btn btn-outline"
                                >
                                    Gunakan contoh pesanan
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </CleanoraLayout>
        );
    }

    return (
        <CleanoraLayout
            title={`${order.number} — Cleanora`}
            active="lacak"
            pageClassName="cleanora-detail-page"
        >
            <DetailHero order={order} />

            <section className="detail-section">
                <div className="container">
                    <div className="detail-layout">
                        <div className="detail-main">
                            <OverviewCard order={order} />
                            <InvoiceCard order={order} />
                        </div>

                        <aside className="detail-aside">
                            <PaymentCard order={order} />
                            <ActionsCard />
                        </aside>
                    </div>
                </div>
            </section>
        </CleanoraLayout>
    );
}
