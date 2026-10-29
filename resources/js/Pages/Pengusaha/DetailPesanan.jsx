import '../../../css/pengusaha-detail.css';

import AdminIcon from '@/Components/Pengusaha/AdminIcon';
import {
    formatRupiah,
    initialsOf,
    orderStatusTone,
    paymentTone,
    whatsappLink,
} from '@/Data/adminOrders';
import PengusahaLayout from '@/Layouts/PengusahaLayout';
import { Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const STAGES = [
    {
        key: 'masuk',
        label: 'Pesanan masuk',
        detail: 'Data pesanan tercatat',
        icon: 'orders',
    },
    {
        key: 'terima',
        label: 'Diterima',
        detail: 'Cucian di tangan petugas',
        icon: 'package',
    },
    {
        key: 'timbang',
        label: 'Ditimbang',
        detail: 'Berat aktual dicatat',
        icon: 'reports',
    },
    {
        key: 'bayar',
        label: 'Pembayaran',
        detail: 'Nota dibayar pelanggan',
        icon: 'payments',
    },
    {
        key: 'cuci',
        label: 'Dicuci',
        detail: 'Cucian sedang diproses',
        icon: 'spark',
    },
    {
        key: 'siap',
        label: 'Siap diambil',
        detail: 'Pelanggan dihubungi',
        icon: 'check',
    },
    {
        key: 'selesai',
        label: 'Selesai',
        detail: 'Cucian diterima pelanggan',
        icon: 'check',
    },
];

const STATUS_STAGE = {
    Draft: 0,
    Terkonfirmasi: 0,
    'Menunggu penjemputan': 0,
    'Menunggu antaran pelanggan': 0,
    'Perlu ditimbang': 1,
    Ditimbang: 2,
    'Menunggu pembayaran': 3,
    Lunas: 4,
    'Siap diproses': 4,
    'Sedang dicuci': 4,
    'Selesai dicuci': 5,
    'Siap diambil': 5,
    'Dalam pengantaran': 5,
    'Diterima pelanggan': 6,
    Selesai: 6,
    Dibatalkan: 0,
};

const ACTION_META = {
    'Menunggu penjemputan': { icon: 'truck', tone: 'is-blue' },
    'Menunggu antaran pelanggan': { icon: 'package', tone: 'is-blue' },
    'Perlu ditimbang': { icon: 'reports', tone: 'is-gold' },
    'Menunggu pembayaran': { icon: 'payments', tone: 'is-gold' },
    'Sedang dicuci': { icon: 'spark', tone: 'is-teal' },
    'Siap diambil': { icon: 'check', tone: 'is-green' },
    'Dalam pengantaran': { icon: 'truck', tone: 'is-blue' },
    Selesai: { icon: 'check', tone: 'is-green' },
    Dibatalkan: { icon: 'alert', tone: 'is-danger' },
};

const money = (value) => formatRupiah(Number(value) || 0);

const weightValue = (weight) =>
    Number.parseFloat(String(weight ?? '').replace(',', '.')) || 0;

const formatWeight = (weight) =>
    Number(weight).toLocaleString('id-ID', {
        maximumFractionDigits: 1,
    });

const orderDateLabel = (orderId) => {
    const match = /^LDR-(\d{4})(\d{2})(\d{2})/.exec(orderId);

    if (!match) {
        return 'Hari ini';
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00`));
};

const addMinutes = (time, minutes) => {
    const [hour, minute] = String(time).split('.').map(Number);

    if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
        return time;
    }

    const total = hour * 60 + minute + minutes;
    const nextHour = Math.floor(total / 60) % 24;
    const nextMinute = total % 60;

    return `${String(nextHour).padStart(2, '0')}.${String(
        nextMinute,
    ).padStart(2, '0')}`;
};

const createProcessState = (order) => ({
    status: order.status,
    payment: order.payment,
    paymentMethod: order.paymentMethod ?? 'Transfer bank',
    actualWeight: order.actualWeight ?? null,
    finalPrice: order.finalPrice ?? null,
});

function NotFound({ nomorPesanan }) {
    return (
        <PengusahaLayout
            title="Pesanan tidak ditemukan — Cleanora"
            active="orders"
            breadcrumb="Detail pesanan"
        >
            <div className="admin-card order-not-found">
                <span className="order-not-found-icon">
                    <AdminIcon name="search" size={24} />
                </span>
                <span className="admin-card-label">PESANAN TIDAK DITEMUKAN</span>
                <h1>Nomor pesanan tidak tersedia.</h1>
                <p>
                    Pesanan <strong>{nomorPesanan}</strong> tidak ada pada data
                    contoh. Periksa kembali nomor pesanan atau buka daftar
                    pesanan untuk memilih pesanan lain.
                </p>
                <Link
                    href={route('pengusaha.pesanan')}
                    className="admin-button admin-button-primary"
                >
                    Kembali ke daftar pesanan
                </Link>
            </div>
        </PengusahaLayout>
    );
}

function OrderDetailContent({ order }) {
    const initialProcess = createProcessState(order);
    const [process, setProcess] = useState(initialProcess);
    const [weightInput, setWeightInput] = useState(
        String(order.actualWeight ?? order.estimatedWeight ?? ''),
    );
    const [weightError, setWeightError] = useState('');
    const [paymentMethod, setPaymentMethod] = useState(
        initialProcess.paymentMethod || 'Transfer bank',
    );
    const [cancelConfirm, setCancelConfirm] = useState(false);
    const [toast, setToast] = useState('');

    const estimatedWeight =
        Number(order.estimatedWeight) || weightValue(order.weight);
    const unitPrice =
        Number(order.unitPrice) ||
        (estimatedWeight > 0
            ? Math.round(order.total / estimatedWeight)
            : order.total);
    const minimumWeight = Number(order.minimum) || 0.1;
    const location = order.address ?? order.outlet ?? 'Belum ditentukan';
    const isCanceled = process.status === 'Dibatalkan';
    const isFinished = process.status === 'Selesai';
    const canCancel = [
        'Menunggu penjemputan',
        'Menunggu antaran pelanggan',
        'Perlu ditimbang',
        'Menunggu pembayaran',
    ].includes(process.status);
    const stageIndex = isCanceled
        ? 0
        : (STATUS_STAGE[process.status] ?? 0);
    const progress =
        process.status === 'Selesai'
            ? 100
            : Math.round((stageIndex / (STAGES.length - 1)) * 100);
    const parsedWeight = Number.parseFloat(
        String(weightInput).replace(',', '.'),
    );
    const previewPrice =
        Number.isFinite(parsedWeight) &&
        parsedWeight >= minimumWeight
            ? Math.round(unitPrice * parsedWeight)
            : null;
    const displayTotal = process.finalPrice ?? order.total;
    const actionMeta = ACTION_META[process.status] ?? {
        icon: 'orders',
        tone: 'is-teal',
    };
    const customerWhatsApp = whatsappLink(order.phone);

    useEffect(() => {
        if (!toast) {
            return undefined;
        }

        const timeout = window.setTimeout(() => setToast(''), 3200);

        return () => window.clearTimeout(timeout);
    }, [toast]);

    useEffect(() => {
        const next = createProcessState(order);

        setProcess(next);
        setWeightInput(String(next.actualWeight ?? order.estimatedWeight ?? ''));
        setPaymentMethod(next.paymentMethod || 'Transfer bank');
    }, [order]);

    const submitAction = (routeName, payload, successMessage) => {
        router.patch(route(routeName, order.id), payload, {
            preserveScroll: true,
            onSuccess: (page) =>
                setToast(page.props.flash?.status ?? successMessage),
            onError: (errors) => {
                const message = Object.values(errors)[0];

                if (routeName === 'pengusaha.pesanan.timbang') {
                    setWeightError(message);
                } else if (message) {
                    setToast(message);
                }
            },
        });
    };

    const confirmPickup = () => {
        submitAction(
            'pengusaha.pesanan.terima',
            {},
            'Cucian ditandai diterima.',
        );
    };

    const saveWeight = () => {
        if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
            setWeightError('Masukkan berat aktual lebih dari 0 kg.');

            return;
        }

        if (parsedWeight < minimumWeight) {
            setWeightError(
                `Berat minimum layanan ini ${formatWeight(
                    minimumWeight,
                )} kg.`,
            );

            return;
        }

        if (parsedWeight > 50) {
            setWeightError(
                'Berat melebihi 50 kg. Periksa kembali hasil timbangan.',
            );

            return;
        }

        setWeightError('');
        submitAction(
            'pengusaha.pesanan.timbang',
            { actual_weight: parsedWeight },
            'Berat aktual disimpan dan nota dibuat.',
        );
    };

    const confirmPayment = () => {
        submitAction(
            'pengusaha.pesanan.bayar',
            { payment_method: paymentMethod },
            'Pembayaran dikonfirmasi.',
        );
    };

    const markReady = () => {
        submitAction(
            'pengusaha.pesanan.siap',
            {},
            'Pesanan ditandai siap diambil.',
        );
    };

    const markReceived = () => {
        submitAction(
            'pengusaha.pesanan.selesai',
            {},
            'Pesanan ditandai selesai.',
        );
    };

    const cancelOrder = () => {
        setCancelConfirm(false);
        submitAction(
            'pengusaha.pesanan.batalkan',
            {},
            'Pesanan dibatalkan.',
        );
    };

    const historyDetails = [
        `${order.source} • ${order.intake}`,
        location,
        process.actualWeight
            ? `${formatWeight(process.actualWeight)} kg • ${money(
                  process.finalPrice,
              )}`
            : `Estimasi ${formatWeight(estimatedWeight)} kg`,
        process.payment,
        order.service,
        'Pelanggan dihubungi melalui WhatsApp',
        'Cucian diterima pelanggan',
    ];

    const historyTimes = [0, 20, 35, 50, 80, 160, 220];

    const historyEvents = isCanceled
        ? [
              {
                  label: 'Pesanan dibuat',
                  detail: `${order.source} • ${order.intake}`,
                  meta: `${orderDateLabel(order.id)}, ${order.time}`,
                  state: 'is-done',
              },
              {
                  label: 'Pesanan dibatalkan',
                  detail: order.note,
                  meta: 'Tidak dilanjutkan',
                  state: 'is-danger',
              },
          ]
        : STAGES.map((stage, index) => {
              const isDone =
                  process.status === 'Selesai' || index < stageIndex;
              const isCurrent =
                  process.status !== 'Selesai' && index === stageIndex;

              return {
                  label: stage.label,
                  detail: historyDetails[index],
                  meta: isDone
                      ? `${orderDateLabel(order.id)}, ${addMinutes(
                            order.time,
                            historyTimes[index],
                        )}`
                      : isCurrent
                        ? 'Sedang berjalan'
                        : 'Menunggu',
                  state: isDone
                      ? 'is-done'
                      : isCurrent
                        ? 'is-current'
                        : '',
              };
          });

    return (
        <PengusahaLayout
            title={`${order.id} — Cleanora`}
            active="orders"
            breadcrumb="Detail pesanan"
        >
            <div className="order-detail-page">
                <div className="admin-page-head order-detail-head">
                    <div className="admin-page-heading">
                        <Link
                            href={route('pengusaha.pesanan')}
                            className="order-detail-back"
                        >
                            <AdminIcon name="chevron" size={13} />
                            Kembali ke daftar pesanan
                        </Link>
                        <span className="admin-eyebrow">
                            <span aria-hidden="true">✦</span>
                            Detail dan proses
                        </span>
                        <h1 className="order-detail-title">{order.id}</h1>
                        <div className="order-detail-meta">
                            <span
                                className={`admin-status ${
                                    orderStatusTone[process.status] ??
                                    'is-info'
                                }`}
                            >
                                <span aria-hidden="true" />
                                {process.status}
                            </span>
                            <span
                                className={`admin-source ${
                                    order.source === 'Chatbot AI'
                                        ? 'is-ai'
                                        : 'is-manual'
                                }`}
                            >
                                {order.source === 'Chatbot AI'
                                    ? '✧ Chatbot AI'
                                    : 'Manual'}
                            </span>
                            <span>
                                {orderDateLabel(order.id)} • {order.time} WIB
                            </span>
                        </div>
                    </div>

                    <div className="admin-head-actions">
                        <span className="admin-sample-badge">
                            <span aria-hidden="true" />
                            Data tersimpan
                        </span>
                        {customerWhatsApp && (
                            <a
                                href={customerWhatsApp}
                                target="_blank"
                                rel="noreferrer"
                                className="admin-button admin-button-outline"
                            >
                                <AdminIcon name="message" size={15} />
                                WhatsApp
                            </a>
                        )}
                        <button
                            type="button"
                            className="admin-button admin-button-primary"
                            onClick={() => window.print()}
                        >
                            <AdminIcon name="printer" size={15} />
                            Cetak nota
                        </button>
                    </div>
                </div>

                {isCanceled ? (
                    <div className="admin-card order-canceled-banner">
                        <span className="order-canceled-icon">
                            <AdminIcon name="alert" size={20} />
                        </span>
                        <div>
                            <span className="admin-card-label">
                                PESANAN DIBATALKAN
                            </span>
                            <h2>Pesanan ini tidak dilanjutkan.</h2>
                            <p>
                                {order.note} Tidak ada tindakan operasional
                                atau penagihan yang perlu dilakukan.
                            </p>
                        </div>
                    </div>
                ) : (
                    <section className="admin-card order-progress-card">
                        <div className="order-progress-head">
                            <div>
                                <span className="admin-card-label">
                                    ALUR PESANAN
                                </span>
                                <h2>Progres operasional</h2>
                            </div>
                            <div className="order-progress-meta">
                                <span>
                                    Tahap {Math.min(stageIndex + 1, 7)} dari 7
                                </span>
                                <strong>{progress}%</strong>
                            </div>
                        </div>
                        <div
                            className="order-progress-track"
                            role="progressbar"
                            aria-valuenow={progress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label="Progres pesanan"
                        >
                            <span style={{ width: `${progress}%` }} />
                        </div>
                        <ol className="order-stepper">
                            {STAGES.map((stage, index) => {
                                const isDone =
                                    process.status === 'Selesai' ||
                                    index < stageIndex;
                                const isCurrent =
                                    process.status !== 'Selesai' &&
                                    index === stageIndex;

                                return (
                                    <li
                                        key={stage.key}
                                        className={
                                            isDone
                                                ? 'is-done'
                                                : isCurrent
                                                  ? 'is-current'
                                                  : undefined
                                        }
                                    >
                                        <span className="order-step-dot">
                                            {isDone ? (
                                                <AdminIcon
                                                    name="check"
                                                    size={12}
                                                />
                                            ) : (
                                                <AdminIcon
                                                    name={stage.icon}
                                                    size={13}
                                                />
                                            )}
                                        </span>
                                        <strong>{stage.label}</strong>
                                        <small>{stage.detail}</small>
                                    </li>
                                );
                            })}
                        </ol>
                    </section>
                )}

                <div className="order-detail-grid">
                    <div className="order-detail-main">
                        <section className="admin-card order-detail-card">
                            <div className="admin-card-head">
                                <div>
                                    <span className="admin-card-label">
                                        RINCIAN PESANAN
                                    </span>
                                    <h2>Informasi pesanan</h2>
                                </div>
                                <span className="admin-orders-count">
                                    {order.id}
                                </span>
                            </div>
                            <dl className="order-info-grid">
                                <div>
                                    <dt>Pelanggan</dt>
                                    <dd>{order.customer}</dd>
                                </div>
                                <div>
                                    <dt>WhatsApp</dt>
                                    <dd>{order.phone}</dd>
                                </div>
                                <div>
                                    <dt>Sumber pesanan</dt>
                                    <dd>{order.source}</dd>
                                </div>
                                <div>
                                    <dt>Metode</dt>
                                    <dd>{order.intake}</dd>
                                </div>
                                <div>
                                    <dt>Waktu masuk</dt>
                                    <dd>
                                        {orderDateLabel(order.id)}, {order.time}{' '}
                                        WIB
                                    </dd>
                                </div>
                                <div>
                                    <dt>Outlet</dt>
                                    <dd>{order.outlet ?? 'Ditangani petugas'}</dd>
                                </div>
                                <div className="order-info-wide">
                                    <dt>
                                        {order.address
                                            ? 'Alamat penjemputan'
                                            : 'Lokasi penyerahan'}
                                    </dt>
                                    <dd>{location}</dd>
                                </div>
                                <div className="order-info-wide">
                                    <dt>Catatan pelanggan</dt>
                                    <dd>{order.note}</dd>
                                </div>
                            </dl>
                        </section>

                        <section className="admin-card order-detail-card">
                            <div className="admin-card-head">
                                <div>
                                    <span className="admin-card-label">
                                        LAYANAN DAN BIAYA
                                    </span>
                                    <h2>Rincian cucian</h2>
                                </div>
                                <span
                                    className={`admin-payment ${
                                        paymentTone[process.payment] ??
                                        'is-neutral'
                                    }`}
                                >
                                    {process.payment}
                                </span>
                            </div>

                            <div className="order-items-wrap">
                                <table className="order-items-table">
                                    <thead>
                                        <tr>
                                            <th scope="col">Layanan</th>
                                            <th scope="col">Jumlah</th>
                                            <th scope="col">Harga per kg</th>
                                            <th scope="col">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>
                                                <div className="admin-cell-main">
                                                    <strong>{order.service}</strong>
                                                    <span>
                                                        {process.actualWeight
                                                            ? 'Berat aktual sudah dicatat'
                                                            : 'Menunggu penimbangan aktual'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                {process.actualWeight
                                                    ? `${formatWeight(
                                                          process.actualWeight,
                                                      )} kg`
                                                    : `Estimasi ${formatWeight(
                                                          estimatedWeight,
                                                      )} kg`}
                                            </td>
                                            <td>{money(unitPrice)}</td>
                                            <td>
                                                <strong>
                                                    {money(
                                                        process.finalPrice ??
                                                            order.total,
                                                    )}
                                                </strong>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="order-costs">
                                <div className="order-cost-row">
                                    <span>Estimasi awal</span>
                                    <strong>
                                        {money(order.estimatedPrice)}
                                    </strong>
                                </div>
                                <div className="order-cost-row">
                                    <span>Berat aktual</span>
                                    <strong>
                                        {process.actualWeight
                                            ? `${formatWeight(
                                                  process.actualWeight,
                                              )} kg`
                                            : 'Belum ditimbang'}
                                    </strong>
                                </div>
                                <div className="order-cost-row order-cost-total">
                                    <span>
                                        {process.finalPrice
                                            ? 'Harga final'
                                            : 'Perkiraan harga'}
                                    </span>
                                    <strong>
                                        {money(
                                            process.finalPrice ?? order.total,
                                        )}
                                    </strong>
                                </div>
                            </div>

                            <p className="order-cost-note">
                                Estimasi awal tetap disimpan. Harga final
                                dihitung dari berat aktual setelah
                                penimbangan.
                            </p>
                        </section>

                        <section className="admin-card order-detail-card">
                            <div className="admin-card-head">
                                <div>
                                    <span className="admin-card-label">
                                        RIWAYAT PESANAN
                                    </span>
                                    <h2>Perjalanan pesanan</h2>
                                    <p>
                                        Urutan kejadian operasional pada
                                        pesanan ini.
                                    </p>
                                </div>
                            </div>
                            <ol className="order-history">
                                {historyEvents.map((event) => (
                                    <li
                                        key={event.label}
                                        className={event.state}
                                    >
                                        <span className="order-history-dot">
                                            {event.state === 'is-done' && (
                                                <AdminIcon
                                                    name="check"
                                                    size={10}
                                                />
                                            )}
                                        </span>
                                        <div>
                                            <strong>{event.label}</strong>
                                            <small>{event.detail}</small>
                                        </div>
                                        <time>{event.meta}</time>
                                    </li>
                                ))}
                            </ol>
                        </section>
                    </div>

                    <aside className="order-detail-side">
                        <section className="admin-card order-action-card">
                            <div className="order-action-head">
                                <span
                                    className={`order-action-icon ${actionMeta.tone}`}
                                >
                                    <AdminIcon
                                        name={actionMeta.icon}
                                        size={19}
                                    />
                                </span>
                                <div>
                                    <span className="admin-card-label">
                                        TINDAKAN BERIKUTNYA
                                    </span>
                                    <h2>
                                        {process.status === 'Menunggu penjemputan' &&
                                            'Konfirmasi penjemputan'}
                                        {process.status ===
                                            'Menunggu antaran pelanggan' &&
                                            'Konfirmasi cucian diterima'}
                                        {process.status === 'Perlu ditimbang' &&
                                            'Timbang cucian'}
                                        {process.status ===
                                            'Menunggu pembayaran' &&
                                            'Konfirmasi pembayaran'}
                                        {process.status === 'Sedang dicuci' &&
                                            'Selesaikan pencucian'}
                                        {process.status === 'Siap diambil' &&
                                            'Serahkan cucian'}
                                        {process.status === 'Dalam pengantaran' &&
                                            'Konfirmasi pengantaran'}
                                        {process.status === 'Selesai' &&
                                            'Pesanan selesai'}
                                        {process.status === 'Dibatalkan' &&
                                            'Pesanan dibatalkan'}
                                    </h2>
                                </div>
                            </div>

                            <div className="order-action-body">
                                {process.status === 'Menunggu penjemputan' && (
                                    <>
                                        <p className="order-action-copy">
                                            Pastikan petugas sudah menjemput
                                            cucian di alamat pelanggan sebelum
                                            melanjutkan ke penimbangan.
                                        </p>
                                        <div className="order-action-facts">
                                            <div>
                                                <span>Metode</span>
                                                <strong>{order.intake}</strong>
                                            </div>
                                            <div>
                                                <span>Alamat jemput</span>
                                                <strong>{location}</strong>
                                            </div>
                                        </div>
                                        <div className="order-action-note">
                                            <AdminIcon name="orders" size={14} />
                                            <span>{order.note}</span>
                                        </div>
                                        <button
                                            type="button"
                                            className="admin-button admin-button-primary"
                                            onClick={confirmPickup}
                                        >
                                            Tandai cucian diterima
                                        </button>
                                    </>
                                )}

                                {process.status ===
                                    'Menunggu antaran pelanggan' && (
                                    <>
                                        <p className="order-action-copy">
                                            Konfirmasi setelah pelanggan
                                            mengantar cucian ke outlet agar
                                            pesanan dapat ditimbang.
                                        </p>
                                        <div className="order-action-facts">
                                            <div>
                                                <span>Metode</span>
                                                <strong>{order.intake}</strong>
                                            </div>
                                            <div>
                                                <span>Lokasi</span>
                                                <strong>{location}</strong>
                                            </div>
                                        </div>
                                        <div className="order-action-note">
                                            <AdminIcon name="orders" size={14} />
                                            <span>{order.note}</span>
                                        </div>
                                        <button
                                            type="button"
                                            className="admin-button admin-button-primary"
                                            onClick={confirmPickup}
                                        >
                                            Tandai cucian diterima
                                        </button>
                                    </>
                                )}

                                {process.status === 'Perlu ditimbang' && (
                                    <>
                                        <p className="order-action-copy">
                                            Masukkan berat aktual cucian. Harga
                                            final dihitung otomatis dari harga
                                            per kg layanan.
                                        </p>
                                        <label className="order-field">
                                            <span>Berat aktual</span>
                                            <div
                                                className={`order-weight-input${
                                                    weightError
                                                        ? ' has-error'
                                                        : ''
                                                }`}
                                            >
                                                <input
                                                    type="number"
                                                    inputMode="decimal"
                                                    min={minimumWeight}
                                                    max="50"
                                                    step="0.1"
                                                    value={weightInput}
                                                    onChange={(event) => {
                                                        setWeightInput(
                                                            event.target.value,
                                                        );
                                                        setWeightError('');
                                                    }}
                                                    aria-invalid={
                                                        Boolean(weightError)
                                                    }
                                                />
                                                <span>kg</span>
                                            </div>
                                            {weightError && (
                                                <small
                                                    className="order-field-error"
                                                    role="alert"
                                                >
                                                    {weightError}
                                                </small>
                                            )}
                                        </label>
                                        <div className="order-price-preview">
                                            <div>
                                                <span>Harga per kg</span>
                                                <strong>{money(unitPrice)}</strong>
                                            </div>
                                            <div>
                                                <span>Harga final</span>
                                                <strong>
                                                    {previewPrice
                                                        ? money(previewPrice)
                                                        : '—'}
                                                </strong>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="admin-button admin-button-primary"
                                            onClick={saveWeight}
                                        >
                                            Simpan berat & buat nota
                                        </button>
                                        <p className="order-action-hint">
                                            Estimasi awal{' '}
                                            {money(order.estimatedPrice)} tetap
                                            disimpan sebagai pembanding.
                                        </p>
                                    </>
                                )}

                                {process.status ===
                                    'Menunggu pembayaran' && (
                                    <>
                                        <p className="order-action-copy">
                                            Periksa bukti transfer atau
                                            pembayaran tunai, lalu konfirmasi
                                            agar cucian dapat diproses.
                                        </p>
                                        <div className="order-pay-amount">
                                            <span>Total tagihan</span>
                                            <strong>
                                                {money(displayTotal)}
                                            </strong>
                                            <small>
                                                Berat aktual{' '}
                                                {process.actualWeight
                                                    ? `${formatWeight(
                                                          process.actualWeight,
                                                      )} kg`
                                                    : 'belum dicatat'}
                                            </small>
                                        </div>
                                        <label className="order-field">
                                            <span>Metode pembayaran</span>
                                            <select
                                                value={paymentMethod}
                                                onChange={(event) =>
                                                    setPaymentMethod(
                                                        event.target.value,
                                                    )
                                                }
                                            >
                                                <option value="Transfer bank">
                                                    Transfer bank
                                                </option>
                                                <option value="Tunai">
                                                    Tunai
                                                </option>
                                            </select>
                                        </label>
                                        <button
                                            type="button"
                                            className="admin-button admin-button-primary"
                                            onClick={confirmPayment}
                                        >
                                            Konfirmasi pembayaran
                                        </button>
                                        <button
                                            type="button"
                                            className="admin-button admin-button-outline"
                                            onClick={() =>
                                                setToast(
                                                    'Pengingat pembayaran disiapkan untuk dikirim via WhatsApp.',
                                                )
                                            }
                                        >
                                            Kirim pengingat
                                        </button>
                                    </>
                                )}

                                {process.status === 'Sedang dicuci' && (
                                    <>
                                        <p className="order-action-copy">
                                            Cucian sedang dikerjakan. Setelah
                                            selesai dicuci dan diperiksa,
                                            tandai siap diambil agar pelanggan
                                            dapat dihubungi.
                                        </p>
                                        <div className="order-action-facts">
                                            <div>
                                                <span>Layanan</span>
                                                <strong>{order.service}</strong>
                                            </div>
                                            <div>
                                                <span>Berat aktual</span>
                                                <strong>
                                                    {process.actualWeight
                                                        ? `${formatWeight(
                                                              process.actualWeight,
                                                          )} kg`
                                                        : 'Belum dicatat'}
                                                </strong>
                                            </div>
                                        </div>
                                        <div className="order-action-note">
                                            <AdminIcon name="orders" size={14} />
                                            <span>{order.note}</span>
                                        </div>
                                        <button
                                            type="button"
                                            className="admin-button admin-button-primary"
                                            onClick={markReady}
                                        >
                                            Tandai siap diambil
                                        </button>
                                    </>
                                )}

                                {process.status === 'Siap diambil' && (
                                    <>
                                        <p className="order-action-copy">
                                            Hubungi pelanggan dan konfirmasi
                                            setelah cucian benar-benar
                                            diterima.
                                        </p>
                                        <div className="order-action-facts">
                                            <div>
                                                <span>Penyerahan</span>
                                                <strong>{location}</strong>
                                            </div>
                                            <div>
                                                <span>Pembayaran</span>
                                                <strong>{process.payment}</strong>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="admin-button admin-button-primary"
                                            onClick={markReceived}
                                        >
                                            Konfirmasi cucian diterima
                                        </button>
                                    </>
                                )}

                                {process.status === 'Dalam pengantaran' && (
                                    <>
                                        <p className="order-action-copy">
                                            Kurir sedang mengantar cucian.
                                            Konfirmasi setelah pelanggan
                                            benar-benar menerima pesanan.
                                        </p>
                                        <div className="order-action-facts">
                                            <div>
                                                <span>Tujuan</span>
                                                <strong>{location}</strong>
                                            </div>
                                            <div>
                                                <span>Pembayaran</span>
                                                <strong>{process.payment}</strong>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="admin-button admin-button-primary"
                                            onClick={markReceived}
                                        >
                                            Konfirmasi cucian diterima
                                        </button>
                                    </>
                                )}

                                {isFinished && (
                                    <div className="order-finished">
                                        <span>
                                            <AdminIcon name="check" size={22} />
                                        </span>
                                        <strong>Pesanan sudah selesai.</strong>
                                        <p>
                                            Cucian sudah diterima pelanggan dan
                                            pembayaran tercatat{' '}
                                            {process.payment.toLowerCase()}.
                                        </p>
                                        <button
                                            type="button"
                                            className="admin-button admin-button-outline"
                                            onClick={() => window.print()}
                                        >
                                            <AdminIcon
                                                name="printer"
                                                size={15}
                                            />
                                            Cetak nota
                                        </button>
                                    </div>
                                )}

                                {isCanceled && (
                                    <div className="order-canceled-panel">
                                        <span>
                                            <AdminIcon name="alert" size={20} />
                                        </span>
                                        <strong>Pesanan dibatalkan.</strong>
                                        <p>
                                            Tidak ada proses pencucian atau
                                            penagihan yang dilanjutkan untuk
                                            pesanan ini.
                                        </p>
                                    </div>
                                )}

                                {canCancel && (
                                    <div className="order-cancel-zone">
                                        {cancelConfirm ? (
                                            <div
                                                className="order-cancel-confirm"
                                                role="alertdialog"
                                                aria-label="Konfirmasi pembatalan pesanan"
                                            >
                                                <strong>
                                                    Batalkan pesanan ini?
                                                </strong>
                                                <p>
                                                    Pesanan tidak akan
                                                    dilanjutkan ke proses
                                                    berikutnya.
                                                </p>
                                                <div>
                                                    <button
                                                        type="button"
                                                        className="admin-button admin-button-outline"
                                                        onClick={() =>
                                                            setCancelConfirm(
                                                                false,
                                                            )
                                                        }
                                                    >
                                                        Kembali
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="order-danger-button"
                                                        onClick={cancelOrder}
                                                    >
                                                        Ya, batalkan
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                className="order-cancel-link"
                                                onClick={() =>
                                                    setCancelConfirm(true)
                                                }
                                            >
                                                Batalkan pesanan
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="admin-card order-payment-card">
                            <div className="admin-card-head">
                                <div>
                                    <span className="admin-card-label">
                                        PEMBAYARAN
                                    </span>
                                    <h2>Status tagihan</h2>
                                </div>
                                <span
                                    className={`admin-payment ${
                                        paymentTone[process.payment] ??
                                        'is-neutral'
                                    }`}
                                >
                                    {process.payment}
                                </span>
                            </div>
                            <div className="order-payment-body">
                                <div className="order-payment-total">
                                    <span>
                                        {process.finalPrice
                                            ? 'Harga final'
                                            : 'Estimasi awal'}
                                    </span>
                                    <strong>
                                        {process.payment ===
                                        'Tidak perlu bayar'
                                            ? 'Tidak perlu bayar'
                                            : money(displayTotal)}
                                    </strong>
                                </div>
                                <dl className="order-payment-list">
                                    <div>
                                        <dt>Metode</dt>
                                        <dd>
                                            {process.payment ===
                                            'Tidak perlu bayar'
                                                ? '-'
                                                : process.paymentMethod}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Berat aktual</dt>
                                        <dd>
                                            {process.actualWeight
                                                ? `${formatWeight(
                                                      process.actualWeight,
                                                  )} kg`
                                                : 'Belum ditimbang'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt>Estimasi awal</dt>
                                        <dd>{money(order.estimatedPrice)}</dd>
                                    </div>
                                </dl>
                                <p className="order-payment-note">
                                    {process.payment === 'Lunas'
                                        ? 'Pembayaran sudah dikonfirmasi. Nota dapat dicetak ulang kapan saja.'
                                        : process.payment ===
                                            'Tidak perlu bayar'
                                          ? 'Pesanan dibatalkan sehingga tidak ada tagihan yang perlu diselesaikan.'
                                          : 'Konfirmasi pembayaran dilakukan dari kartu tindakan berikutnya setelah bukti transfer diperiksa.'}
                                </p>
                            </div>
                        </section>

                        <section className="admin-card order-customer-card">
                            <div className="admin-card-head">
                                <div>
                                    <span className="admin-card-label">
                                        PELANGGAN
                                    </span>
                                    <h2>Kontak dan penyerahan</h2>
                                </div>
                            </div>
                            <div className="order-customer-body">
                                <div className="order-customer-identity">
                                    <span className="admin-avatar">
                                        {initialsOf(order.customer)}
                                    </span>
                                    <div>
                                        <strong>{order.customer}</strong>
                                        <span>{order.phone}</span>
                                    </div>
                                </div>
                                <div className="order-customer-location">
                                    <span>
                                        <AdminIcon
                                            name={
                                                order.address
                                                    ? 'truck'
                                                    : 'package'
                                            }
                                            size={14}
                                        />
                                        {order.address
                                            ? 'Alamat penjemputan'
                                            : 'Lokasi penyerahan'}
                                    </span>
                                    <strong>{location}</strong>
                                </div>
                                {customerWhatsApp && (
                                    <a
                                        href={customerWhatsApp}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="admin-button admin-button-outline"
                                    >
                                        <AdminIcon
                                            name="message"
                                            size={15}
                                        />
                                        Chat pelanggan
                                    </a>
                                )}
                            </div>
                        </section>
                    </aside>
                </div>

                <p className="admin-dashboard-note order-detail-note">
                    Setiap tindakan pada halaman ini langsung menyimpan
                    perubahan status, berat, dan pembayaran ke database.
                </p>
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

export default function PengusahaDetailPesanan({ order }) {
    if (!order) {
        return <NotFound nomorPesanan="-" />;
    }

    return <OrderDetailContent order={order} />;
}
