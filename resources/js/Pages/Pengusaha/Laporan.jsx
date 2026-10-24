import '../../../css/pengusaha-laporan.css';

import AdminIcon from '@/Components/Pengusaha/AdminIcon';
import { formatRupiah, initialsOf, orderStatusTone } from '@/Data/adminOrders';
import {
    formatReportDateKey,
    formatReportDateTime,
    formatReportRange,
    formatReportWeekday,
    reportEarliestDateKey,
    reportLatestDateKey,
    reportPaymentStatuses,
    reportPeriodOptions,
    reportTransactions,
    shiftDateKey,
} from '@/Data/adminReports';
import PengusahaLayout from '@/Layouts/PengusahaLayout';
import { Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const PAGE_SIZE = 7;

const paymentTone = {
    Lunas: 'is-success',
    'Perlu konfirmasi': 'is-warning',
    'Belum dibayar': 'is-danger',
    'Belum ditagih': 'is-done',
    'Tidak perlu bayar': 'is-done',
};

const methodTone = {
    'Transfer bank': 'is-teal',
    QRIS: 'is-blue',
    Tunai: 'is-gold',
};

const sourceClass = (source) =>
    source === 'Chatbot AI' ? 'is-ai' : 'is-manual';

const methodLabel = (transaction) =>
    transaction.paymentMethod === '-'
        ? 'Belum ada metode'
        : `${transaction.paymentMethod} · ${transaction.paymentChannel}`;

export default function PengusahaLaporan() {
    const [period, setPeriod] = useState('all');
    const [source, setSource] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [page, setPage] = useState(1);
    const [toast, setToast] = useState('');

    const periodDays =
        reportPeriodOptions.find((option) => option.value === period)
            ?.days ?? null;
    const periodStartKey = periodDays
        ? shiftDateKey(reportLatestDateKey, -(periodDays - 1))
        : null;

    const scopedTransactions = useMemo(
        () =>
            reportTransactions.filter((transaction) => {
                if (
                    source !== 'all' &&
                    transaction.source !== source
                ) {
                    return false;
                }

                if (
                    periodStartKey &&
                    transaction.dateKey < periodStartKey
                ) {
                    return false;
                }

                return true;
            }),
        [periodStartKey, source],
    );

    const activeTransactions = useMemo(
        () =>
            scopedTransactions.filter(
                (transaction) => !transaction.isCanceled,
            ),
        [scopedTransactions],
    );

    const paidTransactions = useMemo(
        () =>
            activeTransactions.filter(
                (transaction) =>
                    transaction.paymentStatus === 'Lunas',
            ),
        [activeTransactions],
    );

    const totalValue = activeTransactions.reduce(
        (total, transaction) => total + transaction.amount,
        0,
    );
    const paidValue = paidTransactions.reduce(
        (total, transaction) => total + transaction.amount,
        0,
    );
    const outstandingValue = totalValue - paidValue;
    const averageValue =
        activeTransactions.length > 0
            ? Math.round(totalValue / activeTransactions.length)
            : 0;
    const paidRate =
        totalValue > 0 ? Math.round((paidValue / totalValue) * 100) : 0;
    const canceledCount = scopedTransactions.filter(
        (transaction) => transaction.isCanceled,
    ).length;
    const outstandingCount =
        activeTransactions.length - paidTransactions.length;

    const latestOrderKey =
        scopedTransactions.length > 0
            ? scopedTransactions.reduce(
                  (latest, transaction) =>
                      transaction.dateKey > latest
                          ? transaction.dateKey
                          : latest,
                  '',
              )
            : reportLatestDateKey;
    const latestPaymentKey = paidTransactions.reduce(
        (latest, transaction) =>
            transaction.paidDateKey &&
            transaction.paidDateKey > latest
                ? transaction.paidDateKey
                : latest,
        '',
    );
    const chartEndKey =
        latestPaymentKey > latestOrderKey
            ? latestPaymentKey
            : latestOrderKey;
    const chartStartKey = periodStartKey
        ? periodStartKey
        : activeTransactions.length > 0
          ? activeTransactions.reduce(
                (earliest, transaction) =>
                    !earliest || transaction.dateKey < earliest
                        ? transaction.dateKey
                        : earliest,
                '',
            )
          : chartEndKey;

    const chartDays = useMemo(() => {
        if (!chartStartKey || !chartEndKey) {
            return [];
        }

        const days = [];
        let cursor = chartStartKey;
        let guard = 0;

        while (cursor <= chartEndKey && guard < 366) {
            const revenue = paidTransactions
                .filter(
                    (transaction) =>
                        transaction.paidDateKey === cursor,
                )
                .reduce(
                    (total, transaction) =>
                        total + transaction.amount,
                    0,
                );

            days.push({
                key: cursor,
                revenue,
                orders: activeTransactions.filter(
                    (transaction) => transaction.dateKey === cursor,
                ).length,
                weekday: formatReportWeekday(cursor),
                dateLabel: formatReportDateKey(cursor),
            });

            cursor = shiftDateKey(cursor, 1);
            guard += 1;
        }

        return days;
    }, [
        activeTransactions,
        chartEndKey,
        chartStartKey,
        paidTransactions,
    ]);

    const maxDailyRevenue = Math.max(
        ...chartDays.map((day) => day.revenue),
        1,
    );
    const paidDays = chartDays.filter((day) => day.revenue > 0).length;
    const averageDailyRevenue =
        paidDays > 0 ? Math.round(paidValue / paidDays) : 0;
    const peakDay = chartDays.reduce(
        (peak, day) => (day.revenue > peak.revenue ? day : peak),
        chartDays[0] ?? { revenue: 0, dateLabel: '-', weekday: '-' },
    );
    const labelStep =
        chartDays.length > 21 ? 5 : chartDays.length > 10 ? 2 : 1;
    const chartEmptyMessage =
        activeTransactions.length === 0
            ? 'Belum ada transaksi pada filter ini.'
            : paidTransactions.length === 0
              ? 'Belum ada pembayaran lunas pada filter ini.'
              : '';

    const methodRows = useMemo(() => {
        const totals = paidTransactions.reduce(
            (methods, transaction) => {
                const method = transaction.paymentMethod;
                const existing = methods[method] ?? {
                    name: method,
                    amount: 0,
                    count: 0,
                };

                existing.amount += transaction.amount;
                existing.count += 1;
                methods[method] = existing;

                return methods;
            },
            {},
        );

        return Object.values(totals)
            .map((method) => ({
                ...method,
                share:
                    paidValue > 0
                        ? Math.round((method.amount / paidValue) * 100)
                        : 0,
                tone: methodTone[method.name] ?? 'is-teal',
            }))
            .sort((first, second) => second.amount - first.amount);
    }, [paidTransactions, paidValue]);

    const serviceRows = useMemo(() => {
        const totals = activeTransactions.reduce(
            (services, transaction) => {
                const existing = services[transaction.service] ?? {
                    name: transaction.service,
                    orders: 0,
                    paidOrders: 0,
                    value: 0,
                };

                existing.orders += 1;
                existing.value += transaction.amount;

                if (transaction.paymentStatus === 'Lunas') {
                    existing.paidOrders += 1;
                }

                services[transaction.service] = existing;

                return services;
            },
            {},
        );

        return Object.values(totals)
            .map((service) => ({
                ...service,
                share:
                    totalValue > 0
                        ? Math.round((service.value / totalValue) * 100)
                        : 0,
            }))
            .sort((first, second) => second.value - first.value);
    }, [activeTransactions, totalValue]);

    const filteredTransactions = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return scopedTransactions
            .filter((transaction) => {
                if (
                    paymentFilter !== 'all' &&
                    transaction.paymentStatus !== paymentFilter
                ) {
                    return false;
                }

                if (!keyword) {
                    return true;
                }

                return [
                    transaction.invoiceNumber,
                    transaction.id,
                    transaction.customer,
                    transaction.phone,
                    transaction.service,
                    transaction.source,
                    transaction.paymentMethod,
                    transaction.paymentChannel,
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

                return new Date(second.date) - new Date(first.date);
            });
    }, [paymentFilter, scopedTransactions, search, sortBy]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredTransactions.length / PAGE_SIZE),
    );
    const safePage = Math.min(page, totalPages);
    const firstIndex = (safePage - 1) * PAGE_SIZE;
    const visibleTransactions = filteredTransactions.slice(
        firstIndex,
        firstIndex + PAGE_SIZE,
    );
    const rangeStart =
        filteredTransactions.length === 0 ? 0 : firstIndex + 1;
    const rangeEnd = Math.min(
        firstIndex + PAGE_SIZE,
        filteredTransactions.length,
    );

    const summaryItems = useMemo(
        () => [
            {
                label: 'Pendapatan diterima',
                value: formatRupiah(paidValue),
                note: 'Hanya dari pembayaran lunas',
                icon: 'check',
                tone: 'is-green',
                trend: `${paidRate}% lunas`,
                trendTone: 'is-up',
            },
            {
                label: 'Nilai transaksi',
                value: formatRupiah(totalValue),
                note: `${activeTransactions.length} transaksi aktif`,
                icon: 'orders',
                tone: 'is-teal',
                trend: `${scopedTransactions.length} pesanan`,
                trendTone: 'is-neutral',
            },
            {
                label: 'Belum diterima',
                value: formatRupiah(outstandingValue),
                note: 'Belum dibayar atau belum ditagih',
                icon: 'alert',
                tone: 'is-gold',
                trend: `${outstandingCount} tagihan`,
                trendTone: 'is-warning',
            },
            {
                label: 'Rata-rata transaksi',
                value: formatRupiah(averageValue),
                note: 'Per transaksi aktif',
                icon: 'trend',
                tone: 'is-blue',
                trend: `${canceledCount} dibatalkan`,
                trendTone: 'is-neutral',
            },
        ],
        [
            activeTransactions.length,
            averageValue,
            canceledCount,
            outstandingCount,
            outstandingValue,
            paidRate,
            paidValue,
            scopedTransactions.length,
            totalValue,
        ],
    );

    const hasScopeFilters = period !== 'all' || source !== 'all';
    const hasTableFilters =
        paymentFilter !== 'all' || search !== '' || sortBy !== 'newest';
    const reportStartKey = periodStartKey ?? reportEarliestDateKey;

    useEffect(() => {
        setPage(1);
    }, [paymentFilter, period, search, sortBy, source]);

    useEffect(() => {
        if (!toast) {
            return undefined;
        }

        const timeout = window.setTimeout(() => setToast(''), 3000);

        return () => window.clearTimeout(timeout);
    }, [toast]);

    const resetScopeFilters = () => {
        setPeriod('all');
        setSource('all');
    };

    const resetTableFilters = () => {
        setPaymentFilter('all');
        setSearch('');
        setSortBy('newest');
    };

    const resetAllFilters = () => {
        resetScopeFilters();
        resetTableFilters();
    };

    const downloadReport = () => {
        if (filteredTransactions.length === 0) {
            setToast('Tidak ada transaksi yang bisa diunduh.');

            return;
        }

        const rows = [
            [
                'Tanggal',
                'Jam',
                'Nomor pesanan',
                'Nomor nota',
                'Pelanggan',
                'WhatsApp',
                'Layanan',
                'Sumber',
                'Metode pengambilan',
                'Nilai transaksi',
                'Status pembayaran',
                'Tanggal bayar',
                'Metode pembayaran',
                'Status pesanan',
            ],
            ...filteredTransactions.map((transaction) => [
                formatReportDateKey(transaction.dateKey),
                transaction.time,
                transaction.id,
                transaction.invoiceNumber,
                transaction.customer,
                transaction.phone,
                transaction.service,
                transaction.source,
                transaction.intake,
                transaction.amount,
                transaction.paymentStatus,
                transaction.paidAt
                    ? formatReportDateTime(transaction.paidAt)
                    : '-',
                methodLabel(transaction),
                transaction.orderStatus,
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
        link.download = `cleanora-laporan-${reportLatestDateKey}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);

        setToast(
            `${filteredTransactions.length} transaksi berhasil diunduh.`,
        );
    };

    const printReport = () => {
        if (scopedTransactions.length === 0) {
            setToast('Tidak ada transaksi yang bisa dicetak.');

            return;
        }

        window.print();
    };

    return (
        <PengusahaLayout
            title="Laporan Transaksi - Cleanora"
            active="reports"
            breadcrumb="Laporan transaksi"
        >
            <div className="admin-report-page">
                <div className="admin-page-head">
                    <div className="admin-page-heading">
                        <span className="admin-eyebrow">
                            <span aria-hidden="true">
                                <AdminIcon name="reports" size={12} />
                            </span>
                            Analisis usaha
                        </span>
                        <h1>
                            Laporan <em>transaksi.</em>
                        </h1>
                        <p>
                            Lihat pendapatan, nilai pesanan, layanan
                            terlaris, dan rincian transaksi dalam satu
                            laporan.
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
                            onClick={printReport}
                        >
                            <AdminIcon name="printer" size={16} />
                            Cetak laporan
                        </button>
                        <button
                            type="button"
                            className="admin-button admin-button-primary"
                            onClick={downloadReport}
                        >
                            <AdminIcon name="download" size={16} />
                            Unduh CSV
                        </button>
                    </div>
                </div>

                <section
                    className="admin-report-filter"
                    aria-label="Filter laporan"
                >
                    <div className="admin-report-filter-main">
                        <span className="admin-report-filter-icon">
                            <AdminIcon name="calendar" size={18} />
                        </span>

                        <label className="admin-report-filter-field">
                            <span>Periode</span>
                            <span className="admin-select">
                                <select
                                    value={period}
                                    onChange={(event) =>
                                        setPeriod(event.target.value)
                                    }
                                >
                                    {reportPeriodOptions.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <AdminIcon name="chevron" size={13} />
                            </span>
                        </label>

                        <label className="admin-report-filter-field">
                            <span>Sumber pesanan</span>
                            <span className="admin-select">
                                <select
                                    value={source}
                                    onChange={(event) =>
                                        setSource(event.target.value)
                                    }
                                >
                                    <option value="all">
                                        Semua sumber
                                    </option>
                                    <option value="Manual">Manual</option>
                                    <option value="Chatbot AI">
                                        Chatbot AI
                                    </option>
                                </select>
                                <AdminIcon name="chevron" size={13} />
                            </span>
                        </label>

                        {hasScopeFilters && (
                            <button
                                type="button"
                                className="admin-filter-reset"
                                onClick={resetScopeFilters}
                            >
                                Atur ulang
                            </button>
                        )}
                    </div>

                    <div className="admin-report-range">
                        <span>Rentang laporan</span>
                        <strong>
                            {formatReportRange(
                                reportStartKey,
                                reportLatestDateKey,
                            )}
                        </strong>
                    </div>
                </section>

                <section
                    className="admin-stats admin-report-stats"
                    aria-label="Ringkasan laporan"
                >
                    {summaryItems.map((stat) => (
                        <article
                            key={stat.label}
                            className={`admin-stat ${stat.tone}`}
                        >
                            <div className="admin-stat-top">
                                <span className="admin-stat-icon">
                                    <AdminIcon
                                        name={stat.icon}
                                        size={19}
                                    />
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

                <div className="admin-report-grid">
                    <section className="admin-card admin-report-chart-card">
                        <div className="admin-card-head">
                            <div>
                                <span className="admin-card-label">
                                    PENDAPATAN
                                </span>
                                <h2>Pendapatan harian</h2>
                                <p>
                                    Hanya pembayaran lunas pada periode
                                    terpilih.
                                </p>
                            </div>
                            <span className="admin-report-count">
                                {paidDays} hari terbayar
                            </span>
                        </div>

                        <div className="admin-report-chart-total">
                            <strong>{formatRupiah(paidValue)}</strong>
                            <span>
                                {paidTransactions.length} pembayaran lunas
                            </span>
                        </div>

                        {chartEmptyMessage ? (
                            <div className="admin-report-empty-chart">
                                <AdminIcon name="reports" size={20} />
                                <span>{chartEmptyMessage}</span>
                            </div>
                        ) : (
                            <>
                                <div
                                    className="admin-report-chart"
                                    role="img"
                                    aria-label={`Grafik pendapatan harian, total ${formatRupiah(
                                        paidValue,
                                    )}`}
                                >
                                    {chartDays.map((day) => (
                                        <div
                                            key={day.key}
                                            className={`admin-report-chart-column${
                                                day.revenue === 0
                                                    ? ' is-empty'
                                                    : ''
                                            }${
                                                day.key === peakDay.key &&
                                                day.revenue > 0
                                                    ? ' is-peak'
                                                    : ''
                                            }`}
                                            title={`${day.dateLabel}: ${formatRupiah(
                                                day.revenue,
                                            )} dari ${day.orders} pesanan`}
                                        >
                                            <span
                                                className="admin-report-chart-bar"
                                                style={{
                                                    height:
                                                        day.revenue === 0
                                                            ? '3px'
                                                            : `${Math.max(
                                                                  6,
                                                                  Math.round(
                                                                      (day.revenue /
                                                                          maxDailyRevenue) *
                                                                          100,
                                                                  ),
                                                              )}%`,
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div
                                    className="admin-report-chart-axis"
                                    aria-hidden="true"
                                >
                                    {chartDays.map((day, index) => (
                                        <span key={day.key}>
                                            {index % labelStep === 0 ||
                                            index === chartDays.length - 1
                                                ? day.weekday
                                                : ''}
                                        </span>
                                    ))}
                                </div>

                                <div className="admin-report-chart-foot">
                                    <div>
                                        <span>Rata-rata hari aktif</span>
                                        <strong>
                                            {formatRupiah(
                                                averageDailyRevenue,
                                            )}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Hari terbaik</span>
                                        <strong>
                                            {peakDay.revenue > 0
                                                ? `${peakDay.dateLabel} · ${formatRupiah(
                                                      peakDay.revenue,
                                                  )}`
                                                : 'Belum ada'}
                                        </strong>
                                    </div>
                                </div>
                            </>
                        )}
                    </section>

                    <section className="admin-card admin-report-methods">
                        <div className="admin-card-head">
                            <div>
                                <span className="admin-card-label">
                                    PEMBAYARAN
                                </span>
                                <h2>Metode diterima</h2>
                                <p>Sebaran pembayaran yang sudah lunas.</p>
                            </div>
                            <span className="admin-report-count">
                                {methodRows.length} metode
                            </span>
                        </div>

                        <div className="admin-report-method-list">
                            {methodRows.length === 0 ? (
                                <div className="admin-report-mini-empty">
                                    Belum ada pembayaran lunas.
                                </div>
                            ) : (
                                methodRows.map((method) => (
                                    <div
                                        key={method.name}
                                        className="admin-report-method"
                                    >
                                        <span
                                            className={`admin-report-method-icon ${method.tone}`}
                                        >
                                            <AdminIcon
                                                name="payments"
                                                size={15}
                                            />
                                        </span>
                                        <div className="admin-report-method-main">
                                            <div>
                                                <strong>
                                                    {method.name}
                                                </strong>
                                                <span>
                                                    {method.count} transaksi
                                                </span>
                                            </div>
                                            <div className="admin-report-method-value">
                                                <strong>
                                                    {formatRupiah(
                                                        method.amount,
                                                    )}
                                                </strong>
                                                <span>{method.share}%</span>
                                            </div>
                                            <div className="admin-report-method-track">
                                                <span
                                                    style={{
                                                        width: `${method.share}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="admin-report-methods-foot">
                            <span>Total diterima</span>
                            <strong>{formatRupiah(paidValue)}</strong>
                        </div>
                    </section>
                </div>

                <section className="admin-card admin-report-services">
                    <div className="admin-card-head">
                        <div>
                            <span className="admin-card-label">
                                LAYANAN
                            </span>
                            <h2>Layanan terlaris</h2>
                            <p>
                                Berdasarkan nilai transaksi aktif pada
                                periode terpilih.
                            </p>
                        </div>
                        <span className="admin-report-count">
                            {serviceRows.length} layanan
                        </span>
                    </div>

                    <div className="admin-report-service-grid">
                        {serviceRows.length === 0 ? (
                            <div className="admin-report-mini-empty">
                                Belum ada transaksi untuk filter ini.
                            </div>
                        ) : (
                            serviceRows.map((service, index) => (
                                <article
                                    key={service.name}
                                    className="admin-report-service"
                                >
                                    <div className="admin-report-service-top">
                                        <span className="admin-report-service-rank">
                                            {String(index + 1).padStart(
                                                2,
                                                '0',
                                            )}
                                        </span>
                                        <span className="admin-report-service-share">
                                            {service.share}% nilai
                                        </span>
                                    </div>
                                    <strong>{service.name}</strong>
                                    <small>
                                        {service.orders} pesanan ·{' '}
                                        {service.paidOrders} lunas
                                    </small>
                                    <div className="admin-report-service-value">
                                        {formatRupiah(service.value)}
                                    </div>
                                    <div className="admin-report-service-track">
                                        <span
                                            style={{
                                                width: `${service.share}%`,
                                            }}
                                        />
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                </section>

                <section className="admin-card admin-orders admin-report-table-card">
                    <div className="admin-card-head">
                        <div>
                            <span className="admin-card-label">
                                RINCIAN
                            </span>
                            <h2>Transaksi</h2>
                            <p>
                                Semua pesanan pada periode dan sumber yang
                                dipilih, termasuk yang dibatalkan.
                            </p>
                        </div>
                        <span className="admin-orders-count">
                            {filteredTransactions.length} transaksi
                        </span>
                    </div>

                    <div className="admin-orders-toolbar admin-orders-toolbar-page">
                        <label className="admin-search admin-search-wide">
                            <AdminIcon name="search" size={16} />
                            <span className="sr-only">
                                Cari transaksi
                            </span>
                            <input
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Cari nota, pelanggan, atau layanan..."
                            />
                        </label>

                        <div className="admin-filter-group">
                            <label className="admin-select">
                                <span className="sr-only">
                                    Filter status pembayaran
                                </span>
                                <select
                                    value={paymentFilter}
                                    onChange={(event) =>
                                        setPaymentFilter(
                                            event.target.value,
                                        )
                                    }
                                >
                                    <option value="all">
                                        Semua pembayaran
                                    </option>
                                    {reportPaymentStatuses.map(
                                        (status) => (
                                            <option
                                                key={status}
                                                value={status}
                                            >
                                                {status}
                                            </option>
                                        ),
                                    )}
                                </select>
                                <AdminIcon name="chevron" size={13} />
                            </label>

                            <label className="admin-select">
                                <span className="sr-only">
                                    Urutkan transaksi
                                </span>
                                <select
                                    value={sortBy}
                                    onChange={(event) =>
                                        setSortBy(event.target.value)
                                    }
                                >
                                    <option value="newest">Terbaru</option>
                                    <option value="amount-desc">
                                        Nilai terbesar
                                    </option>
                                    <option value="amount-asc">
                                        Nilai terkecil
                                    </option>
                                    <option value="customer">
                                        Nama A-Z
                                    </option>
                                </select>
                                <AdminIcon name="chevron" size={13} />
                            </label>

                            {hasTableFilters && (
                                <button
                                    type="button"
                                    className="admin-filter-reset"
                                    onClick={resetTableFilters}
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="admin-table-wrap">
                        <table className="admin-table admin-report-table">
                            <thead>
                                <tr>
                                    <th scope="col">Tanggal</th>
                                    <th scope="col">Pesanan</th>
                                    <th scope="col">Pelanggan</th>
                                    <th scope="col">Layanan</th>
                                    <th scope="col">Nilai</th>
                                    <th scope="col">Pembayaran</th>
                                    <th scope="col">Status</th>
                                    <th scope="col">
                                        <span className="sr-only">Aksi</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleTransactions.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="admin-report-empty-cell"
                                        >
                                            <div className="admin-empty">
                                                <span className="admin-empty-icon">
                                                    <AdminIcon
                                                        name="reports"
                                                        size={20}
                                                    />
                                                </span>
                                                <strong>
                                                    Tidak ada transaksi
                                                </strong>
                                                <p>
                                                    Coba ubah periode,
                                                    sumber, atau filter
                                                    pembayaran.
                                                </p>
                                                <button
                                                    type="button"
                                                    className="admin-button admin-button-outline"
                                                    onClick={resetAllFilters}
                                                >
                                                    Tampilkan semua
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    visibleTransactions.map(
                                        (transaction) => (
                                            <tr
                                                key={transaction.id}
                                                className={
                                                    transaction.isCanceled
                                                        ? 'is-canceled'
                                                        : undefined
                                                }
                                            >
                                                <td data-label="Tanggal">
                                                    <div className="admin-report-date">
                                                        <strong>
                                                            {formatReportDateKey(
                                                                transaction.dateKey,
                                                            )}
                                                        </strong>
                                                        <span>
                                                            {transaction.time}{' '}
                                                            WIB
                                                        </span>
                                                    </div>
                                                </td>
                                                <td data-label="Pesanan">
                                                    <div className="admin-report-order">
                                                        <strong>
                                                            {
                                                                transaction.invoiceNumber
                                                            }
                                                        </strong>
                                                        <span>
                                                            {transaction.id}
                                                            <span
                                                                className={`admin-source ${sourceClass(
                                                                    transaction.source,
                                                                )}`}
                                                            >
                                                                {
                                                                    transaction.source
                                                                }
                                                            </span>
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
                                                                transaction.customer,
                                                            )}
                                                        </span>
                                                        <div className="admin-cell-main">
                                                            <strong>
                                                                {
                                                                    transaction.customer
                                                                }
                                                            </strong>
                                                            <span>
                                                                {
                                                                    transaction.phone
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td data-label="Layanan">
                                                    <div className="admin-cell-main">
                                                        <strong>
                                                            {
                                                                transaction.service
                                                            }
                                                        </strong>
                                                        <span>
                                                            {
                                                                transaction.intake
                                                            }
                                                        </span>
                                                    </div>
                                                </td>
                                                <td data-label="Nilai">
                                                    <div className="admin-cell-main admin-cell-total">
                                                        <strong>
                                                            {formatRupiah(
                                                                transaction.amount,
                                                            )}
                                                        </strong>
                                                        <span>
                                                            {transaction.isCanceled
                                                                ? 'Tidak dihitung'
                                                                : transaction.paymentStatus ===
                                                                    'Lunas'
                                                                  ? 'Diterima'
                                                                  : 'Belum diterima'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td data-label="Pembayaran">
                                                    <div className="admin-report-payment">
                                                        <span
                                                            className={`admin-status ${
                                                                paymentTone[
                                                                    transaction
                                                                        .paymentStatus
                                                                ] ??
                                                                'is-done'
                                                            }`}
                                                        >
                                                            <span aria-hidden="true" />
                                                            {
                                                                transaction.paymentStatus
                                                            }
                                                        </span>
                                                        <small>
                                                            {transaction.paymentMethod ===
                                                            '-'
                                                                ? 'Belum ada metode'
                                                                : transaction.paymentMethod}
                                                        </small>
                                                    </div>
                                                </td>
                                                <td data-label="Status">
                                                    <span
                                                        className={`admin-status ${
                                                            orderStatusTone[
                                                                transaction
                                                                    .orderStatus
                                                            ] ?? 'is-done'
                                                        }`}
                                                    >
                                                        <span aria-hidden="true" />
                                                        {
                                                            transaction.orderStatus
                                                        }
                                                    </span>
                                                </td>
                                                <td data-label="Aksi">
                                                    <Link
                                                        href={route(
                                                            'pengusaha.pesanan.detail',
                                                            transaction.id,
                                                        )}
                                                        className="admin-detail-button"
                                                        aria-label={`Lihat detail ${transaction.id}`}
                                                    >
                                                        Lihat
                                                        <AdminIcon
                                                            name="arrow"
                                                            size={13}
                                                        />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ),
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="admin-table-foot admin-table-foot-pagination">
                        <span>
                            Menampilkan {rangeStart}-{rangeEnd} dari{' '}
                            {filteredTransactions.length} transaksi
                        </span>

                        {filteredTransactions.length > PAGE_SIZE && (
                            <nav
                                className="admin-pagination"
                                aria-label="Navigasi halaman laporan"
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
                                        onClick={() =>
                                            setPage(pageNumber)
                                        }
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
                    Laporan ini memakai data contoh. Pesanan dibatalkan tidak
                    dihitung dalam pendapatan dan nilai transaksi.
                </p>

                <section className="admin-report-print">
                    <div className="admin-report-print-head">
                        <div>
                            <span className="admin-report-print-brand">
                                Cleanora, Laundry &amp; Care
                            </span>
                            <h1>Laporan transaksi</h1>
                            <p>
                                Periode{' '}
                                {formatReportRange(
                                    reportStartKey,
                                    reportLatestDateKey,
                                )}{' '}
                                · Sumber:{' '}
                                {source === 'all'
                                    ? 'semua sumber'
                                    : source}
                            </p>
                        </div>
                        <div className="admin-report-print-meta">
                            <span>Dicetak</span>
                            <strong>
                                {formatReportDateTime(
                                    new Date().toISOString(),
                                )}
                            </strong>
                        </div>
                    </div>

                    <div className="admin-report-print-summary">
                        {summaryItems.map((stat) => (
                            <div key={stat.label}>
                                <span>{stat.label}</span>
                                <strong>{stat.value}</strong>
                                <small>{stat.note}</small>
                            </div>
                        ))}
                    </div>

                    <table className="admin-report-print-table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Pesanan</th>
                                <th>Pelanggan</th>
                                <th>Layanan</th>
                                <th>Nilai</th>
                                <th>Pembayaran</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {scopedTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={7}>
                                        Tidak ada transaksi pada filter ini.
                                    </td>
                                </tr>
                            ) : (
                                scopedTransactions.map(
                                    (transaction) => (
                                        <tr key={transaction.id}>
                                            <td>
                                                {formatReportDateKey(
                                                    transaction.dateKey,
                                                )}
                                            </td>
                                            <td>
                                                <strong>
                                                    {transaction.id}
                                                </strong>
                                                <span>
                                                    {
                                                        transaction.invoiceNumber
                                                    }{' '}
                                                    · {transaction.source}
                                                </span>
                                            </td>
                                            <td>
                                                {transaction.customer}
                                            </td>
                                            <td>{transaction.service}</td>
                                            <td>
                                                {formatRupiah(
                                                    transaction.amount,
                                                )}
                                            </td>
                                            <td>
                                                {transaction.paymentStatus}
                                                {transaction.paidDateKey && (
                                                    <span>
                                                        {formatReportDateKey(
                                                            transaction.paidDateKey,
                                                        )}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {transaction.orderStatus}
                                            </td>
                                        </tr>
                                    ),
                                )
                            )}
                        </tbody>
                    </table>

                    <p className="admin-report-print-note">
                        Pendapatan diterima:{' '}
                        {formatRupiah(paidValue)} dari{' '}
                        {paidTransactions.length} pembayaran lunas. Nilai
                        transaksi aktif {formatRupiah(totalValue)} dari{' '}
                        {activeTransactions.length} pesanan. Pesanan yang
                        dibatalkan tetap ditampilkan pada tabel, tetapi
                        tidak dihitung dalam ringkasan.
                    </p>
                </section>
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
