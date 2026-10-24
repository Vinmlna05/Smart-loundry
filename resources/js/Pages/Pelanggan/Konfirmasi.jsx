import '../../../css/konfirmasi.css';

import { clearOrderDraft, readOrderDraft } from '@/Data/orderDraft';
import { orderServices } from '@/Data/services';
import CleanoraLayout from '@/Layouts/CleanoraLayout';
import { Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

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

export default function PelangganKonfirmasi() {
    const [draft] = useState(readOrderDraft);
    const [agreement, setAgreement] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const service = useMemo(
        () =>
            orderServices.find((item) => item.id === draft?.serviceId) ?? null,
        [draft],
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

    useEffect(() => {
        if (!isModalOpen) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsModalOpen(false);
            }
        };

        const previousOverflow = document.body.style.overflow;

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isModalOpen]);

    const handleConfirm = () => {
        if (!agreement || isConfirmed) {
            return;
        }

        setIsConfirmed(true);
        setIsModalOpen(true);
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

                                    {isConfirmed ? (
                                        <>
                                            <div className="confirm-status">
                                                <span className="confirm-status-icon">
                                                    ✓
                                                </span>
                                                <div>
                                                    <strong>
                                                        Pesanan dikonfirmasi
                                                    </strong>
                                                    <small>
                                                        Simulasi tampilan.
                                                        Pesanan belum
                                                        tersimpan ke database.
                                                    </small>
                                                </div>
                                            </div>

                                            <Link
                                                href={route(
                                                    'pelanggan.pesan',
                                                )}
                                                className="btn btn-outline confirm-new"
                                                onClick={clearOrderDraft}
                                            >
                                                Buat pesanan baru
                                            </Link>
                                        </>
                                    ) : (
                                        <>
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
                                                                event.target
                                                                    .checked,
                                                            )
                                                        }
                                                    />
                                                    <span>
                                                        Saya sudah memeriksa
                                                        seluruh detail dan
                                                        memahami bahwa harga
                                                        final mengikuti berat
                                                        aktual.
                                                    </span>
                                                </label>
                                            </div>

                                            <button
                                                type="button"
                                                className="btn btn-primary confirm-submit"
                                                disabled={!agreement}
                                                onClick={handleConfirm}
                                            >
                                                Konfirmasi pesanan{' '}
                                                <span>→</span>
                                            </button>

                                            <Link
                                                href={route(
                                                    'pelanggan.pesan',
                                                )}
                                                className="confirm-back"
                                            >
                                                ← Kembali ubah data
                                            </Link>
                                        </>
                                    )}

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

            {isModalOpen && isComplete && (
                <div
                    className="confirm-modal-backdrop"
                    onClick={(event) => {
                        if (event.target === event.currentTarget) {
                            setIsModalOpen(false);
                        }
                    }}
                >
                    <div
                        className="confirm-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="confirm-modal-title"
                    >
                        <div className="confirm-modal-icon">✓</div>
                        <span className="section-label">
                            PESANAN DIKONFIRMASI
                        </span>
                        <h2 id="confirm-modal-title">
                            Terima kasih, {draft.customerName}.
                        </h2>
                        <p>
                            Detail pesananmu sudah diperiksa dan siap
                            diteruskan ke alur pemrosesan laundry.
                        </p>

                        <div className="confirm-modal-note">
                            <strong>Catatan tahap pengembangan</strong>
                            <p>
                                Pesanan belum tersimpan ke database. Setelah
                                backend terhubung, nomor pesanan, nota, dan
                                konfirmasi WhatsApp akan dibuat otomatis.
                            </p>
                        </div>

                        <div className="confirm-modal-actions">
                            <Link
                                href={route('pelanggan.dashboard')}
                                className="btn btn-primary"
                            >
                                Kembali ke beranda
                            </Link>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Periksa lagi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </CleanoraLayout>
    );
}
