import '../../../css/pengusaha-pembayaran.css';

import AdminIcon from '@/Components/Pengusaha/AdminIcon';
import {
    adminPayments,
    formatTanggalWaktu,
    paymentStatusConfig,
} from '@/Data/adminPayments';
import {
    formatRupiah,
    initialsOf,
    whatsappLink,
} from '@/Data/adminOrders';
import PengusahaLayout from '@/Layouts/PengusahaLayout';
import { Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const PAGE_SIZE = 7;

const methodOptions = [
    'Transfer bank',
    'QRIS',
    'Tunai',
    'Belum ditagih',
];

const shortDate = (value) =>
    value
        ? new Intl.DateTimeFormat('id-ID', {
              day: 'numeric',
              month: 'short',
          }).format(new Date(value))
        : '-';

const methodLabel = (payment) =>
    payment.method === 'Belum ditagih'
        ? 'Belum ditagih'
        : `${payment.method} · ${payment.channel}`;

export default function PengusahaPembayaran() {
    const [paymentList, setPaymentList] = useState(adminPayments);
    const [statusFilter, setStatusFilter] = useState('all');
    const [methodFilter, setMethodFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [page, setPage] = useState(1);
    const [selectedPaymentId, setSelectedPaymentId] = useState(null);
    const [toast, setToast] = useState('');

    const statusCounts = useMemo(
        () =>
            paymentList.reduce((counts, payment) => {
                counts[payment.status] =
                    (counts[payment.status] ?? 0) + 1;

                return counts;
            }, {}),
        [paymentList],
    );

    const totalReceived = useMemo(
        () =>
            paymentList
                .filter((payment) => payment.status === 'Lunas')
                .reduce((total, payment) => total + payment.amount, 0),
        [paymentList],
    );

    const summaryItems = useMemo(
        () => [
            {
                key: 'all',
                label: 'Semua tagihan',
                value: paymentList.length,
                note: `${statusCounts['Belum ditagih'] ?? 0} belum ditagih`,
                icon: 'payments',
                tone: 'is-teal',
            },
            {
                key: 'Perlu konfirmasi',
                label: 'Perlu konfirmasi',
                value: statusCounts['Perlu konfirmasi'] ?? 0,
                note: 'Bukti transfer menunggu',
                icon: 'alert',
                tone: 'is-gold',
            },
            {
                key: 'Belum dibayar',
                label: 'Belum dibayar',
                value: statusCounts['Belum dibayar'] ?? 0,
                note: 'Belum ada bukti bayar',
                icon: 'orders',
                tone: 'is-blue',
            },
            {
                key: 'Lunas',
                label: 'Lunas',
                value: statusCounts.Lunas ?? 0,
                note: `${formatRupiah(totalReceived)} diterima`,
                icon: 'check',
                tone: 'is-green',
            },
        ],
        [paymentList.length, statusCounts, totalReceived],
    );

    const filteredPayments = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return paymentList
            .filter((payment) => {
                if (
                    statusFilter !== 'all' &&
                    payment.status !== statusFilter
                ) {
                    return false;
                }

                if (
                    methodFilter !== 'all' &&
                    payment.method !== methodFilter
                ) {
                    return false;
                }

                if (!keyword) {
                    return true;
                }

                return [
                    payment.invoiceNumber,
                    payment.orderId,
                    payment.customer,
                    payment.phone,
                    payment.service,
                    payment.method,
                    payment.channel,
                ].some((value) =>
                    String(value).toLowerCase().includes(keyword),
                );
            })
            .sort((first, second) => {
                if (sortBy === 'amount-desc') {
                    return second.amount - first.amount;
                }

                if (sortBy === 'amount-asc') {
                    return first.amount - second.amount;
                }

                if (sortBy === 'customer') {
                    return first.customer.localeCompare(
                        second.customer,
                        'id',
                    );
                }

                return (
                    new Date(second.issuedAt) -
                    new Date(first.issuedAt)
                );
            });
    }, [methodFilter, paymentList, search, sortBy, statusFilter]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredPayments.length / PAGE_SIZE),
    );
    const safePage = Math.min(page, totalPages);
    const firstIndex = (safePage - 1) * PAGE_SIZE;
    const visiblePayments = filteredPayments.slice(
        firstIndex,
        firstIndex + PAGE_SIZE,
    );
    const rangeStart =
        filteredPayments.length === 0 ? 0 : firstIndex + 1;
    const rangeEnd = Math.min(
        firstIndex + PAGE_SIZE,
        filteredPayments.length,
    );
    const selectedPayment =
        paymentList.find(
            (payment) => payment.id === selectedPaymentId,
        ) ?? null;

    const hasFilters =
        statusFilter !== 'all' ||
        methodFilter !== 'all' ||
        search !== '';

    useEffect(() => {
        setPage(1);
    }, [methodFilter, search, sortBy, statusFilter]);

    useEffect(() => {
        if (!toast) {
            return undefined;
        }

        const timeout = window.setTimeout(() => setToast(''), 3000);

        return () => window.clearTimeout(timeout);
    }, [toast]);

    useEffect(() => {
        if (!selectedPaymentId) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setSelectedPaymentId(null);
            }
        };

        document.body.classList.add('admin-drawer-open');
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.classList.remove('admin-drawer-open');
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedPaymentId]);

    const resetFilters = () => {
        setStatusFilter('all');
        setMethodFilter('all');
        setSearch('');
        setSortBy('newest');
        setPage(1);
    };

    const confirmPayment = (payment) => {
        const paidAt = new Date().toISOString();

        setPaymentList((previous) =>
            previous.map((item) =>
                item.id === payment.id
                    ? {
                          ...item,
                          status: 'Lunas',
                          paidAt,
                          confirmedBy: 'Pengusaha',
                      }
                    : item,
            ),
        );
        setToast(
            `Pembayaran ${payment.invoiceNumber} ditandai lunas pada pratinjau lokal.`,
        );
    };

    const downloadRecap = () => {
        if (filteredPayments.length === 0) {
            setToast('Tidak ada pembayaran yang bisa diunduh.');

            return;
        }

        const rows = [
            [
                'Nomor nota',
                'Nomor pesanan',
                'Tanggal nota',
                'Pelanggan',
                'WhatsApp',
                'Layanan',
                'Jumlah',
                'Status',
                'Metode',
                'Dibayar pada',
            ],
            ...filteredPayments.map((payment) => [
                payment.invoiceNumber,
                payment.orderId,
                formatTanggalWaktu(payment.issuedAt),
                payment.customer,
                payment.phone,
                payment.service,
                payment.amount,
                payment.status,
                methodLabel(payment),
                payment.paidAt
                    ? formatTanggalWaktu(payment.paidAt)
                    : '-',
            ]),
        ];

        const csv = rows
            .map((row) =>
                row
                    .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                    .join(','),
            )
            .join('\r\n');
        const blob = new Blob([`\uFEFF${csv}`], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `cleanora-pembayaran-${new Date()
            .toISOString()
            .slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);

        setToast(
            `${filteredPayments.length} tagihan berhasil diunduh.`,
        );
    };

    return (
        <PengusahaLayout
            title="Pembayaran & Nota - Cleanora"
            active="payments"
            breadcrumb="Pembayaran & nota"
        >
            <div className="admin-page-head">
                <div className="admin-page-heading">
                    <span className="admin-eyebrow">
                        <span aria-hidden="true">✦</span>
                        Keuangan
                    </span>
                    <h1>
                        Pembayaran &amp; <em>nota.</em>
                    </h1>
                    <p>
                        Periksa bukti transfer, konfirmasi pembayaran, dan
                        cetak nota pelanggan dari satu halaman.
                    </p>
                </div>

                <div className="admin-head-actions">
                    <span className="admin-sample-badge">
                        <span aria-hidden="true" />
                        Data contoh
                    </span>
                    <button
                        type="button"
                        className="admin-button admin-button-outline"
                        onClick={downloadRecap}
                    >
                        <AdminIcon name="download" size={16} />
                        Unduh rekap
                    </button>
                </div>
            </div>

            <section
                className="admin-order-summary"
                aria-label="Ringkasan pembayaran"
            >
                {summaryItems.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        className={`admin-queue-card ${item.tone}${
                            statusFilter === item.key ? ' is-active' : ''
                        }`}
                        aria-pressed={statusFilter === item.key}
                        onClick={() => setStatusFilter(item.key)}
                    >
                        <span className="admin-queue-icon">
                            <AdminIcon name={item.icon} size={19} />
                        </span>
                        <span className="admin-queue-content">
                            <span className="admin-queue-label">
                                {item.label}
                            </span>
                            <strong>{item.value}</strong>
                            <small>{item.note}</small>
                        </span>
                        <span className="admin-queue-arrow" aria-hidden="true">
                            <AdminIcon name="chevron" size={15} />
                        </span>
                    </button>
                ))}
            </section>

            <section className="admin-card admin-orders admin-payments-page">
                <div className="admin-card-head">
                    <div>
                        <span className="admin-card-label">
                            TAGIHAN &amp; NOTA
                        </span>
                        <h2>Daftar pembayaran</h2>
                        <p>
                            {statusCounts['Perlu konfirmasi'] ?? 0} bukti
                            menunggu konfirmasi dan{' '}
                            {statusCounts['Belum dibayar'] ?? 0} tagihan
                            belum dibayar.
                        </p>
                    </div>
                    <span className="admin-orders-count">
                        {filteredPayments.length} tagihan
                    </span>
                </div>

                <div className="admin-orders-toolbar admin-orders-toolbar-page">
                    <label className="admin-search admin-search-wide">
                        <AdminIcon name="search" size={16} />
                        <span className="sr-only">Cari pembayaran</span>
                        <input
                            type="search"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Cari nota, pesanan, atau pelanggan..."
                        />
                    </label>

                    <div className="admin-filter-group">
                        <label className="admin-select">
                            <span className="sr-only">Filter status</span>
                            <select
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(event.target.value)
                                }
                            >
                                <option value="all">Semua status</option>
                                {Object.keys(paymentStatusConfig).map(
                                    (status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ),
                                )}
                            </select>
                            <AdminIcon name="chevron" size={13} />
                        </label>

                        <label className="admin-select">
                            <span className="sr-only">Filter metode</span>
                            <select
                                value={methodFilter}
                                onChange={(event) =>
                                    setMethodFilter(event.target.value)
                                }
                            >
                                <option value="all">Semua metode</option>
                                {methodOptions.map((method) => (
                                    <option key={method} value={method}>
                                        {method}
                                    </option>
                                ))}
                            </select>
                            <AdminIcon name="chevron" size={13} />
                        </label>

                        <label className="admin-select">
                            <span className="sr-only">Urutkan pembayaran</span>
                            <select
                                value={sortBy}
                                onChange={(event) =>
                                    setSortBy(event.target.value)
                                }
                            >
                                <option value="newest">Terbaru</option>
                                <option value="amount-desc">
                                    Nominal terbesar
                                </option>
                                <option value="amount-asc">
                                    Nominal terkecil
                                </option>
                                <option value="customer">Nama A-Z</option>
                            </select>
                            <AdminIcon name="chevron" size={13} />
                        </label>

                        {hasFilters && (
                            <button
                                type="button"
                                className="admin-filter-reset"
                                onClick={resetFilters}
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                <div className="admin-table-wrap">
                    <table className="admin-table admin-payments-table">
                        <thead>
                            <tr>
                                <th scope="col">Nota</th>
                                <th scope="col">Pelanggan</th>
                                <th scope="col">Layanan</th>
                                <th scope="col">Metode</th>
                                <th scope="col">Jumlah</th>
                                <th scope="col">Status</th>
                                <th scope="col">
                                    <span className="sr-only">Aksi</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {visiblePayments.map((payment) => {
                                const status =
                                    paymentStatusConfig[payment.status];

                                return (
                                    <tr key={payment.id}>
                                        <td data-label="Nota">
                                            <div className="admin-payment-invoice">
                                                <strong>
                                                    {payment.invoiceNumber}
                                                </strong>
                                                <span>
                                                    {payment.orderId} ·{' '}
                                                    {shortDate(
                                                        payment.issuedAt,
                                                    )}
                                                </span>
                                            </div>
                                        </td>
                                        <td data-label="Pelanggan">
                                            <div className="admin-customer-identity">
                                                <span
                                                    className="admin-avatar"
                                                    aria-hidden="true"
                                                >
                                                    {initialsOf(
                                                        payment.customer,
                                                    )}
                                                </span>
                                                <div className="admin-cell-main">
                                                    <strong>
                                                        {payment.customer}
                                                    </strong>
                                                    <span>
                                                        {payment.phone}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label="Layanan">
                                            <div className="admin-cell-main">
                                                <strong>
                                                    {payment.service}
                                                </strong>
                                                <span>{payment.weight}</span>
                                            </div>
                                        </td>
                                        <td data-label="Metode">
                                            <div className="admin-cell-main">
                                                <strong>
                                                    {payment.method}
                                                </strong>
                                                <span>
                                                    {payment.proof
                                                        ? 'Bukti diunggah'
                                                        : payment.channel}
                                                </span>
                                            </div>
                                        </td>
                                        <td data-label="Jumlah">
                                            <div className="admin-cell-main admin-cell-total">
                                                <strong>
                                                    {formatRupiah(
                                                        payment.amount,
                                                    )}
                                                </strong>
                                                <span>
                                                    {payment.status ===
                                                    'Lunas'
                                                        ? `Dibayar ${shortDate(
                                                              payment.paidAt,
                                                          )}`
                                                        : 'Total tagihan'}
                                                </span>
                                            </div>
                                        </td>
                                        <td data-label="Status">
                                            <span
                                                className={`admin-payment-status ${status.tone}`}
                                            >
                                                <span aria-hidden="true" />
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td data-label="Aksi">
                                            <button
                                                type="button"
                                                className="admin-detail-button"
                                                onClick={() =>
                                                    setSelectedPaymentId(
                                                        payment.id,
                                                    )
                                                }
                                                aria-label={`Buka nota ${payment.invoiceNumber}`}
                                            >
                                                {payment.status ===
                                                'Perlu konfirmasi'
                                                    ? 'Periksa'
                                                    : payment.status ===
                                                        'Lunas'
                                                      ? 'Nota'
                                                      : 'Detail'}
                                                <AdminIcon
                                                    name="chevron"
                                                    size={14}
                                                />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {filteredPayments.length === 0 && (
                        <div className="admin-empty">
                            <span className="admin-empty-icon">
                                <AdminIcon name="search" size={21} />
                            </span>
                            <strong>
                                Tidak ada pembayaran yang cocok.
                            </strong>
                            <p>
                                Coba kata kunci lain, ubah filter, atau
                                tampilkan semua tagihan.
                            </p>
                            <button
                                type="button"
                                className="admin-button admin-button-outline"
                                onClick={resetFilters}
                            >
                                Reset filter
                            </button>
                        </div>
                    )}
                </div>

                <div className="admin-table-foot admin-table-foot-pagination">
                    <span>
                        Menampilkan {rangeStart}-{rangeEnd} dari{' '}
                        {filteredPayments.length} tagihan
                    </span>

                    {filteredPayments.length > PAGE_SIZE && (
                        <nav
                            className="admin-pagination"
                            aria-label="Navigasi halaman pembayaran"
                        >
                            <button
                                type="button"
                                className="admin-page-button"
                                disabled={safePage === 1}
                                onClick={() =>
                                    setPage(Math.max(1, safePage - 1))
                                }
                                aria-label="Halaman sebelumnya"
                            >
                                <AdminIcon name="chevron" size={16} />
                            </button>

                            {Array.from(
                                { length: totalPages },
                                (_, index) => index + 1,
                            ).map((pageNumber) => (
                                <button
                                    key={pageNumber}
                                    type="button"
                                    className={`admin-page-button${
                                        safePage === pageNumber
                                            ? ' is-active'
                                            : ''
                                    }`}
                                    aria-current={
                                        safePage === pageNumber
                                            ? 'page'
                                            : undefined
                                    }
                                    onClick={() => setPage(pageNumber)}
                                >
                                    {pageNumber}
                                </button>
                            ))}

                            <button
                                type="button"
                                className="admin-page-button admin-page-button-next"
                                disabled={safePage === totalPages}
                                onClick={() =>
                                    setPage(
                                        Math.min(
                                            totalPages,
                                            safePage + 1,
                                        ),
                                    )
                                }
                                aria-label="Halaman berikutnya"
                            >
                                <AdminIcon name="chevron" size={16} />
                            </button>
                        </nav>
                    )}
                </div>
            </section>

            <p className="admin-dashboard-note">
                Semua pembayaran dan nota pada halaman ini adalah data
                contoh. Konfirmasi hanya berlaku pada pratinjau lokal dan
                belum tersimpan ke backend.
            </p>

            {selectedPayment && (
                <PaymentDrawer
                    payment={selectedPayment}
                    onClose={() => setSelectedPaymentId(null)}
                    onConfirm={() => confirmPayment(selectedPayment)}
                />
            )}

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

function PaymentStatusBadge({ status }) {
    const config = paymentStatusConfig[status];

    return (
        <span className={`admin-payment-status ${config.tone}`}>
            <span aria-hidden="true" />
            {status}
        </span>
    );
}

function InvoiceCard({ payment }) {
    const isDraft = payment.status === 'Belum ditagih';
    const isPaid = payment.status === 'Lunas';

    return (
        <div
            className={`admin-invoice-card${isDraft ? ' is-draft' : ''}`}
            aria-label={`Nota ${payment.invoiceNumber}`}
        >
            <div className="admin-invoice-brand">
                <div className="admin-invoice-brand-mark">
                    <span>
                        <AdminIcon name="spark" size={17} />
                    </span>
                    <div>
                        <strong>Cleanora</strong>
                        <small>Laundry &amp; Care</small>
                    </div>
                </div>

                <div className="admin-invoice-doc">
                    <span>NOTA LAUNDRY</span>
                    <strong>{payment.invoiceNumber}</strong>
                    <small>
                        {formatTanggalWaktu(payment.issuedAt)}
                    </small>
                </div>
            </div>

            <div className="admin-invoice-customer">
                <div>
                    <span>Ditagihkan kepada</span>
                    <strong>{payment.customer}</strong>
                    <small>{payment.phone}</small>
                </div>
                <div>
                    <span>Nomor pesanan</span>
                    <strong>{payment.orderId}</strong>
                    <small>{payment.orderStatus}</small>
                </div>
            </div>

            <table className="admin-invoice-table">
                <thead>
                    <tr>
                        <th scope="col">Layanan</th>
                        <th scope="col">Berat</th>
                        <th scope="col">Jumlah</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{payment.service}</td>
                        <td>{payment.weight}</td>
                        <td>{formatRupiah(payment.amount)}</td>
                    </tr>
                </tbody>
            </table>

            <div className="admin-invoice-totals">
                <div>
                    <span>Subtotal</span>
                    <strong>{formatRupiah(payment.amount)}</strong>
                </div>
                <div>
                    <span>Biaya tambahan</span>
                    <strong>Rp0</strong>
                </div>
                <div className="is-total">
                    <span>Total</span>
                    <strong>{formatRupiah(payment.amount)}</strong>
                </div>
            </div>

            <div className="admin-invoice-payment">
                <div>
                    <span>Status</span>
                    <PaymentStatusBadge status={payment.status} />
                </div>
                <div>
                    <span>Metode</span>
                    <strong>{payment.method}</strong>
                </div>
                <div>
                    <span>{isPaid ? 'Dibayar' : 'Sisa tagihan'}</span>
                    <strong>{formatRupiah(payment.amount)}</strong>
                </div>
            </div>

            {isDraft && (
                <p className="admin-invoice-draft-note">
                    Nota masih berupa pratinjau. Nominal final dibuat
                    setelah berat aktual dikonfirmasi.
                </p>
            )}

            <p className="admin-invoice-thanks">
                Terima kasih sudah mempercayakan cucianmu kepada
                Cleanora.
            </p>

            <div className="admin-invoice-foot">
                <span>Cleanora Laundry &amp; Care</span>
                <span>Outlet Pusat · Bandung</span>
            </div>
        </div>
    );
}

function PaymentDrawer({ payment, onClose, onConfirm }) {
    const canConfirm =
        payment.status === 'Perlu konfirmasi' ||
        payment.status === 'Belum dibayar';
    const isBilled = payment.status !== 'Belum ditagih';
    const proof = payment.proof;

    return (
        <div
            className="admin-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-payment-title"
        >
            <button
                type="button"
                className="admin-drawer-backdrop"
                aria-label="Tutup nota pembayaran"
                onClick={onClose}
            />

            <aside className="admin-drawer-panel admin-payment-panel">
                <div className="admin-drawer-head">
                    <div>
                        <span className="admin-card-label">
                            NOTA &amp; PEMBAYARAN
                        </span>
                        <h2 id="admin-payment-title">
                            {payment.invoiceNumber}
                        </h2>
                    </div>
                    <button
                        type="button"
                        className="admin-icon-button"
                        aria-label="Tutup nota pembayaran"
                        onClick={onClose}
                    >
                        <AdminIcon name="close" size={18} />
                    </button>
                </div>

                <div className="admin-drawer-body">
                    <div className="admin-drawer-status">
                        <PaymentStatusBadge status={payment.status} />
                        <span className="admin-payment-order-source">
                            {payment.orderStatus}
                        </span>
                    </div>

                    <div className="admin-drawer-customer">
                        <span className="admin-avatar" aria-hidden="true">
                            {initialsOf(payment.customer)}
                        </span>
                        <div>
                            <strong>{payment.customer}</strong>
                            <small>{payment.phone}</small>
                        </div>
                        <span className="admin-drawer-time">
                            {shortDate(payment.issuedAt)}
                        </span>
                    </div>

                    <InvoiceCard payment={payment} />

                    <section className="admin-payment-meta">
                        <span className="admin-card-label">
                            RINCIAN PEMBAYARAN
                        </span>
                        <dl className="admin-payment-grid">
                            <div>
                                <dt>Status</dt>
                                <dd>{payment.status}</dd>
                            </div>
                            <div>
                                <dt>Metode</dt>
                                <dd>{payment.method}</dd>
                            </div>
                            <div>
                                <dt>Bank / kanal</dt>
                                <dd>{payment.channel}</dd>
                            </div>
                            <div>
                                <dt>Nota diterbitkan</dt>
                                <dd>
                                    {formatTanggalWaktu(
                                        payment.issuedAt,
                                    )}
                                </dd>
                            </div>
                            <div>
                                <dt>Dibayar pada</dt>
                                <dd>
                                    {payment.paidAt
                                        ? formatTanggalWaktu(
                                              payment.paidAt,
                                          )
                                        : 'Belum dibayar'}
                                </dd>
                            </div>
                            <div>
                                <dt>Dikonfirmasi oleh</dt>
                                <dd>{payment.confirmedBy ?? '-'}</dd>
                            </div>
                        </dl>
                    </section>

                    {isBilled && (
                        <section className="admin-payment-proof">
                            <div className="admin-payment-section-head">
                                <span className="admin-card-label">
                                    BUKTI TRANSFER
                                </span>
                                {proof && (
                                    <span className="admin-payment-proof-state">
                                        Menunggu verifikasi
                                    </span>
                                )}
                            </div>

                            {proof ? (
                                <>
                                    <div className="admin-payment-proof-preview">
                                        <div>
                                            <span>Transfer berhasil</span>
                                            <strong>
                                                {formatRupiah(
                                                    payment.amount,
                                                )}
                                            </strong>
                                            <small>
                                                {payment.channel} ·{' '}
                                                {formatTanggalWaktu(
                                                    proof.uploadedAt,
                                                )}
                                            </small>
                                        </div>
                                        <span className="admin-payment-proof-stamp">
                                            SIMULASI
                                        </span>
                                    </div>

                                    <div className="admin-payment-proof-file">
                                        <span className="admin-payment-proof-icon">
                                            <AdminIcon
                                                name="orders"
                                                size={17}
                                            />
                                        </span>
                                        <div>
                                            <strong>{proof.name}</strong>
                                            <small>
                                                {proof.size} · Diunggah{' '}
                                                {formatTanggalWaktu(
                                                    proof.uploadedAt,
                                                )}
                                            </small>
                                        </div>
                                    </div>
                                </>
                            ) : payment.status === 'Lunas' ? (
                                <div className="admin-payment-proof-verified">
                                    <span>
                                        <AdminIcon
                                            name="check"
                                            size={15}
                                        />
                                    </span>
                                    <div>
                                        <strong>
                                            Pembayaran sudah diverifikasi
                                        </strong>
                                        <p>
                                            {payment.method} dicatat
                                            {payment.paidAt
                                                ? ` pada ${formatTanggalWaktu(
                                                      payment.paidAt,
                                                  )}`
                                                : ''}
                                            .
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="admin-payment-proof-empty">
                                    <span>
                                        <AdminIcon
                                            name="alert"
                                            size={16}
                                        />
                                    </span>
                                    <div>
                                        <strong>
                                            Belum ada bukti transfer.
                                        </strong>
                                        <p>
                                            Minta pelanggan mengunggah
                                            bukti, lalu periksa nominal
                                            sebelum menandai lunas.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {payment.status === 'Belum dibayar' && (
                                <a
                                    href={
                                        whatsappLink(payment.phone) ??
                                        '#'
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="admin-payment-reminder"
                                >
                                    <AdminIcon name="message" size={14} />
                                    Kirim pengingat WhatsApp
                                </a>
                            )}
                        </section>
                    )}

                    <section className="admin-payment-note">
                        <span className="admin-card-label">
                            CATATAN PESANAN
                        </span>
                        <p>{payment.note}</p>
                    </section>

                    <Link
                        href={route(
                            'pengusaha.pesanan.detail',
                            payment.orderId,
                        )}
                        className="admin-payment-order-link"
                    >
                        Buka detail pesanan
                        <AdminIcon name="arrow" size={14} />
                    </Link>
                </div>

                <div className="admin-drawer-foot admin-payment-drawer-foot">
                    <p>
                        Data contoh untuk pratinjau. Pembayaran belum
                        tersimpan ke backend.
                    </p>
                    <div className="admin-payment-drawer-actions">
                        {canConfirm && (
                            <button
                                type="button"
                                className="admin-button admin-button-primary"
                                onClick={onConfirm}
                            >
                                {payment.status === 'Perlu konfirmasi'
                                    ? 'Konfirmasi pembayaran'
                                    : 'Catat pembayaran'}
                            </button>
                        )}

                        {isBilled ? (
                            <button
                                type="button"
                                className="admin-button admin-button-outline"
                                onClick={() => window.print()}
                            >
                                <AdminIcon name="printer" size={15} />
                                Cetak nota
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="admin-button admin-button-outline"
                                onClick={onClose}
                            >
                                Tutup
                            </button>
                        )}
                    </div>
                </div>
            </aside>
        </div>
    );
}
