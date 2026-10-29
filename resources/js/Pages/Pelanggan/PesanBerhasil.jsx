import '../../../css/pesan-berhasil.css';

import CleanoraLayout from '@/Layouts/CleanoraLayout';
import { Link } from '@inertiajs/react';

const rupiah = (value) => `Rp${new Intl.NumberFormat('id-ID').format(value)}`;

const timeLabels = {
    '08:00-10:00': '08.00–10.00',
    '10:00-12:00': '10.00–12.00',
    '12:00-14:00': '12.00–14.00',
    '14:00-16:00': '14.00–16.00',
    '16:00-18:00': '16.00–18.00',
};

export default function PesanBerhasil({ order }) {
    const isPickup = order.intake_method === 'jemput';
    const schedule = order.schedule_label
        ? `${order.schedule_label} · ${
              timeLabels[order.schedule_time] ?? order.schedule_time
          }`
        : '-';

    const nextSteps = isPickup
        ? [
              'Petugas menghubungi nomor WhatsApp-mu untuk mengonfirmasi penjemputan.',
              'Cucian ditimbang saat diterima, lalu harga final dihitung.',
              'Nota dan instruksi pembayaran dikirim setelah penimbangan.',
          ]
        : [
              'Datang ke outlet Cleanora sesuai jadwal penyerahan.',
              'Cucian ditimbang saat diterima, lalu harga final dihitung.',
              'Nota dan instruksi pembayaran dikirim setelah penimbangan.',
          ];

    return (
        <CleanoraLayout
            title="Pesanan Dikonfirmasi"
            active="pesan"
            pageClassName="cleanora-success-page"
        >
            <section className="success-section">
                <div className="container success-wrap">
                    <div className="success-card">
                        <div className="success-icon">✓</div>
                        <span className="section-label">
                            PESANAN DIKONFIRMASI
                        </span>
                        <h1>
                            Terima kasih, <em>{order.customer.name}.</em>
                        </h1>
                        <p>
                            Pesananmu sudah tersimpan dan masuk ke alur
                            pemrosesan laundry. Simpan nomor pesanan di bawah
                            untuk melacak status.
                        </p>

                        <div className="success-number">
                            <span>Nomor pesanan</span>
                            <strong>{order.number}</strong>
                            <small>
                                Dibuat {order.created_at}. Gunakan nomor ini
                                saat melacak pesanan.
                            </small>
                        </div>

                        <div className="success-badges">
                            <span
                                className={`success-badge success-badge--${order.status_tone}`}
                            >
                                {order.status_label}
                            </span>
                            <span className="success-badge success-badge--warning">
                                {order.payment_label}
                            </span>
                        </div>

                        <div className="success-summary">
                            <div className="success-summary-head">
                                <span className="section-label">
                                    RINGKASAN PESANAN
                                </span>
                                <h2>
                                    Detail <em>Pesananmu.</em>
                                </h2>
                            </div>

                            <dl className="success-rows">
                                <div className="success-row">
                                    <dt>Layanan</dt>
                                    <dd>
                                        {order.item
                                            ? `${order.item.name} · ${order.item.quantity} ${order.item.unit}`
                                            : '-'}
                                    </dd>
                                </div>
                                <div className="success-row">
                                    <dt>Metode penyerahan</dt>
                                    <dd>
                                        {isPickup
                                            ? 'Jemput cucian'
                                            : 'Antar sendiri ke outlet'}
                                    </dd>
                                </div>
                                <div className="success-row">
                                    <dt>Jadwal</dt>
                                    <dd>{schedule}</dd>
                                </div>
                                {isPickup && (
                                    <div className="success-row">
                                        <dt>Alamat penjemputan</dt>
                                        <dd>{order.address}</dd>
                                    </div>
                                )}
                                {order.notes && (
                                    <div className="success-row">
                                        <dt>Catatan khusus</dt>
                                        <dd>{order.notes}</dd>
                                    </div>
                                )}
                                <div className="success-row success-row--total">
                                    <dt>Estimasi biaya layanan</dt>
                                    <dd>{rupiah(order.estimated_price)}</dd>
                                </div>
                            </dl>

                            <p className="success-price-note">
                                Estimasi belum termasuk biaya tambahan. Harga
                                final dihitung dari berat atau jumlah aktual
                                setelah cucian diterima.
                            </p>
                        </div>

                        <div className="success-next">
                            <strong>Langkah berikutnya</strong>
                            <ol>
                                {nextSteps.map((step) => (
                                    <li key={step}>{step}</li>
                                ))}
                            </ol>
                        </div>

                        <div className="success-actions">
                            <Link
                                href={route('pelanggan.lacak-pesanan')}
                                className="btn btn-primary"
                            >
                                Lacak pesanan <span>→</span>
                            </Link>
                            <Link
                                href={route('pelanggan.dashboard')}
                                className="btn btn-outline"
                            >
                                Kembali ke beranda
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </CleanoraLayout>
    );
}
