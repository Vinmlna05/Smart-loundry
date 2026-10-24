import '../../../css/pengusaha-pelanggan.css';

import AdminIcon from '@/Components/Pengusaha/AdminIcon';
import {
    adminCustomers,
    customerSegmentOptions,
    customerSegments,
    formatTanggal,
} from '@/Data/adminCustomers';
import {
    formatRupiah,
    initialsOf,
    orderStatusTone,
    whatsappLink,
} from '@/Data/adminOrders';
import PengusahaLayout from '@/Layouts/PengusahaLayout';
import { Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const PAGE_SIZE = 8;

const summaryItems = [
    {
        key: 'all',
        label: 'Total pelanggan',
        note: 'Punya riwayat pesanan',
        icon: 'customers',
        tone: 'is-teal',
    },
    {
        key: 'loyal',
        label: 'Pelanggan setia',
        note: 'Sering memesan ulang',
        icon: 'spark',
        tone: 'is-blue',
    },
    {
        key: 'new',
        label: 'Pelanggan baru',
        note: 'Bergabung 30 hari terakhir',
        icon: 'customers',
        tone: 'is-green',
    },
    {
        key: 'attention',
        label: 'Perlu perhatian',
        note: 'Pembayaran atau konfirmasi',
        icon: 'alert',
        tone: 'is-gold',
    },
];

const serviceOptions = [
    'Cuci dan Setrika',
    'Cuci Kering',
    'Setrika Saja',
];

export default function PengusahaPelanggan() {
    const [selectedSegment, setSelectedSegment] = useState('all');
    const [search, setSearch] = useState('');
    const [serviceFilter, setServiceFilter] = useState('all');
    const [sortBy, setSortBy] = useState('recent');
    const [page, setPage] = useState(1);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [toast, setToast] = useState('');

    const summaryCounts = useMemo(
        () => ({
            all: adminCustomers.length,
            loyal: adminCustomers.filter(
                (customer) => customer.segment === 'loyal',
            ).length,
            new: adminCustomers.filter(
                (customer) => customer.segment === 'new',
            ).length,
            attention: adminCustomers.filter(
                (customer) => customer.segment === 'attention',
            ).length,
        }),
        [],
    );

    const filteredCustomers = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return adminCustomers
            .filter((customer) => {
                if (
                    selectedSegment !== 'all' &&
                    customer.segment !== selectedSegment
                ) {
                    return false;
                }

                if (
                    serviceFilter !== 'all' &&
                    customer.favoriteService !== serviceFilter
                ) {
                    return false;
                }

                if (!keyword) {
                    return true;
                }

                return [
                    customer.id,
                    customer.name,
                    customer.phone,
                    customer.email,
                    customer.address,
                    customer.favoriteService,
                    customer.outlet,
                ].some((value) =>
                    String(value).toLowerCase().includes(keyword),
                );
            })
            .sort((first, second) => {
                if (sortBy === 'name') {
                    return first.name.localeCompare(second.name, 'id');
                }

                if (sortBy === 'spend') {
                    return second.totalSpent - first.totalSpent;
                }

                if (sortBy === 'orders') {
                    return second.totalOrders - first.totalOrders;
                }

                return (
                    new Date(second.lastOrderAt) -
                    new Date(first.lastOrderAt)
                );
            });
    }, [search, selectedSegment, serviceFilter, sortBy]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredCustomers.length / PAGE_SIZE),
    );
    const safePage = Math.min(page, totalPages);
    const firstIndex = (safePage - 1) * PAGE_SIZE;
    const visibleCustomers = filteredCustomers.slice(
        firstIndex,
        firstIndex + PAGE_SIZE,
    );
    const rangeStart = filteredCustomers.length === 0 ? 0 : firstIndex + 1;
    const rangeEnd = Math.min(
        firstIndex + PAGE_SIZE,
        filteredCustomers.length,
    );

    const hasFilters =
        selectedSegment !== 'all' ||
        search !== '' ||
        serviceFilter !== 'all';

    useEffect(() => {
        setPage(1);
    }, [search, selectedSegment, serviceFilter, sortBy]);

    useEffect(() => {
        if (!toast) {
            return undefined;
        }

        const timeout = window.setTimeout(() => setToast(''), 3000);

        return () => window.clearTimeout(timeout);
    }, [toast]);

    useEffect(() => {
        if (!selectedCustomer) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setSelectedCustomer(null);
            }
        };

        document.body.classList.add('admin-drawer-open');
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.classList.remove('admin-drawer-open');
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedCustomer]);

    const resetFilters = () => {
        setSelectedSegment('all');
        setSearch('');
        setServiceFilter('all');
        setSortBy('recent');
        setPage(1);
    };

    const downloadCustomers = () => {
        if (filteredCustomers.length === 0) {
            setToast('Tidak ada pelanggan yang bisa diunduh.');

            return;
        }

        const rows = [
            [
                'ID pelanggan',
                'Nama',
                'WhatsApp',
                'Email',
                'Alamat',
                'Bergabung',
                'Segmen',
                'Jumlah pesanan',
                'Total belanja',
                'Layanan favorit',
                'Pesanan terakhir',
            ],
            ...filteredCustomers.map((customer) => [
                customer.id,
                customer.name,
                customer.phone,
                customer.email,
                customer.address,
                formatTanggal(customer.joinedAt),
                customerSegments[customer.segment].label,
                customer.totalOrders,
                customer.totalSpent,
                customer.favoriteService,
                formatTanggal(customer.lastOrderAt),
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
        link.download = `cleanora-pelanggan-${new Date()
            .toISOString()
            .slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);

        setToast(`${filteredCustomers.length} pelanggan berhasil diunduh.`);
    };

    return (
        <PengusahaLayout
            title="Pelanggan - Cleanora"
            active="customers"
            breadcrumb="Pelanggan"
        >
            <div className="admin-page-head">
                <div className="admin-page-heading">
                    <span className="admin-eyebrow">
                        <span aria-hidden="true">✦</span>
                        Relasi pelanggan
                    </span>
                    <h1>
                        Manajemen <em>pelanggan.</em>
                    </h1>
                    <p>
                        Kenali pelanggan setia, pantau riwayat transaksi, dan
                        tindak lanjuti kontak yang membutuhkan perhatian.
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
                        onClick={downloadCustomers}
                    >
                        <AdminIcon name="download" size={16} />
                        Unduh data pelanggan
                    </button>
                </div>
            </div>

            <section
                className="admin-order-summary"
                aria-label="Ringkasan pelanggan"
            >
                {summaryItems.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        className={`admin-queue-card ${item.tone}${
                            selectedSegment === item.key ? ' is-active' : ''
                        }`}
                        aria-pressed={selectedSegment === item.key}
                        onClick={() => setSelectedSegment(item.key)}
                    >
                        <span className="admin-queue-icon">
                            <AdminIcon name={item.icon} size={19} />
                        </span>
                        <span className="admin-queue-content">
                            <span className="admin-queue-label">
                                {item.label}
                            </span>
                            <strong>{summaryCounts[item.key]}</strong>
                            <small>{item.note}</small>
                        </span>
                        <span className="admin-queue-arrow" aria-hidden="true">
                            <AdminIcon name="chevron" size={15} />
                        </span>
                    </button>
                ))}
            </section>

            <section className="admin-card admin-orders admin-customers-page">
                <div className="admin-card-head">
                    <div>
                        <span className="admin-card-label">
                            DAFTAR PELANGGAN
                        </span>
                        <h2>Kontak dan riwayat</h2>
                        <p>
                            {filteredCustomers.length} pelanggan cocok dengan
                            filter saat ini.
                        </p>
                    </div>
                    <span className="admin-orders-count">
                        {filteredCustomers.length} pelanggan
                    </span>
                </div>

                <div className="admin-orders-toolbar admin-orders-toolbar-page">
                    <label className="admin-search admin-search-wide">
                        <AdminIcon name="search" size={16} />
                        <span className="sr-only">Cari pelanggan</span>
                        <input
                            type="search"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Cari nama, WhatsApp, atau alamat..."
                        />
                    </label>

                    <div className="admin-filter-group">
                        <label className="admin-select">
                            <span className="sr-only">Filter segmen</span>
                            <select
                                value={selectedSegment}
                                onChange={(event) =>
                                    setSelectedSegment(event.target.value)
                                }
                            >
                                <option value="all">Semua segmen</option>
                                {customerSegmentOptions.map((segment) => (
                                    <option
                                        key={segment.value}
                                        value={segment.value}
                                    >
                                        {segment.label}
                                    </option>
                                ))}
                            </select>
                            <AdminIcon name="chevron" size={13} />
                        </label>

                        <label className="admin-select">
                            <span className="sr-only">
                                Filter layanan favorit
                            </span>
                            <select
                                value={serviceFilter}
                                onChange={(event) =>
                                    setServiceFilter(event.target.value)
                                }
                            >
                                <option value="all">Semua layanan</option>
                                {serviceOptions.map((service) => (
                                    <option key={service} value={service}>
                                        {service}
                                    </option>
                                ))}
                            </select>
                            <AdminIcon name="chevron" size={13} />
                        </label>

                        <label className="admin-select">
                            <span className="sr-only">Urutkan pelanggan</span>
                            <select
                                value={sortBy}
                                onChange={(event) =>
                                    setSortBy(event.target.value)
                                }
                            >
                                <option value="recent">Terbaru memesan</option>
                                <option value="name">Nama A-Z</option>
                                <option value="spend">Belanja tertinggi</option>
                                <option value="orders">Pesanan terbanyak</option>
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
                    <table className="admin-table admin-customers-table">
                        <thead>
                            <tr>
                                <th scope="col">Pelanggan</th>
                                <th scope="col">Kontak</th>
                                <th scope="col">Layanan favorit</th>
                                <th scope="col">Pesanan</th>
                                <th scope="col">Total belanja</th>
                                <th scope="col">Segmen</th>
                                <th scope="col">
                                    <span className="sr-only">Aksi</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleCustomers.map((customer) => {
                                const segment =
                                    customerSegments[customer.segment];

                                return (
                                    <tr key={customer.id}>
                                        <td data-label="Pelanggan">
                                            <div className="admin-customer-identity">
                                                <span
                                                    className="admin-avatar"
                                                    aria-hidden="true"
                                                >
                                                    {initialsOf(customer.name)}
                                                </span>
                                                <div className="admin-cell-main">
                                                    <strong>
                                                        {customer.name}
                                                    </strong>
                                                    <span>
                                                        {customer.id} · Sejak{' '}
                                                        {formatTanggal(
                                                            customer.joinedAt,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label="Kontak">
                                            <div className="admin-cell-main admin-customer-contact">
                                                <strong>
                                                    {customer.phone}
                                                </strong>
                                                <span>{customer.email}</span>
                                            </div>
                                        </td>
                                        <td data-label="Layanan favorit">
                                            <div className="admin-cell-main">
                                                <strong>
                                                    {customer.favoriteService}
                                                </strong>
                                                <span>{customer.outlet}</span>
                                            </div>
                                        </td>
                                        <td data-label="Pesanan">
                                            <div className="admin-cell-main">
                                                <strong>
                                                    {customer.totalOrders}{' '}
                                                    pesanan
                                                </strong>
                                                <span>
                                                    Terakhir{' '}
                                                    {formatTanggal(
                                                        customer.lastOrderAt,
                                                    )}
                                                </span>
                                            </div>
                                        </td>
                                        <td data-label="Total belanja">
                                            <div className="admin-cell-main admin-customer-spend">
                                                <strong>
                                                    {formatRupiah(
                                                        customer.totalSpent,
                                                    )}
                                                </strong>
                                                <span>Akumulasi belanja</span>
                                            </div>
                                        </td>
                                        <td data-label="Segmen">
                                            <span
                                                className={`admin-segment ${segment.tone}`}
                                            >
                                                <span aria-hidden="true" />
                                                {segment.label}
                                            </span>
                                        </td>
                                        <td data-label="Aksi">
                                            <div className="admin-customer-actions">
                                                <a
                                                    href={whatsappLink(
                                                        customer.phone,
                                                    )}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="admin-customer-wa"
                                                    aria-label={`Hubungi ${customer.name} melalui WhatsApp`}
                                                >
                                                    <AdminIcon
                                                        name="message"
                                                        size={14}
                                                    />
                                                </a>
                                                <button
                                                    type="button"
                                                    className="admin-detail-button"
                                                    onClick={() =>
                                                        setSelectedCustomer(
                                                            customer,
                                                        )
                                                    }
                                                    aria-label={`Buka detail pelanggan ${customer.name}`}
                                                >
                                                    Detail
                                                    <AdminIcon
                                                        name="chevron"
                                                        size={14}
                                                    />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {visibleCustomers.length === 0 && (
                        <div className="admin-empty">
                            <span className="admin-empty-icon">
                                <AdminIcon name="search" size={21} />
                            </span>
                            <strong>
                                Tidak ada pelanggan yang cocok.
                            </strong>
                            <p>
                                Coba kata kunci lain, ubah filter, atau
                                tampilkan semua pelanggan.
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
                        {filteredCustomers.length} pelanggan
                    </span>

                    {filteredCustomers.length > PAGE_SIZE && (
                        <nav
                            className="admin-pagination"
                            aria-label="Navigasi halaman pelanggan"
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
                                        Math.min(totalPages, safePage + 1),
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
                Semua pelanggan pada halaman ini adalah data contoh untuk
                pratinjau tampilan manajemen pelanggan.
            </p>

            {selectedCustomer && (
                <CustomerDrawer
                    customer={selectedCustomer}
                    onClose={() => setSelectedCustomer(null)}
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

function CustomerDrawer({ customer, onClose }) {
    const segment = customerSegments[customer.segment];

    return (
        <div
            className="admin-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-customer-title"
        >
            <button
                type="button"
                className="admin-drawer-backdrop"
                aria-label="Tutup detail pelanggan"
                onClick={onClose}
            />

            <aside className="admin-drawer-panel admin-customer-panel">
                <div className="admin-drawer-head">
                    <div>
                        <span className="admin-card-label">
                            DETAIL PELANGGAN
                        </span>
                        <h2 id="admin-customer-title">{customer.name}</h2>
                    </div>
                    <button
                        type="button"
                        className="admin-icon-button"
                        aria-label="Tutup detail pelanggan"
                        onClick={onClose}
                    >
                        <AdminIcon name="close" size={18} />
                    </button>
                </div>

                <div className="admin-drawer-body">
                    <div className="admin-customer-profile">
                        <span className="admin-avatar" aria-hidden="true">
                            {initialsOf(customer.name)}
                        </span>
                        <div>
                            <strong>{customer.name}</strong>
                            <small>
                                {customer.id} · Bergabung{' '}
                                {formatTanggal(customer.joinedAt)}
                            </small>
                        </div>
                        <span
                            className={`admin-segment ${segment.tone}`}
                        >
                            <span aria-hidden="true" />
                            {segment.label}
                        </span>
                    </div>

                    <div className="admin-customer-detail-stats">
                        <div>
                            <span>Pesanan</span>
                            <strong>{customer.totalOrders}</strong>
                        </div>
                        <div>
                            <span>Total belanja</span>
                            <strong>
                                {formatRupiah(customer.totalSpent)}
                            </strong>
                        </div>
                        <div>
                            <span>Terakhir memesan</span>
                            <strong>
                                {formatTanggal(customer.lastOrderAt)}
                            </strong>
                        </div>
                    </div>

                    <dl className="admin-drawer-grid">
                        <div>
                            <dt>WhatsApp</dt>
                            <dd>{customer.phone}</dd>
                        </div>
                        <div>
                            <dt>Email</dt>
                            <dd>{customer.email}</dd>
                        </div>
                        <div>
                            <dt>Outlet</dt>
                            <dd>{customer.outlet}</dd>
                        </div>
                        <div>
                            <dt>Layanan favorit</dt>
                            <dd>{customer.favoriteService}</dd>
                        </div>
                        <div className="admin-customer-address">
                            <dt>Alamat</dt>
                            <dd>{customer.address}</dd>
                        </div>
                        <div>
                            <dt>Sumber terakhir</dt>
                            <dd>{customer.source}</dd>
                        </div>
                    </dl>

                    {customer.note && (
                        <p className="admin-customer-note">
                            <AdminIcon name="alert" size={14} />
                            {customer.note}
                        </p>
                    )}

                    <section className="admin-customer-orders">
                        <div className="admin-customer-orders-head">
                            <span className="admin-card-label">
                                RIWAYAT PESANAN
                            </span>
                            <span>
                                {customer.recentOrders.length} terbaru
                            </span>
                        </div>

                        {customer.recentOrders.length > 0 ? (
                            <div className="admin-customer-order-list">
                                {customer.recentOrders.map((order) => (
                                    <Link
                                        key={order.id}
                                        href={route(
                                            'pengusaha.pesanan.detail',
                                            order.id,
                                        )}
                                        className="admin-customer-order"
                                    >
                                        <span className="admin-customer-order-icon">
                                            <AdminIcon
                                                name="orders"
                                                size={15}
                                            />
                                        </span>
                                        <span className="admin-customer-order-main">
                                            <strong>{order.id}</strong>
                                            <small>
                                                {formatTanggal(
                                                    customer.lastOrderAt,
                                                )}{' '}
                                                · {order.service}
                                            </small>
                                        </span>
                                        <span className="admin-customer-order-side">
                                            <strong>
                                                {formatRupiah(order.total)}
                                            </strong>
                                            <small
                                                className={
                                                    orderStatusTone[
                                                        order.status
                                                    ] ?? 'is-info'
                                                }
                                            >
                                                {order.status}
                                            </small>
                                        </span>
                                        <AdminIcon
                                            name="chevron"
                                            size={14}
                                        />
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="admin-customer-orders-empty">
                                Belum ada riwayat pesanan untuk pelanggan ini.
                            </p>
                        )}
                    </section>
                </div>

                <div className="admin-drawer-foot admin-customer-drawer-foot">
                    <p>
                        Data contoh untuk pratinjau. Perubahan data pelanggan
                        belum tersimpan ke backend.
                    </p>
                    <div className="admin-customer-drawer-actions">
                        <a
                            href={whatsappLink(customer.phone)}
                            target="_blank"
                            rel="noreferrer"
                            className="admin-button admin-button-primary"
                        >
                            <AdminIcon name="message" size={14} />
                            WhatsApp
                        </a>
                        <button
                            type="button"
                            className="admin-button admin-button-outline"
                            onClick={onClose}
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    );
}
