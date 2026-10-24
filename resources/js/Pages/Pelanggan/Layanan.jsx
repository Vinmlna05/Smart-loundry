import '../../../css/layanan.css';

import { itemPrices, services } from '@/Data/services';
import CleanoraLayout from '@/Layouts/CleanoraLayout';
import { Link } from '@inertiajs/react';
import { useState } from 'react';

const filters = [
    { value: 'semua', label: 'Semua Layanan' },
    { value: 'kiloan', label: 'Laundry Kiloan' },
    { value: 'satuan', label: 'Laundry Satuan' },
    { value: 'tambahan', label: 'Layanan Tambahan' },
];

const policies = [
    {
        number: '01',
        title: 'Harga Kiloan',
        description:
            'Biaya akhir dihitung berdasarkan berat aktual dan tarif layanan yang dipilih.',
    },
    {
        number: '02',
        title: 'Harga Satuan',
        description:
            'Barang tertentu dihitung per potong, pasang, atau ukuran sesuai ketentuan outlet.',
    },
    {
        number: '03',
        title: 'Biaya Antar-Jemput',
        description:
            'Biaya mengikuti jarak, area layanan, dan ketentuan yang berlaku.',
    },
    {
        number: '04',
        title: 'Konfirmasi Sebelum Proses',
        description:
            'Pelanggan dapat memeriksa rincian biaya sebelum menyetujui pemrosesan pesanan.',
    },
];

const faqs = [
    {
        question: 'Apakah ada minimal berat laundry?',
        answer: 'Minimal berat mengikuti layanan yang dipilih. Sebagai contoh, layanan reguler pada halaman ini menggunakan minimal 3 kg. Tarif dan ketentuan aktual perlu dikonfirmasi ke outlet.',
    },
    {
        question:
            'Apakah tarif yang ditampilkan merupakan harga final?',
        answer: 'Tarif yang ditampilkan merupakan harga awal. Total akhir untuk layanan kiloan ditentukan berdasarkan berat aktual, layanan, dan biaya tambahan yang disetujui pelanggan.',
    },
    {
        question: 'Bisakah saya memesan melalui suara?',
        answer: 'Website ini dirancang untuk mendukung pemesanan manual dan chatbot dengan teks atau suara. Fitur suara akan berfungsi setelah integrasi chatbot selesai dibuat.',
    },
    {
        question: 'Apakah tersedia layanan antar-jemput?',
        answer: 'Layanan ini dapat disediakan sesuai area, jadwal, dan kebijakan outlet. Hubungi laundry untuk memastikan ketersediaannya.',
    },
];

