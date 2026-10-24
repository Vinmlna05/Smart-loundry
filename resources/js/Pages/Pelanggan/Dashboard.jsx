import CleanoraLayout from '@/Layouts/CleanoraLayout';
import { Link } from '@inertiajs/react';

export default function PelangganDashboard() {
    const orderHref = route('pelanggan.pesan');

    return (
        <CleanoraLayout title="Dashboard Pelanggan" active="dashboard">
            <section className="hero" id="beranda">
                    <div className="container hero-container">
                        <div className="hero-content">
                            <span className="eyebrow">
                                <span className="eyebrow-dot"></span>
                                LAUNDRY CARE, MADE SIMPLE
                            </span>

                            <h1>
                                Pakaian Bersih,
                                <br />
                                Hidup Lebih
                                <em>Nyaman.</em>
                            </h1>

                            <p className="hero-description">
                                Serahkan urusan cucian kepada kami. Nikmati
                                pakaian bersih, wangi, dan rapi tanpa harus
                                menghabiskan waktu berharga.
                            </p>

                            <div className="hero-buttons">
                                <Link
                                    href={orderHref}
                                    className="btn btn-primary"
                                >
                                    Pesan Manual <span>→</span>
                                </Link>

                                <Link
                                    href={route('pelanggan.chatbot')}
                                    className="btn btn-outline"
                                >
                                    <span className="button-icon">✧</span>
                                    Pesan dengan AI
                                </Link>
                            </div>

                            <div className="hero-rating">
                                <div className="avatar-stack">
                                    <span>R</span>
                                    <span>A</span>
                                    <span>D</span>
                                </div>

                                <div className="rating-text">
                                    <div className="stars">★★★★★</div>
                                    <p>
                                        Praktis untuk kebutuhan laundry harian
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="hero-visual">
                            <img
                                src="https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?auto=format&fit=crop&w=1200&q=85"
                                alt="Pakaian bersih yang tertata rapi"
                                className="hero-image"
                            />

                            <div className="floating-card floating-top">
                                <span className="floating-icon">✦</span>
                                <div>
                                    <strong>Perawatan Terbaik</strong>
                                    <small>Pakaian bersih dan rapi</small>
                                </div>
                            </div>

                            <div className="floating-card floating-bottom">
                                <div className="status-dot"></div>
                                <div>
                                    <strong>Pesan Lebih Mudah</strong>
                                    <small>Manual atau dengan AI</small>
                                </div>
                            </div>

                            <div className="hero-decoration"></div>
                        </div>
                    </div>
                </section>

                <section className="benefits">
                    <div className="container benefits-grid">
                        <article className="benefit-item">
                            <div className="benefit-icon">◷</div>
                            <div>
                                <h3>Hemat Waktu</h3>
                                <p>Lebih banyak waktu untukmu</p>
                            </div>
                        </article>

                        <article className="benefit-item">
                            <div className="benefit-icon">✧</div>
                            <div>
                                <h3>Bersih dan Rapi</h3>
                                <p>Perawatan sesuai kebutuhan</p>
                            </div>
                        </article>

                        <article className="benefit-item">
                            <div className="benefit-icon">⌂</div>
                            <div>
                                <h3>Layanan Jemput</h3>
                                <p>Praktis sesuai ketersediaan</p>
                            </div>
                        </article>

                        <article className="benefit-item">
                            <div className="benefit-icon">♡</div>
                            <div>
                                <h3>Pesan dengan Mudah</h3>
                                <p>Melalui formulir atau chatbot</p>
                            </div>
                        </article>
                    </div>
                </section>

                <section className="section services-section" id="layanan">
                    <div className="container">
                        <div className="section-heading">
                            <div>
                                <span className="section-label">
                                    LAYANAN KAMI
                                </span>
                                <h2>
                                    Perawatan Pakaian
                                    <br />
                                    untuk Setiap <em>Kebutuhan.</em>
                                </h2>
                            </div>

                            <Link
                                href={route('pelanggan.layanan')}
                                className="text-link"
                            >
                                Lihat Semua Layanan <span>→</span>
                            </Link>
                        </div>

                        <div className="services-grid">
                            <article className="service-card">
                                <div className="service-image">
                                    <img
                                        src="https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=700&q=80"
                                        alt="Pakaian bersih setelah dicuci"
                                        loading="lazy"
                                    />
                                    <span className="service-number">01</span>
                                </div>

                                <div className="service-content">
                                    <h3>Cuci Kering</h3>
                                    <p>
                                        Pakaian bersih dan segar untuk
                                        menemani aktivitasmu.
                                    </p>
                                    <Link
                                        href={route('pelanggan.layanan')}
                                        className="service-link"
                                    >
                                        Pilih Layanan <span>→</span>
                                    </Link>
                                </div>
                            </article>

                            <article className="service-card">
                                <div className="service-image">
                                    <img
                                        src="https://images.unsplash.com/photo-1489274495757-95c7c837b101?auto=format&fit=crop&w=700&q=80"
                                        alt="Pakaian yang telah disetrika"
                                        loading="lazy"
                                    />
                                    <span className="service-number">02</span>
                                </div>

                                <div className="service-content">
                                    <h3>Cuci dan Setrika</h3>
                                    <p>
                                        Pakaian bersih, halus, dan siap
                                        digunakan kembali.
                                    </p>
                                    <Link
                                        href={route('pelanggan.layanan')}
                                        className="service-link"
                                    >
                                        Pilih Layanan <span>→</span>
                                    </Link>
                                </div>
                            </article>

                            <article className="service-card">
                                <div className="service-image">
                                    <img
                                        src="https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=700&q=80"
                                        alt="Perlengkapan perawatan laundry"
                                        loading="lazy"
                                    />
                                    <span className="service-number">03</span>
                                </div>

                                <div className="service-content">
                                    <h3>Setrika Saja</h3>
                                    <p>
                                        Solusi praktis agar pakaian terlihat
                                        lebih rapi.
                                    </p>
                                    <Link
                                        href={route('pelanggan.layanan')}
                                        className="service-link"
                                    >
                                        Pilih Layanan <span>→</span>
                                    </Link>
                                </div>
                            </article>
                        </div>
                    </div>
                </section>

                <section className="section process-section" id="cara-pesan">
                    <div className="container">
                        <div className="center-heading">
                            <span className="section-label">
                                MUDAH DAN PRAKTIS
                            </span>
                            <h2>
                                Laundry Jadi Lebih <em>Sederhana.</em>
                            </h2>
                            <p>
                                Hanya beberapa langkah untuk memulai pesanan
                                laundry kamu.
                            </p>
                        </div>

                        <div className="process-grid">
                            <article className="process-item">
                                <div className="process-icon">01</div>
                                <h3>Buat Pesanan</h3>
                                <p>
                                    Isi formulir pemesanan atau ceritakan
                                    kebutuhanmu melalui chatbot AI.
                                </p>
                            </article>

                            <article className="process-item">
                                <div className="process-icon">02</div>
                                <h3>Serahkan Cucian</h3>
                                <p>
                                    Pilih penjemputan jika tersedia atau antar
                                    pakaian langsung ke outlet.
                                </p>
                            </article>

                            <article className="process-item">
                                <div className="process-icon">03</div>
                                <h3>Cucian Diproses</h3>
                                <p>
                                    Kami menimbang, menentukan biaya final, dan
                                    memproses cucianmu.
                                </p>
                            </article>

                            <article className="process-item">
                                <div className="process-icon">04</div>
                                <h3>Terima Pakaian</h3>
                                <p>
                                    Ambil pakaian di outlet atau pilih
                                    pengantaran jika tersedia.
                                </p>
                            </article>
                        </div>
                    </div>
                </section>

                <section className="section chatbot-section" id="chatbot">
                    <div className="container">
                        <div className="chatbot-banner">
                            <div className="chatbot-content">
                                <span className="section-label light-label">
                                    CARA BARU MEMESAN LAUNDRY
                                </span>

                                <h2>
                                    Cukup Bicara,
                                    <br />
                                    Biar AI yang <em>Membantu.</em>
                                </h2>

                                <p>
                                    Tidak sempat mengisi formulir? Ceritakan
                                    kebutuhan laundry melalui teks atau suara.
                                    Chatbot akan membantu menyusun detail
                                    pesanan untuk kamu periksa.
                                </p>

                                <Link
                                    href={route('pelanggan.chatbot')}
                                    className="btn btn-light"
                                >
                                    Coba Chatbot AI <span>→</span>
                                </Link>

                                <div className="chatbot-features">
                                    <span>✓ Pesan melalui teks</span>
                                    <span>✓ Input suara</span>
                                    <span>✓ Ringkasan pesanan</span>
                                </div>
                            </div>

                            <div className="chatbot-visual">
                                <div className="chat-window">
                                    <div className="chat-header">
                                        <div className="bot-avatar">✧</div>
                                        <div>
                                            <strong>
                                                Cleanora Assistant
                                            </strong>
                                            <small>
                                                <span></span> Asisten laundry
                                                AI
                                            </small>
                                        </div>
                                    </div>

                                    <div className="chat-body">
                                        <div className="chat-message bot-message">
                                            Halo! Ada yang bisa saya bantu?
                                        </div>

                                        <div className="chat-message user-message">
                                            Saya mau laundry 3 kg.
                                        </div>

                                        <div className="chat-message bot-message">
                                            Tentu! Kamu ingin layanan cuci
                                            kering atau cuci dan setrika?
                                        </div>

                                        <div className="chat-input-demo">
                                            <span>Ketik pesan...</span>
                                            <span className="mic-icon">♫</span>
                                            <span className="send-icon">↑</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="chat-decoration decoration-one"></div>
                                <div className="chat-decoration decoration-two"></div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="section about-section" id="tentang">
                    <div className="container about-grid">
                        <div className="about-image">
                            <img
                                src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=85"
                                alt="Interior rumah yang nyaman"
                                loading="lazy"
                            />
                            <div className="about-image-caption">
                                <span>✧</span>
                                Praktis untuk keseharianmu
                            </div>
                        </div>

                        <div className="about-content">
                            <span className="section-label">
                                TENTANG CLEANORA
                            </span>
                            <h2>
                                Waktu Berharga
                                <br />
                                untuk Hal yang <em>Lebih Penting.</em>
                            </h2>

                            <p>
                                Kami percaya urusan laundry seharusnya tidak
                                menyulitkan. Cleanora hadir untuk membantu
                                kebutuhan perawatan pakaian melalui layanan yang
                                praktis dan pemesanan yang mudah.
                            </p>

                            <p>
                                Dengan pilihan pemesanan manual dan chatbot AI,
                                kamu bisa memilih cara yang paling nyaman untuk
                                memesan laundry.
                            </p>

                            <Link
                                href={route('pelanggan.layanan')}
                                className="btn btn-primary"
                            >
                                Lihat Layanan <span></span>
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="final-cta">
                    <div className="container final-cta-content">
                        <span className="section-label light-label">
                            SIAP UNTUK LEBIH PRAKTIS?
                        </span>
                        <h2>Urusan Cucian, Serahkan kepada Kami.</h2>
                        <p>
                            Mulai pesanan pertamamu dengan cara yang paling
                            nyaman.
                        </p>

                        <div className="hero-buttons centered-buttons">
                            <Link href={orderHref} className="btn btn-light">
                                Pesan Manual <span></span>
                            </Link>
                            <Link
                                href={route('pelanggan.chatbot')}
                                className="btn btn-ghost-light"
                            >
                                Gunakan Chatbot AI
                            </Link>
                        </div>
                    </div>
                </section>
        </CleanoraLayout>
    );
}
