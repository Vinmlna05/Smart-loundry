import AdminIcon from '@/Components/Pengusaha/AdminIcon';
import {
    formatRupiah,
    orderStatuses,
    orderStatusTone,
    paymentTone,
} from '@/Data/adminOrders';
import PengusahaLayout from '@/Layouts/PengusahaLayout';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const PAGE_SIZE = 8;

const summaryItems = [
    {
        key: 'all',
        label: 'Semua pesanan',
        note: 'Manual dan Chatbot AI',
        icon: 'orders',
        tone: 'is-teal',
    },
    {
        key: 'attention',
        label: 'Perlu tindakan',
        note: 'Menunggu proses atau bayar',
        icon: 'alert',
        tone: 'is-gold',
    },
    {
        key: 'process',
        label: 'Sedang diproses',
        note: 'Sedang dikerjakan petugas',
        icon: 'queue',
        tone: 'is-blue',
    },
    {
        key: 'done',
        label: 'Selesai',
        note: 'Sudah diserahkan',
        icon: 'check',
        tone: 'is-green',
    },
];

export default function PengusahaPesanan({ orders = [] }) {
    const { url } = usePage();
    const urlParams = useMemo(
        () => new URLSearchParams(url.split('?')[1] ?? ''),
        [url],
    );
    const groupFromUrl = urlParams.get('group');
    const statusFromUrl = urlParams.get('status');
    const [selectedGroup, setSelectedGroup] = useState(() =>
        summaryItems.some((item) => item.key === groupFromUrl)
            ? groupFromUrl
            : 'all',
    );
    const [search, setSearch] = useState('');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState(() =>
        orderStatuses.includes(statusFromUrl) ? statusFromUrl : 'all',
    );
    const [methodFilter, setMethodFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState([]);
    const [toast, setToast] = useState('');

    const summaryCounts = useMemo(
        () => ({
            all: orders.length,
            attention: orders.filter((order) => order.group === 'attention')
                .length,
            process: orders.filter((order) => order.group === 'process')
                .length,
            done: orders.filter((order) => order.group === 'done').length,
        }),
        [orders],
    );

    const filteredOrders = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return orders.filter((order) => {
            if (selectedGroup !== 'all' && order.group !== selectedGroup) {
                return false;
            }

            if (sourceFilter !== 'all' && order.source !== sourceFilter) {
                return false;
            }

            if (statusFilter !== 'all' && order.status !== statusFilter) {
                return false;
            }

            if (methodFilter !== 'all' && order.intake !== methodFilter) {
                return false;
            }

            if (!keyword) {
                return true;
            }

            return [
                order.id,
                order.customer,
                order.phone,
                order.service,
                order.status,
                order.payment,
            ].some((value) => value.toLowerCase().includes(keyword));
        });
    }, [
        methodFilter,
        orders,
        search,
        selectedGroup,
        sourceFilter,
        statusFilter,
    ]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredOrders.length / PAGE_SIZE),
    );
    const safePage = Math.min(page, totalPages);
    const firstIndex = (safePage - 1) * PAGE_SIZE;
    const visibleOrders = filteredOrders.slice(
        firstIndex,
        firstIndex + PAGE_SIZE,
    );
    const visibleIds = visibleOrders.map((order) => order.id);
    const allVisibleSelected =
        visibleIds.length > 0 &&
        visibleIds.every((id) => selectedIds.includes(id));
    const selectedOrders = orders.filter((order) =>
        selectedIds.includes(order.id),
    );

    const hasFilters =
        selectedGroup !== 'all' ||
        search !== '' ||
        sourceFilter !== 'all' ||
        statusFilter !== 'all' ||
        methodFilter !== 'all';

    const rangeStart = filteredOrders.length === 0 ? 0 : firstIndex + 1;
    const rangeEnd = Math.min(
        firstIndex + PAGE_SIZE,
        filteredOrders.length,
    );

    useEffect(() => {
        setSelectedGroup(
            summaryItems.some((item) => item.key === groupFromUrl)
                ? groupFromUrl
                : 'all',
        );
        setStatusFilter(
            orderStatuses.includes(statusFromUrl) ? statusFromUrl : 'all',
        );
        setSearch('');
        setSourceFilter('all');
        setMethodFilter('all');
        setSelectedIds([]);
        setPage(1);
    }, [groupFromUrl, statusFromUrl]);

    useEffect(() => {
        setPage(1);
    }, [methodFilter, search, selectedGroup, sourceFilter, statusFilter]);

    useEffect(() => {
        if (!toast) {
            return undefined;
        }

        const timeout = window.setTimeout(() => setToast(''), 3000);

        return () => window.clearTimeout(timeout);
    }, [toast]);

    const resetFilters = () => {
        setSelectedGroup('all');
        setSearch('');
        setSourceFilter('all');
        setStatusFilter('all');
        setMethodFilter('all');
        setPage(1);
    };

    const toggleSelection = (orderId) => {
        setSelectedIds((previous) =>
            previous.includes(orderId)
                ? previous.filter((id) => id !== orderId)
                : [...previous, orderId],
        );
    };

    const toggleSelectAll = () => {
        if (allVisibleSelected) {
            setSelectedIds((previous) =>
                previous.filter((id) => !visibleIds.includes(id)),
            );

            return;
        }

        setSelectedIds((previous) => [
            ...new Set([...previous, ...visibleIds]),
        ]);
    };

    const downloadOrders = (ordersToExport, label) => {
        if (ordersToExport.length === 0) {
            setToast('Tidak ada pesanan yang bisa diunduh.');

            return;
        }

        const rows = [
            [
                'Nomor pesanan',
                'Pelanggan',
                'WhatsApp',
                'Layanan',
                'Berat',
                'Status',
                'Pembayaran',
                'Total',
                'Sumber',
                'Metode',
            ],
            ...ordersToExport.map((order) => [
                order.id,
                order.customer,
                order.phone,
                order.service,
                order.weight,
                order.status,
                order.payment,
                order.total,
                order.source,
                order.intake,
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
        link.download = `cleanora-pesanan-${new Date()
            .toISOString()
            .slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);

        setToast(`${label} berhasil diunduh.`);
    };

    return (
        <PengusahaLayout
            title="Manajemen Pesanan — Cleanora"
            active="orders"
            breadcrumb="Manajemen pesanan"
        >
            <div className="admin-page-head admin-orders-page-head">
                <div className="admin-page-heading">
                    <span className="admin-eyebrow">
                        <span aria-hidden="true">✦</span>
                        Operasional
                    </span>
                    <h1>
                        Manajemen <em>pesanan.</em>
                    </h1>
                    <p>
                        Cari, filter, dan periksa seluruh pesanan yang masuk
                        lewat formulir manual maupun Chatbot AI.
                    </p>
                </div>

                <div className="admin-head-actions">
                    <span className="admin-sample-badge">
                        <span aria-hidden="true" />
                        Data tersimpan
                    </span>
                    <button
                        type="button"
                        className="admin-button admin-button-outline"
                        onClick={() =>
                            downloadOrders(
                                filteredOrders,
                                `${filteredOrders.length} pesanan`,
                            )
                        }
                    >
                        <AdminIcon name="download" size={16} />
                        Unduh ringkasan
                    </button>
                </div>
            </div>

            <section
                className="admin-order-summary"
                aria-label="Ringkasan pesanan"
            >
                {summaryItems.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        className={`admin-queue-card ${item.tone}${
                            selectedGroup === item.key ? ' is-active' : ''
                        }`}
                        aria-pressed={selectedGroup === item.key}
                        onClick={() => setSelectedGroup(item.key)}
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

            <section className="admin-card admin-orders admin-orders-page">
                <div className="admin-card-head">
                    <div>
                        <span className="admin-card-label">
                            DAFTAR PESANAN
                        </span>
                        <h2>Semua pesanan</h2>
                        <p>
                            {filteredOrders.length} pesanan cocok dengan
                            filter saat ini.
                        </p>
                    </div>
                    <span className="admin-orders-count">
                        {filteredOrders.length} pesanan
                    </span>
                </div>

                <div className="admin-orders-toolbar admin-orders-toolbar-page">
                    <label className="admin-search admin-search-wide">
                        <AdminIcon name="search" size={16} />
                        <span className="sr-only">Cari pesanan</span>
                        <input
                            type="search"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Cari nomor, nama, layanan, atau status..."
                        />
                    </label>

                    <div className="admin-filter-group">
                        <label className="admin-select">
                            <span className="sr-only">Filter sumber</span>
                            <select
                                value={sourceFilter}
                                onChange={(event) =>
                                    setSourceFilter(event.target.value)
                                }
                            >
                                <option value="all">Semua sumber</option>
                                <option value="Manual">Manual</option>
                                <option value="Chatbot AI">Chatbot AI</option>
                            </select>
                            <AdminIcon name="chevron" size={13} />
                        </label>

                        <label className="admin-select">
                            <span className="sr-only">Filter status</span>
                            <select
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(event.target.value)
                                }
                            >
                                <option value="all">Semua status</option>
                                {orderStatuses.map((status) => (
                                    <option key={status} value={status}>
                                        {status}
                                    </option>
                                ))}
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
                                <option value="Dijemput">Dijemput</option>
                                <option value="Diantar sendiri">
                                    Diantar sendiri
                                </option>
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

                {selectedIds.length > 0 && (
                    <div className="admin-bulk-bar">
                        <span className="admin-bulk-count">
                            <strong>{selectedIds.length}</strong> pesanan
                            dipilih
                        </span>
                        <div className="admin-bulk-actions">
                            <button
                                type="button"
                                className="admin-button admin-button-outline"
                                onClick={() =>
                                    downloadOrders(
                                        selectedOrders,
                                        `${selectedOrders.length} pesanan terpilih`,
                                    )
                                }
                            >
                                <AdminIcon name="download" size={14} />
                                Unduh terpilih
                            </button>
                            <button
                                type="button"
                                className="admin-bulk-clear"
                                onClick={() => setSelectedIds([])}
                            >
                                Bersihkan
                            </button>
                        </div>
                    </div>
                )}

                <div className="admin-table-wrap">
                    <table className="admin-table admin-orders-table">
                        <thead>
                            <tr>
                                <th scope="col" className="admin-check-cell">
                                    <input
                                        type="checkbox"
                                        className="admin-checkbox"
                                        checked={allVisibleSelected}
                                        onChange={toggleSelectAll}
                                        aria-label="Pilih semua pesanan pada halaman ini"
                                    />
                                </th>
                                <th scope="col">Pesanan</th>
                                <th scope="col">Pelanggan</th>
                                <th scope="col">Layanan</th>
                                <th scope="col">Status</th>
                                <th scope="col">Pembayaran</th>
                                <th scope="col">
                                    <span className="sr-only">Aksi</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleOrders.map((order) => (
                                <tr
                                    key={order.id}
                                    className={
                                        selectedIds.includes(order.id)
                                            ? 'is-selected'
                                            : undefined
                                    }
                                >
                                    <td
                                        className="admin-check-cell"
                                        data-label="Pilih"
                                    >
                                        <input
                                            type="checkbox"
                                            className="admin-checkbox"
                                            checked={selectedIds.includes(
                                                order.id,
                                            )}
                                            onChange={() =>
                                                toggleSelection(order.id)
                                            }
                                            aria-label={`Pilih pesanan ${order.id}`}
                                        />
                                    </td>
                                    <td data-label="Pesanan">
                                        <div className="admin-cell-main">
                                            <strong>{order.id}</strong>
                                            <span>
                                                {order.time} • {order.intake}
                                            </span>
                                        </div>
                                    </td>
                                    <td data-label="Pelanggan">
                                        <div className="admin-cell-main">
                                            <strong>{order.customer}</strong>
                                            <span>{order.phone}</span>
                                        </div>
                                    </td>
                                    <td data-label="Layanan">
                                        <div className="admin-cell-main">
                                            <strong>{order.service}</strong>
                                            <span>
                                                {order.weight}
                                                <span
                                                    className={`admin-source ${
                                                        order.source ===
                                                        'Chatbot AI'
                                                            ? 'is-ai'
                                                            : 'is-manual'
                                                    }`}
                                                >
                                                    {order.source ===
                                                    'Chatbot AI'
                                                        ? '✧ AI'
                                                        : 'Manual'}
                                                </span>
                                            </span>
                                        </div>
                                    </td>
                                    <td data-label="Status">
                                        <span
                                            className={`admin-status ${
                                                orderStatusTone[order.status] ??
                                                'is-info'
                                            }`}
                                        >
                                            <span aria-hidden="true" />
                                            {order.status}
                                        </span>
                                    </td>
                                    <td data-label="Pembayaran">
                                        <div className="admin-cell-main admin-payment-cell">
                                            <span
                                                className={`admin-payment ${
                                                    paymentTone[order.payment] ??
                                                    'is-neutral'
                                                }`}
                                            >
                                                {order.payment}
                                            </span>
                                            <strong>
                                                {formatRupiah(order.total)}
                                            </strong>
                                        </div>
                                    </td>
                                    <td data-label="Aksi">
                                        <Link
                                            href={route(
                                                'pengusaha.pesanan.detail',
                                                order.id,
                                            )}
                                            className="admin-detail-button"
                                            aria-label={`Buka detail pesanan ${order.id}`}
                                        >
                                            Detail
                                            <AdminIcon
                                                name="chevron"
                                                size={14}
                                            />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {visibleOrders.length === 0 && (
                        <div className="admin-empty">
                            <span className="admin-empty-icon">
                                <AdminIcon name="search" size={21} />
                            </span>
                            <strong>Tidak ada pesanan yang cocok.</strong>
                            <p>
                                Coba kata kunci lain, ubah filter, atau
                                tampilkan semua pesanan.
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
                        Menampilkan {rangeStart}–{rangeEnd} dari{' '}
                        {filteredOrders.length} pesanan
                    </span>

                    {filteredOrders.length > PAGE_SIZE && (
                        <nav
                            className="admin-pagination"
                            aria-label="Navigasi halaman pesanan"
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
                Pesanan manual dan Chatbot AI tersimpan di database dan
                diperbarui sesuai proses operasional.
            </p>

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
