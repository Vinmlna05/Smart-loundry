import AdminIcon from '@/Components/Pengusaha/AdminIcon';
import {
    adminOrders,
    dashboardOrders as orders,
    formatCompactRupiah,
    formatRupiah,
    initialsOf,
    orderStatusTone as statusTone,
    orderTimeline as timeline,
} from '@/Data/adminOrders';
import PengusahaLayout from '@/Layouts/PengusahaLayout';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const filters = [
    { key: 'all', label: 'Semua' },
    { key: 'attention', label: 'Perlu tindakan' },
    { key: 'process', label: 'Diproses' },
    { key: 'done', label: 'Selesai' },
];

const latestDateKey = adminOrders[0]?.id.split('-')[1] ?? '20261024';
const latestDate = new Date(
    `${latestDateKey.slice(0, 4)}-${latestDateKey.slice(
        4,
        6,
    )}-${latestDateKey.slice(6, 8)}T00:00:00`,
);
const dateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}${month}${day}`;
};
const todayOrders = adminOrders.filter((order) =>
    order.id.includes(latestDateKey),
);
const paidOrders = adminOrders.filter(
    (order) => order.payment === 'Lunas',
);
const todayPaidOrders = todayOrders.filter(
    (order) => order.payment === 'Lunas',
);
const waitingPaymentOrders = adminOrders.filter(
    (order) => order.status === 'Menunggu pembayaran',
);
const pendingWeighOrders = adminOrders.filter(
    (order) => order.status === 'Perlu ditimbang',
);
const readyOrders = adminOrders.filter(
    (order) => order.status === 'Siap diambil',
);
const attentionOrders = adminOrders.filter(
    (order) => order.group === 'attention',
);
const activeOrders = adminOrders.filter((order) =>
    ['attention', 'process'].includes(order.group),
);
const paidRevenue = paidOrders.reduce(
    (total, order) => total + order.total,
    0,
);
const todayPaidRevenue = todayPaidOrders.reduce(
    (total, order) => total + order.total,
    0,
);
const waitingPaymentTotal = waitingPaymentOrders.reduce(
    (total, order) => total + order.total,
    0,
);
const sampleDateLabel = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
}).format(latestDate);

const stats = [
    {
        label: 'Pesanan hari ini',
        value: String(todayOrders.length),
        note: `Pesanan masuk pada ${sampleDateLabel}`,
        trend: 'Hari ini',
        trendTone: 'is-up',
        tone: 'is-teal',
        icon: 'orders',
    },
    {
        label: 'Perlu tindakan',
        value: String(attentionOrders.length),
        note: 'Jemput, timbang, atau konfirmasi bayar',
        trend: 'Perlu tindakan',
        trendTone: 'is-warning',
        tone: 'is-blue',
        icon: 'queue',
    },
    {
        label: 'Menunggu pembayaran',
        value: String(waitingPaymentOrders.length),
        note: `${formatRupiah(waitingPaymentTotal)} belum masuk`,
        trend: 'Kirim pengingat',
        trendTone: 'is-warning',
        tone: 'is-gold',
        icon: 'payments',
    },
    {
        label: 'Pendapatan hari ini',
        value: formatRupiah(todayPaidRevenue),
        note: `Dari ${todayPaidOrders.length} transaksi lunas`,
        trend: `Total ${formatCompactRupiah(paidRevenue)}`,
        trendTone: 'is-up',
        tone: 'is-green',
        icon: 'trend',
    },
];

const tasks = [
    {
        id: 'timbang',
        title: `Timbang ${pendingWeighOrders.length} pesanan masuk`,
        meta: 'Penimbangan • sebelum 10.30',
        priority: 'Tinggi',
        priorityTone: 'is-high',
    },
    {
        id: 'pembayaran',
        title: `Konfirmasi ${waitingPaymentOrders.length} pembayaran`,
        meta: 'Pembayaran • sebelum 11.00',
        priority: 'Tinggi',
        priorityTone: 'is-high',
    },
    {
        id: 'pengantaran',
        title: `Hubungi ${readyOrders.length} pelanggan siap diambil`,
        meta: 'Penyerahan • sekitar 13.00',
        priority: 'Normal',
        priorityTone: 'is-normal',
    },
    {
        id: 'chat',
        title: 'Balas 3 chat pelanggan',
        meta: 'Chatbot • tanpa tenggat',
        priority: 'Normal',
        priorityTone: 'is-normal',
    },
];

const revenueByDate = paidOrders.reduce((totals, order) => {
    const orderDate = order.id.split('-')[1];

    totals[orderDate] = (totals[orderDate] ?? 0) + order.total;

    return totals;
}, {});

const revenueData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(latestDate);

    date.setDate(latestDate.getDate() - 6 + index);

    return {
        day: new Intl.DateTimeFormat('id-ID', {
            weekday: 'short',
        }).format(date),
        value: revenueByDate[dateKey(date)] ?? 0,
    };
});

const ordersWithStatus = (status) =>
    adminOrders.filter((order) => order.status === status).length;

const stages = [
    {
        label: 'Menunggu jemput',
        count: ordersWithStatus('Menunggu penjemputan'),
        note: 'Petugas belum menjemput',
        icon: 'truck',
        tone: 'is-blue',
    },
    {
        label: 'Diterima',
        count: ordersWithStatus('Perlu ditimbang'),
        note: 'Belum ditimbang',
        icon: 'package',
        tone: 'is-teal',
    },
    {
        label: 'Menunggu bayar',
        count: ordersWithStatus('Menunggu pembayaran'),
        note: 'Nota sudah diterbitkan',
        icon: 'queue',
        tone: 'is-gold',
    },
    {
        label: 'Sedang dicuci',
        count: ordersWithStatus('Sedang dicuci'),
        note: 'Sedang dikerjakan',
        icon: 'spark',
        tone: 'is-teal',
    },
    {
        label: 'Siap diambil',
        count: ordersWithStatus('Siap diambil'),
        note: 'Belum dihubungi',
        icon: 'check',
        tone: 'is-green',
    },
];

const serviceMix = Object.entries(
    adminOrders.reduce((services, order) => {
        services[order.service] = (services[order.service] ?? 0) + 1;

        return services;
    }, {}),
)
    .map(([name, count]) => ({
        name,
        orders: count,
        percent: Math.round((count / adminOrders.length) * 100),
    }))
    .sort((first, second) => second.orders - first.orders);

export default function PengusahaDashboard() {
    const user = usePage().props.auth.user;
    const [activeFilter, setActiveFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [completedTasks, setCompletedTasks] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [toast, setToast] = useState('');

    const firstName = user?.name?.split(' ')[0] ?? 'Pengusaha';
    const hour = new Date().getHours();
    const greeting =
        hour < 11
            ? 'Selamat pagi'
            : hour < 15
              ? 'Selamat siang'
              : hour < 19
                ? 'Selamat sore'
                : 'Selamat malam';

    const filteredOrders = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return orders.filter((order) => {
            if (activeFilter !== 'all' && order.group !== activeFilter) {
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
            ].some((value) => value.toLowerCase().includes(keyword));
        });
    }, [activeFilter, search]);

    const filterCounts = useMemo(
        () =>
            filters.reduce((counts, filter) => {
                counts[filter.key] =
                    filter.key === 'all'
                        ? orders.length
                        : orders.filter(
                              (order) => order.group === filter.key,
                          ).length;

                return counts;
            }, {}),
        [],
    );

    const completedCount = completedTasks.length;
    const taskProgress = Math.round((completedCount / tasks.length) * 100);
    const maxRevenue = Math.max(...revenueData.map((item) => item.value));
    const weeklyRevenue = revenueData.reduce(
        (total, item) => total + item.value,
        0,
    );
    const todayIndex = revenueData.length - 1;

    useEffect(() => {
        if (!selectedOrder) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setSelectedOrder(null);
            }
        };

        document.body.classList.add('admin-drawer-open');
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.classList.remove('admin-drawer-open');
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedOrder]);

    useEffect(() => {
        if (!toast) {
            return undefined;
        }

        const timeout = window.setTimeout(() => setToast(''), 3000);

        return () => window.clearTimeout(timeout);
    }, [toast]);

    const toggleTask = (taskId) => {
        setCompletedTasks((previous) =>
            previous.includes(taskId)
                ? previous.filter((id) => id !== taskId)
                : [...previous, taskId],
        );
    };

    const downloadSummary = () => {
        const rows = [
            [
                'Nomor pesanan',
                'Pelanggan',
                'WhatsApp',
                'Layanan',
                'Berat',
                'Status',
                'Total',
                'Sumber',
            ],
            ...orders.map((order) => [
                order.id,
                order.customer,
                order.phone,
                order.service,
                order.weight,
                order.status,
                order.total,
                order.source,
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
        link.download = `ringkasan-cleanora-${new Date()
            .toISOString()
            .slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        setToast('Ringkasan pesanan berhasil diunduh.');
    };

    const resetFilters = () => {
        setActiveFilter('all');
        setSearch('');
    };

    return (
        <PengusahaLayout
            title="Dashboard Pengusaha — Cleanora"
            active="dashboard"
            breadcrumb="Ringkasan"
        >
            <div className="admin-page-head">
                <div className="admin-page-heading">
                    <span className="admin-eyebrow">
                        <span aria-hidden="true">✦</span>
                        Ringkasan operasional
                    </span>
                    <h1>
                        {greeting}, <em>{firstName}.</em>
                    </h1>
                    <p>
                        Berikut kondisi Cleanora hari ini. Mulai dari pesanan
                        yang perlu ditindaklanjuti hingga pendapatan lunas.
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
                        onClick={downloadSummary}
                    >
                        <AdminIcon name="download" size={16} />
                        Unduh ringkasan
                    </button>
                    <Link
                        href={route('pengusaha.pesanan')}
                        className="admin-button admin-button-primary"
                    >
                        Lihat semua pesanan
                        <AdminIcon name="arrow" size={16} />
                    </Link>
                </div>
            </div>

            <section className="admin-stats" aria-label="Ringkasan angka">
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
                        <span className="admin-stat-note">{stat.note}</span>
                    </article>
                ))}
            </section>

            <div className="admin-dashboard-grid">
                <section
                    className="admin-card admin-orders"
                    id="pesanan-terbaru"
                >
                    <div className="admin-card-head">
                        <div>
                            <span className="admin-card-label">PESANAN</span>
                            <h2>Pesanan terbaru</h2>
                            <p>Pantau dan tindak lanjuti pesanan yang masuk.</p>
                        </div>
                        <span className="admin-live">
                            <span aria-hidden="true" />
                            Diperbarui 2 menit lalu
                        </span>
                    </div>

                    <div className="admin-orders-toolbar">
                        <div
                            className="admin-tabs"
                            role="tablist"
                            aria-label="Filter pesanan"
                        >
                            {filters.map((filter) => (
                                <button
                                    key={filter.key}
                                    type="button"
                                    role="tab"
                                    aria-selected={
                                        activeFilter === filter.key
                                    }
                                    className={`admin-tab${
                                        activeFilter === filter.key
                                            ? ' is-active'
                                            : ''
                                    }`}
                                    onClick={() =>
                                        setActiveFilter(filter.key)
                                    }
                                >
                                    {filter.label}
                                    <span>{filterCounts[filter.key]}</span>
                                </button>
                            ))}
                        </div>

                        <label className="admin-search">
                            <AdminIcon name="search" size={16} />
                            <span className="sr-only">Cari pesanan</span>
                            <input
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Cari nomor atau nama..."
                            />
                        </label>
                    </div>

                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th scope="col">Pesanan</th>
                                    <th scope="col">Pelanggan</th>
                                    <th scope="col">Layanan</th>
                                    <th scope="col">Status</th>
                                    <th scope="col">Total</th>
                                    <th scope="col">
                                        <span className="sr-only">Aksi</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map((order) => (
                                    <tr key={order.id}>
                                        <td data-label="Pesanan">
                                            <div className="admin-cell-main">
                                                <strong>{order.id}</strong>
                                                <span>
                                                    {order.time} •{' '}
                                                    {order.intake}
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
                                                    statusTone[order.status] ??
                                                    'is-info'
                                                }`}
                                            >
                                                <span aria-hidden="true" />
                                                {order.status}
                                            </span>
                                        </td>
                                        <td data-label="Total">
                                            <div className="admin-cell-main admin-cell-total">
                                                <strong>
                                                    {formatRupiah(order.total)}
                                                </strong>
                                                <span>{order.payment}</span>
                                            </div>
                                        </td>
                                        <td data-label="Aksi">
                                            <button
                                                type="button"
                                                className="admin-detail-button"
                                                onClick={() =>
                                                    setSelectedOrder(order)
                                                }
                                                aria-label={`Lihat detail pesanan ${order.id}`}
                                            >
                                                Detail
                                                <AdminIcon
                                                    name="chevron"
                                                    size={14}
                                                />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredOrders.length === 0 && (
                            <div className="admin-empty">
                                <span className="admin-empty-icon">
                                    <AdminIcon name="search" size={21} />
                                </span>
                                <strong>
                                    Tidak ada pesanan yang cocok.
                                </strong>
                                <p>
                                    Coba kata kunci lain atau tampilkan semua
                                    pesanan.
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

                    <div className="admin-table-foot">
                        <span>
                            Menampilkan {filteredOrders.length} dari{' '}
                            {orders.length} pesanan terbaru
                        </span>
                        <div className="admin-table-foot-actions">
                            {(activeFilter !== 'all' || search) && (
                                <button type="button" onClick={resetFilters}>
                                    Reset filter
                                </button>
                            )}
                            <Link
                                href={route('pengusaha.pesanan')}
                                className="admin-table-foot-link"
                            >
                                Lihat semua
                                <AdminIcon name="arrow" size={13} />
                            </Link>
                        </div>
                    </div>
                </section>

                <div className="admin-side-stack">
                    <section
                        className="admin-card admin-tasks"
                        id="tugas-hari-ini"
                    >
                        <div className="admin-card-head">
                            <div>
                                <span className="admin-card-label">
                                    TUGAS
                                </span>
                                <h2>Tugas hari ini</h2>
                            </div>
                            <span className="admin-count-badge">
                                {tasks.length - completedCount} tersisa
                            </span>
                        </div>

                        <div className="admin-task-progress">
                            <div className="admin-progress-track">
                                <span
                                    style={{ width: `${taskProgress}%` }}
                                />
                            </div>
                            <span>
                                {completedCount}/{tasks.length} selesai
                            </span>
                        </div>

                        <div className="admin-task-list">
                            {tasks.map((task) => {
                                const isDone = completedTasks.includes(
                                    task.id,
                                );

                                return (
                                    <label
                                        key={task.id}
                                        className={`admin-task${
                                            isDone ? ' is-done' : ''
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isDone}
                                            onChange={() =>
                                                toggleTask(task.id)
                                            }
                                        />
                                        <span
                                            className="admin-task-check"
                                            aria-hidden="true"
                                        >
                                            <AdminIcon
                                                name="check"
                                                size={12}
                                            />
                                        </span>
                                        <span className="admin-task-text">
                                            <strong>{task.title}</strong>
                                            <small>{task.meta}</small>
                                        </span>
                                        <span
                                            className={`admin-task-priority ${task.priorityTone}`}
                                        >
                                            {task.priority}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>

                        <p className="admin-task-note">
                            <AdminIcon name="alert" size={14} />
                            Dua tugas prioritas tinggi perlu selesai sebelum
                            pukul 11.00.
                        </p>
                    </section>

                    <section
                        className="admin-card admin-revenue"
                        id="pendapatan"
                    >
                        <div className="admin-card-head">
                            <div>
                                <span className="admin-card-label">
                                    PENDAPATAN
                                </span>
                                <h2>7 hari terakhir</h2>
                            </div>
                            <span className="admin-revenue-icon">
                                <AdminIcon name="trend" size={17} />
                            </span>
                        </div>

                        <div className="admin-revenue-total">
                            <strong>{formatCompactRupiah(weeklyRevenue)}</strong>
                            <span className="is-up">Lunas</span>
                        </div>
                        <p className="admin-revenue-caption">
                            Pendapatan lunas 7 hari terakhir. Hari ini
                            menyumbang {formatCompactRupiah(todayPaidRevenue)}.
                        </p>

                        <div className="admin-chart" aria-hidden="true">
                            {revenueData.map((item, index) => (
                                <div
                                    key={item.day}
                                    className={`admin-chart-column${
                                        index === todayIndex
                                            ? ' is-today'
                                            : ''
                                    }`}
                                    title={`${item.day}: ${formatRupiah(
                                        item.value,
                                    )}`}
                                >
                                    <span
                                        className="admin-chart-bar"
                                        style={{
                                            height: `${Math.max(
                                                8,
                                                Math.round(
                                                    (item.value / maxRevenue) *
                                                        100,
                                                ),
                                            )}%`,
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="admin-chart-axis" aria-hidden="true">
                            {revenueData.map((item, index) => (
                                <span
                                    key={item.day}
                                    className={
                                        index === todayIndex
                                            ? 'is-today'
                                            : undefined
                                    }
                                >
                                    {item.day}
                                </span>
                            ))}
                        </div>

                        <div className="admin-revenue-foot">
                            <span>Rata-rata harian</span>
                            <strong>
                                {formatRupiah(
                                    Math.round(weeklyRevenue / 7),
                                )}
                            </strong>
                        </div>
                    </section>
                </div>
            </div>

            <div className="admin-lower-grid">
                <section className="admin-card admin-pipeline" id="alur-pesanan">
                    <div className="admin-card-head">
                        <div>
                            <span className="admin-card-label">
                                ANTREAN
                            </span>
                            <h2>Alur pesanan aktif</h2>
                            <p>
                                Sebaran cucian di setiap tahap operasional.
                            </p>
                        </div>
                        <span className="admin-pipeline-total">
                            {activeOrders.length} aktif
                        </span>
                    </div>

                    <div className="admin-stage-grid">
                        {stages.map((stage) => (
                            <article
                                key={stage.label}
                                className={`admin-stage ${stage.tone}`}
                            >
                                <span className="admin-stage-icon">
                                    <AdminIcon
                                        name={stage.icon}
                                        size={18}
                                    />
                                </span>
                                <strong>{stage.count}</strong>
                                <span className="admin-stage-label">
                                    {stage.label}
                                </span>
                                <small>{stage.note}</small>
                            </article>
                        ))}
                    </div>

                    <div className="admin-pipeline-foot">
                        <span>
                            <span className="admin-pipeline-dot" />
                            {waitingPaymentOrders.length} pesanan menunggu
                            pembayaran
                        </span>
                        <Link
                            href={`${route(
                                'pengusaha.pesanan',
                            )}?status=${encodeURIComponent(
                                'Menunggu pembayaran',
                            )}`}
                            className="admin-pipeline-link"
                        >
                            Lihat pesanan
                            <AdminIcon name="arrow" size={14} />
                        </Link>
                    </div>
                </section>

                <section className="admin-card admin-services">
                    <div className="admin-card-head">
                        <div>
                            <span className="admin-card-label">
                                LAYANAN
                            </span>
                            <h2>Layanan terlaris</h2>
                            <p>Berdasarkan jumlah pesanan contoh.</p>
                        </div>
                        <span className="admin-services-total">
                            {adminOrders.length}
                        </span>
                    </div>

                    <div className="admin-service-list">
                        {serviceMix.map((service, index) => (
                            <div
                                key={service.name}
                                className="admin-service-row"
                            >
                                <span className="admin-service-rank">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <div className="admin-service-info">
                                    <div>
                                        <strong>{service.name}</strong>
                                        <span>{service.orders} pesanan</span>
                                    </div>
                                    <div className="admin-service-bar">
                                        <span
                                            style={{
                                                width: `${service.percent}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                                <strong className="admin-service-percent">
                                    {service.percent}%
                                </strong>
                            </div>
                        ))}
                    </div>

                    <div className="admin-services-foot">
                        <AdminIcon name="spark" size={14} />
                        Cuci dan Setrika tetap menjadi layanan favorit
                        pelanggan.
                    </div>
                </section>
            </div>

            <p className="admin-dashboard-note">
                Semua angka dan pesanan pada halaman ini adalah data contoh
                untuk pratinjau tampilan dashboard.
            </p>

            {selectedOrder && (
                <div
                    className="admin-drawer"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="admin-drawer-title"
                >
                    <button
                        type="button"
                        className="admin-drawer-backdrop"
                        aria-label="Tutup detail pesanan"
                        onClick={() => setSelectedOrder(null)}
                    />

                    <aside className="admin-drawer-panel">
                        <div className="admin-drawer-head">
                            <div>
                                <span className="admin-card-label">
                                    DETAIL PESANAN
                                </span>
                                <h2 id="admin-drawer-title">
                                    {selectedOrder.id}
                                </h2>
                            </div>
                            <button
                                type="button"
                                className="admin-icon-button"
                                aria-label="Tutup detail pesanan"
                                onClick={() => setSelectedOrder(null)}
                            >
                                <AdminIcon name="close" size={18} />
                            </button>
                        </div>

                        <div className="admin-drawer-body">
                            <div className="admin-drawer-status">
                                <span
                                    className={`admin-status ${
                                        statusTone[selectedOrder.status] ??
                                        'is-info'
                                    }`}
                                >
                                    <span aria-hidden="true" />
                                    {selectedOrder.status}
                                </span>
                                <span className="admin-source is-neutral">
                                    {selectedOrder.source}
                                </span>
                            </div>

                            <div className="admin-drawer-customer">
                                <span className="admin-avatar">
                                    {initialsOf(selectedOrder.customer)}
                                </span>
                                <div>
                                    <strong>{selectedOrder.customer}</strong>
                                    <small>{selectedOrder.phone}</small>
                                </div>
                                <span className="admin-drawer-time">
                                    {selectedOrder.time}
                                </span>
                            </div>

                            <dl className="admin-drawer-grid">
                                <div>
                                    <dt>Layanan</dt>
                                    <dd>{selectedOrder.service}</dd>
                                </div>
                                <div>
                                    <dt>Berat</dt>
                                    <dd>{selectedOrder.weight}</dd>
                                </div>
                                <div>
                                    <dt>Metode</dt>
                                    <dd>{selectedOrder.intake}</dd>
                                </div>
                                <div>
                                    <dt>Pembayaran</dt>
                                    <dd>{selectedOrder.payment}</dd>
                                </div>
                                <div>
                                    <dt>Total</dt>
                                    <dd className="admin-drawer-total">
                                        {formatRupiah(selectedOrder.total)}
                                    </dd>
                                </div>
                                <div>
                                    <dt>Nomor pesanan</dt>
                                    <dd>{selectedOrder.id}</dd>
                                </div>
                            </dl>

                            <div className="admin-drawer-timeline">
                                <span className="admin-card-label">
                                    PROGRES PESANAN
                                </span>
                                <ol>
                                    {timeline.map((step, index) => {
                                        const stepClass =
                                            index < selectedOrder.step
                                                ? 'is-done'
                                                : index === selectedOrder.step
                                                  ? 'is-current'
                                                  : '';

                                        return (
                                            <li
                                                key={step.label}
                                                className={stepClass}
                                            >
                                                <span className="admin-timeline-dot">
                                                    {index <
                                                    selectedOrder.step ? (
                                                        <AdminIcon
                                                            name="check"
                                                            size={11}
                                                        />
                                                    ) : (
                                                        index + 1
                                                    )}
                                                </span>
                                                <div>
                                                    <strong>
                                                        {step.label}
                                                    </strong>
                                                    <small>
                                                        {step.detail}
                                                    </small>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ol>
                            </div>
                        </div>

                        <div className="admin-drawer-foot">
                            <p>
                                Data contoh untuk pratinjau dashboard. Detail
                                pesanan akan terhubung ke data sebenarnya.
                            </p>
                            <button
                                type="button"
                                className="admin-button admin-button-primary"
                                onClick={() => setSelectedOrder(null)}
                            >
                                Tutup
                            </button>
                        </div>
                    </aside>
                </div>
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
