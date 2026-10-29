import '../../../css/konfirmasi.css';

import { clearOrderDraft, readOrderDraft } from '@/Data/orderDraft';
import CleanoraLayout from '@/Layouts/CleanoraLayout';
import { Link, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const rupiah = (value) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`;

const timeLabels = {
    '08:00-10:00': '08.00–10.00',
    '10:00-12:00': '10.00–12.00',
    '12:00-14:00': '12.00–14.00',
    '14:00-16:00': '14.00–16.00',
    '16:00-18:00': '16.00–18.00',
};

const formatDate = (value) => {
    if (!value) {
        return '-';
    }

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
};

export default function PelangganKonfirmasi({ services = [] }) {
    const [draft] = useState(readOrderDraft);
    const [agreement, setAgreement] = useState(false);

    const service = useMemo(
        () =>
            services.find(
                (item) =>
                    String(item.slug) === String(draft?.serviceId) ||
                    String(item.id) === String(draft?.serviceId),
            ) ?? null,
        [draft, services],
    );

    const quantity = Number(draft?.quantity) || 0;
    const total = service ? service.price * quantity : 0;
    const method = draft?.deliveryMethod === 'jemput' ? 'jemput' : 'antar-sendiri';
    const isComplete = Boolean(
        draft?.customerName?.trim() &&
            draft?.phone?.trim() &&
            draft?.pickupDate &&
            draft?.pickupTime &&
            service &&
            quantity >= service.min &&
            quantity <= 100 &&
            (method !== 'jemput' || draft?.address?.trim()),
    );

    const { post, processing, errors } = useForm({
        name: draft?.customerName ?? '',
        whatsapp: draft?.phone ?? '',
        service_id: service?.id ?? '',
        estimated_quantity: draft?.quantity ?? '',
        notes: draft?.notes ?? '',
        intake_method: method === 'jemput' ? 'jemput' : 'antar',
        address: draft?.address ?? '',
        schedule_date: draft?.pickupDate ?? '',
        schedule_time: draft?.pickupTime ?? '',
    });

    const validationMessages = Object.values(errors);

    const handleConfirm = () => {
        if (!agreement || processing) {
            return;
        }

        post(route('pelanggan.pesan.store'), {
            preserveScroll: true,
            onSuccess: () => clearOrderDraft(),
        });
    };

    const scheduleLabel = draft
        ? `${formatDate(draft.pickupDate)} · ${
              timeLabels[draft.pickupTime] ?? draft.pickupTime
          }`
        : '-';

    return (
        <CleanoraLayout
            title="Konfirmasi Pesanan"
            active="pesan"
            pageClassName="cleanora-confirm-page"
        >
            <section className="confirm-hero">
                <div className="container confirm-hero-content">
                    <div className="breadcrumb">
                        <Link href={route('pelanggan.dashboard')}>
                            Beranda
                        </Link>
                        <span>/</span>
                        <Link href={route('pelanggan.pesan')}>
                            Pesan Manual
                        </Link>
                        <span>/</span>
                        <span>Konfirmasi</span>
                    </div>

                    <span className="section-label">
                        RINGKASAN DAN KONFIRMASI
                    </span>

                    <h1>
                        Periksa Kembali,
                        <br />
                        Lalu <em>Konfirmasi.</em>
                    </h1>

                    <p>
                        Pastikan nama, kontak, layanan, dan jadwal penyerahan
                        sudah benar. Setelah dikonfirmasi, pesanan akan
                        diteruskan ke alur pemrosesan laundry.
                    </p>

                    {isComplete && (
                        <div
                            className="confirm-progress"
                            aria-label="Tahap pemesanan"
                        >
                            <div className="confirm-progress-step done">
                                <span>✓</span>
                                Data pesanan
                            </div>
                            <span className="confirm-progress-line"></span>
                            <div className="confirm-progress-step done">
                                <span>✓</span>
                                Detail layanan
                            </div>
                            <span className="confirm-progress-line"></span>
                            <div className="confirm-progress-step active">
                                <span>3</span>
                                Konfirmasi
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <section className="confirm-section">
                <div className="container">
                    {!isComplete ? (
                        <div className="confirm-empty">
                            <div className="confirm-empty-icon">✧</div>
                            <h2>Belum ada pesanan.</h2>
                            <p>
                                Kamu belum mengisi formulir pemesanan atau
                                datanya belum lengkap. Mulai dari formulir
                                Pesan Manual untuk menyusun pesanan laundry.
                            </p>
                            <Link
                                href={route('pelanggan.pesan')}
                                className="btn btn-primary"
                            >
                                Isi Formulir Pesanan <span>→</span>
                            </Link>
                        </div>
                    ) : (
                        <div className="confirm-layout">
                            <div className="confirm-main">
                                <div className="confirm-block">
                                    <div className="confirm-block-head">
                                        <div className="confirm-block-title">
                                            <span className="confirm-step">
                                                01
                                            </span>
                                            <div>
                                                <h2>Data pelanggan</h2>
                                                <p>
                                                    Kontak yang akan dihubungi
                                                    petugas.
                                                </p>
                                            </div>
                                        </div>

                                        <Link
                                            href={`${route('pelanggan.pesan')}#data-pelanggan`}
                                            className="confirm-edit"
                                        >
                                            Ubah
                                        </Link>
                                    </div>

                                    <dl className="confirm-rows">
                                        <div className="confirm-row">
                                            <dt>Nama lengkap</dt>
                                            <dd>{draft.customerName}</dd>
                                        </div>

                                        <div className="confirm-row">
                                            <dt>Nomor WhatsApp</dt>
                                            <dd>{draft.phone}</dd>
                                        </div>

                                        <div className="confirm-row">
                                            <dt>Alamat</dt>
                                            <dd>
                                                {draft.address?.trim() ? (
                                                    draft.address
                                                ) : (
                                                    <span>
                                                        Antar sendiri ke outlet
                                                    </span>
                                                )}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>

                                <div className="confirm-block">
                                    <div className="confirm-block-head">
                                        <div className="confirm-block-title">
                                            <span className="confirm-step">
                                                02
                                            </span>
                                            <div>
                                                <h2>Detail layanan</h2>
                                                <p>
                                                    Layanan dan jumlah yang
                                                    akan diproses.
                                                </p>
                                            </div>
                                        </div>

                                        <Link
                                            href={`${route('pelanggan.pesan')}#detail-layanan`}
                                            className="confirm-edit"
                                        >
                                            Ubah
                                        </Link>
                                    </div>

                                    <div className="confirm-service">
                                        <span className="confirm-service-icon">
                                            ✦
                                        </span>
                                        <div>
                                            <strong>{service.name}</strong>
                                            <small>
                                                {rupiah(service.price)}/
                                                {service.unit} · Minimal{' '}
                                                {service.min} {service.unit}
                                            </small>
                                        </div>
                                        <span className="confirm-service-badge">
                                            {quantity} {service.unit}
                                        </span>
                                    </div>

                                    <dl className="confirm-rows">
                                        <div className="confirm-row">
                                            <dt>Jumlah / berat</dt>
                                            <dd>
                                                {quantity} {service.unit}
                                            </dd>
                                        </div>

                                        <div className="confirm-row">
                                            <dt>Catatan khusus</dt>
                                            <dd>
                                                {draft.notes?.trim() ? (
                                                    draft.notes
                                                ) : (
                                                    <span>
                                                        Tanpa catatan khusus
                                                    </span>
                                                )}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>

                                <div className="confirm-block">
                                    <div className="confirm-block-head">
                                        <div className="confirm-block-title">
                                            <span className="confirm-step">
                                                03
                                            </span>
                                            <div>
                                                <h2>Penyerahan cucian</h2>
                                                <p>
                                                    Cara dan jadwal menyerahkan
                                                    cucian.
                                                </p>
                                            </div>
                                        </div>

                                        <Link
                                            href={`${route('pelanggan.pesan')}#metode-penyerahan`}
                                            className="confirm-edit"
                                        >
                                            Ubah
                                        </Link>
                                    </div>

                                    <dl className="confirm-rows">
                                        <div className="confirm-row">
                                            <dt>Metode</dt>
                                            <dd>
                                                {method === 'jemput'
                                                    ? 'Jemput cucian'
                                                    : 'Antar sendiri'}
                                            </dd>
                                        </div>

                                        <div className="confirm-row">
                                            <dt>Jadwal penyerahan</dt>
                                            <dd>{scheduleLabel}</dd>
                                        </div>

                                        <div className="confirm-row">
                                            <dt>
                                                {method === 'jemput'
                                                    ? 'Alamat penjemputan'
                                                    : 'Lokasi penyerahan'}
                                            </dt>
                                            <dd>
                                                {method === 'jemput'
                                                    ? draft.address
                                                    : 'Outlet Cleanora'}
                                                <small>
                                                    {method === 'jemput'
                                                        ? 'Petugas akan mengonfirmasi ketersediaan jemput sesuai area dan jadwal.'
                                                        : 'Datang ke outlet pada jadwal yang dipilih.'}
                                                </small>
                                            </dd>
                                        </div>
                                    </dl>
                                </div>

                                <div className="confirm-notice">
                                    <span className="confirm-notice-icon">
                                        i
                                    </span>
                                    <div>
                                        <strong>
                                            Berat aktual menentukan harga final
                                        </strong>
                                        <p>
                                            Jumlah pada halaman ini adalah
                                            estimasi. Petugas akan menimbang
                                            cucian saat diterima, lalu biaya
                                            final dihitung dari berat aktual
                                            dan layanan yang dipilih.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <aside className="confirm-aside">
                                <div className="confirm-summary">
                                    <span className="section-label">
                                        RINGKASAN BIAYA
                                    </span>
                                    <h2>
                                        Estimasi <em>Pesanan.</em>
                                    </h2>
                                    <p>Periksa rincian sebelum konfirmasi.</p>

                                    <div className="confirm-summary-service">
                                        <span className="icon">✦</span>
                                        <div>
                                            <strong>{service.name}</strong>
                                            <small>
                                                {quantity} {service.unit}
                                            </small>
                                        </div>
                                    </div>

                                    <div className="confirm-summary-lines">
                                        <div className="confirm-line">
                                            <span>Tarif layanan</span>
                                            <strong>
                                                {rupiah(service.price)}/
                                                {service.unit}
                                            </strong>
                                        </div>

                                        <div className="confirm-line">
                                            <span>Jumlah / berat</span>
                                            <strong>
                                                {quantity} {service.unit}
                                            </strong>
                                        </div>

                                        <div className="confirm-line">
                                            <span>Biaya jemput</span>
                                            <strong>
                                                {method === 'jemput'
                                                    ? 'Dikonfirmasi'
                                                    : 'Rp0'}
                                            </strong>
                                        </div>

                                        <div className="confirm-line">
                                            <span>Biaya antar kembali</span>
                                            <strong>Belum termasuk</strong>
                                        </div>
                                    </div>

                                    <div className="confirm-total">
                                        <div>
                                            <span>
                                                Estimasi biaya layanan
                                            </span>
                                            <strong>{rupiah(total)}</strong>
                                        </div>
                                        <small>
                                            Estimasi belum termasuk biaya
                                            tambahan dan antar kembali.
                                        </small>
                                    </div>

                                    <div className="confirm-summary-note">
                                        <span>ⓘ</span>
                                        <p>
                                            Harga final dapat berubah setelah
                                            berat aktual dan kondisi barang
                                            diperiksa oleh petugas.
                                        </p>
                                    </div>

                                    {validationMessages.length > 0 && (
                                        <div
                                            className="confirm-error"
                                            role="alert"
                                        >
                                            <strong>
                                                Pesanan belum bisa
                                                dikonfirmasi.
                                            </strong>
                                            <ul>
                                                {validationMessages.map(
                                                    (message) => (
                                                        <li key={message}>
                                                            {message}
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="confirm-agreement">
                                        <label
                                            className="confirm-checkbox"
                                            htmlFor="confirm-agreement"
                                        >
                                            <input
                                                type="checkbox"
                                                id="confirm-agreement"
                                                checked={agreement}
                                                onChange={(event) =>
                                                    setAgreement(
                                                        event.target.checked,
                                                    )
                                                }
                                            />
                                            <span>
                                                Saya sudah memeriksa seluruh
                                                detail dan memahami bahwa harga
                                                final mengikuti berat aktual.
                                            </span>
                                        </label>
                                    </div>

                                    <button
                                        type="button"
                                        className="btn btn-primary confirm-submit"
                                        disabled={!agreement || processing}
                                        onClick={handleConfirm}
                                    >
                                        {processing
                                            ? 'Menyimpan pesanan…'
                                            : 'Konfirmasi pesanan'}{' '}
                                        {!processing && <span>→</span>}
                                    </button>

                                    <Link
                                        href={route('pelanggan.pesan')}
                                        className="confirm-back"
                                    >
                                        ← Kembali ubah data
                                    </Link>

                                    <p className="confirm-secure">
                                        <span>✓</span>
                                        Data dipakai hanya untuk memproses
                                        pesananmu.
                                    </p>
                                </div>

                                <div className="confirm-trust">
                                    <span className="confirm-trust-icon">
                                        ✓
                                    </span>
                                    <div>
                                        <strong>Konfirmasi sebelum proses</strong>
                                        <p>
                                            Cucian baru diproses setelah
                                            pesanan dan rincian biaya
                                            disetujui.
                                        </p>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    )}
                </div>
            </section>
        </CleanoraLayout>
    );
}