export default function PelangganLayanan() {
    const [filter, setFilter] = useState('semua');

    const dashboardHref = route('pelanggan.dashboard');
    const orderHref = route('pelanggan.pesan');
    const chatbotHref = route('pelanggan.chatbot');

    return (
        <CleanoraLayout
            title="Layanan & Tarif"
            active="layanan"
            pageClassName="cleanora-services-page"
        >
                <section className="page-hero">
                    <div className="container page-hero-content">
                        <div className="breadcrumb">
                            <Link href={dashboardHref}>Beranda</Link>
                            <span>/</span>
                            <span>Layanan &amp; Tarif</span>
                        </div>

                        <span className="section-label">
                            PILIHAN LAYANAN CLEANORA
                        </span>

                        <h1>
                            Perawatan Terbaik
                            <br />
                            untuk Setiap <em>Pakaian.</em>
                        </h1>

                        <p>
                            Temukan layanan laundry yang sesuai dengan
                            kebutuhanmu. Tarif transparan, pilihan fleksibel,
                            dan pemesanan praktis.
                        </p>

                        <a href="#daftar-layanan" className="btn btn-primary">
                            Lihat Daftar Tarif <span>↓</span>
                        </a>

                        <div className="page-hero-decoration">✧</div>
                    </div>
                </section>

                <section className="benefit-strip">
                    <div className="container benefit-grid">
                        <div className="benefit-item">
                            <span className="benefit-icon">✓</span>
                            <div>
                                <strong>Tarif Transparan</strong>
                                <small>
                                    Harga dapat dilihat sebelum memesan
                                </small>
                            </div>
                        </div>

                        <div className="benefit-item">
                            <span className="benefit-icon">◷</span>
                            <div>
                                <strong>Pilihan Durasi</strong>
                                <small>Sesuaikan dengan kebutuhanmu</small>
                            </div>
                        </div>

                        <div className="benefit-item">
                            <span className="benefit-icon">✧</span>
                            <div>
                                <strong>Pilihan Layanan</strong>
                                <small>Per kilogram atau per potong</small>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="section" id="daftar-layanan">
                    <div className="container">
                        <div className="section-heading">
                            <div>
                                <span className="section-label">
                                    DAFTAR LAYANAN
                                </span>
                                <h2>
                                    Layanan untuk Kebutuhan
                                    <br />
                                    <em>Sehari-hari.</em>
                                </h2>
                                <p className="section-description">
                                    Pilih layanan untuk melihat tarif dan
                                    estimasi waktu pengerjaan.
                                </p>
                            </div>
                        </div>

                        <div
                            className="filter-bar"
                            aria-label="Filter kategori layanan"
                        >
                            {filters.map((item) => (
                                <button
                                    key={item.value}
                                    type="button"
                                    className={`filter-btn${filter === item.value ? ' active' : ''}`}
                                    aria-pressed={filter === item.value}
                                    onClick={() => setFilter(item.value)}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <div className="service-grid">
                            {services.map((service) => (
                                <article
                                    key={service.id}
                                    className={`service-card${service.popular ? ' featured' : ''}`}
                                    data-category={service.category}
                                    hidden={
                                        filter !== 'semua' &&
                                        service.category !== filter
                                    }
                                >
                                    <div className="service-image">
                                        <img
                                            src={service.image}
                                            alt={service.alt}
                                            loading="lazy"
                                        />

                                        <span className="service-tag">
                                            {service.tag}
                                        </span>

                                        {service.popular && (
                                            <span className="popular-tag">
                                                {service.popular}
                                            </span>
                                        )}
                                    </div>

                                    <div className="service-body">
                                        <div className="service-title-row">
                                            <h3>{service.title}</h3>
                                            <span className="service-index">
                                                {service.number}
                                            </span>
                                        </div>

                                        <p className="service-description">
                                            {service.description}
                                        </p>

                                        <div className="price-row">
                                            <span>{service.priceLabel}</span>
                                            <strong>
                                                {service.price}
                                                {service.unit && (
                                                    <small>
                                                        {service.unit}
                                                    </small>
                                                )}
                                            </strong>
                                        </div>

                                        <div className="service-meta">
                                            {service.meta.map((item) => (
                                                <span key={item}>{item}</span>
                                            ))}
                                        </div>

                                        <Link
                                            href={route('pelanggan.pesan', {
                                                layanan: service.id,
                                            })}
                                            className="btn btn-primary service-button"
                                        >
                                            Pilih Layanan <span>→</span>
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="section item-price-section">
                    <div className="container">
                        <div className="section-heading">
                            <div>
                                <span className="section-label">
                                    TARIF SATUAN
                                </span>
                                <h2>
                                    Perawatan <em>Per Potong.</em>
                                </h2>
                                <p className="section-description">
                                    Untuk pakaian atau barang tertentu yang
                                    tidak dihitung berdasarkan kilogram.
                                </p>
                            </div>
                        </div>

                        <div className="price-table-wrapper">
                            <table className="price-table">
                                <thead>
                                    <tr>
                                        <th scope="col">Jenis Barang</th>
                                        <th scope="col">Satuan</th>
                                        <th scope="col">Tarif Mulai</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {itemPrices.map((item) => (
                                        <tr key={item.name}>
                                            <td>
                                                <strong>{item.name}</strong>
                                                <small>{item.note}</small>
                                            </td>
                                            <td>{item.unit}</td>
                                            <td className="table-price">
                                                {item.price}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <p className="table-note">
                            * Tarif satuan merupakan contoh dan dapat berubah
                            sesuai jenis bahan, ukuran, serta tingkat
                            perawatan.
                        </p>
                    </div>
                </section>

                <section className="section policy-section">
                    <div className="container policy-grid">
                        <div className="policy-content">
                            <span className="section-label">
                                INFORMASI TARIF
                            </span>
                            <h2>
                                Harga Jelas,
                                <br />
                                Pesanan Lebih <em>Nyaman.</em>
                            </h2>

                            <p>
                                Kami ingin pelanggan memahami biaya layanan
                                sebelum menyelesaikan pesanan. Estimasi biaya
                                dapat berubah setelah berat aktual atau kondisi
                                barang diperiksa.
                            </p>

                            <Link href={orderHref} className="btn btn-primary">
                                Buat Pesanan <span>→</span>
                            </Link>
                        </div>

                        <div className="policy-list">
                            {policies.map((policy) => (
                                <article
                                    key={policy.number}
                                    className="policy-item"
                                >
                                    <span className="policy-icon">
                                        {policy.number}
                                    </span>
                                    <div>
                                        <h3>{policy.title}</h3>
                                        <p>{policy.description}</p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="section faq-section" id="faq">
                    <div className="container faq-container">
                        <div className="center-heading">
                            <span className="section-label">
                                BUTUH INFORMASI?
                            </span>
                            <h2>
                                Pertanyaan yang{' '}
                                <em>Sering Diajukan.</em>
                            </h2>
                            <p>Informasi singkat sebelum kamu memesan.</p>
                        </div>

                        <div className="faq-list">
                            {faqs.map((faq) => (
                                <details key={faq.question} className="faq-item">
                                    <summary>{faq.question}</summary>
                                    <p>{faq.answer}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="final-cta">
                    <div className="container final-cta-content">
                        <span className="section-label light-label">
                            SIAP MEMULAI?
                        </span>

                        <h2>Pilih Layanan yang Sesuai untukmu.</h2>

                        <p>
                            Pesan langsung melalui formulir atau gunakan
                            chatbot untuk membantu menyusun detail pesanan.
                        </p>

                        <div className="cta-buttons">
                            <Link href={orderHref} className="btn btn-light">
                                Pesan Manual <span>→</span>
                            </Link>

                            <Link
                                href={chatbotHref}
                                className="btn btn-ghost-light"
                            >
                                Coba Chatbot AI
                            </Link>
                        </div>
                    </div>
                </section>
        </CleanoraLayout>
    );
}
