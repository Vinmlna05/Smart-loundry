import '../../css/auth.css';

import AuthIcon from '@/Components/Auth/AuthIcon';
import { Link } from '@inertiajs/react';

const benefits = [
    {
        icon: 'truck',
        title: 'Antar-jemput praktis',
        description: 'Atur penjemputan tanpa harus keluar rumah.',
    },
    {
        icon: 'package',
        title: 'Pesanan terpantau',
        description: 'Ikuti proses cucian dari awal sampai selesai.',
    },
    {
        icon: 'shield',
        title: 'Pembayaran jelas',
        description: 'Estimasi dan nota tersimpan rapi di akunmu.',
    },
];

const currentYear = new Date().getFullYear();

function BrandLogo() {
    return (
        <Link
            href="/"
            className="auth-brand-logo"
            aria-label="Cleanora, kembali ke beranda"
        >
            <span className="auth-brand-mark" aria-hidden="true">
                <AuthIcon name="spark" size={21} />
            </span>
            <span className="auth-brand-name">
                <strong>Cleanora</strong>
                <small>Laundry &amp; Care</small>
            </span>
        </Link>
    );
}

export default function GuestLayout({ children, wide = false }) {
    return (
        <div className="cleanora-auth">
            <div className="auth-shell">
                <aside className="auth-brand">
                    <BrandLogo />

                    <div className="auth-brand-copy">
                        <span className="auth-brand-kicker">
                            <span aria-hidden="true" />
                            Laundry tanpa ribet
                        </span>
                        <h2>
                            Cucian rapi,
                            <br />
                            <em>waktu kembali.</em>
                        </h2>
                        <p>
                            Serahkan cucian pada Cleanora. Kami urus
                            penjemputan, pencucian, sampai kembali bersih ke
                            tanganmu.
                        </p>

                        <ul className="auth-benefits">
                            {benefits.map((benefit) => (
                                <li key={benefit.title}>
                                    <span
                                        className="auth-benefit-icon"
                                        aria-hidden="true"
                                    >
                                        <AuthIcon
                                            name={benefit.icon}
                                            size={17}
                                        />
                                    </span>
                                    <span>
                                        <strong>{benefit.title}</strong>
                                        <small>{benefit.description}</small>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="auth-brand-foot">
                        <span aria-hidden="true">
                            <AuthIcon name="spark" size={15} />
                        </span>
                        <p>
                            Pesanan tercatat rapi, dari penjemputan sampai
                            kembali ke tanganmu.
                        </p>
                    </div>
                </aside>

                <main className="auth-panel">
                    <div className="auth-mobile-brand">
                        <BrandLogo />
                    </div>

                    <div
                        className={`auth-card${wide ? ' is-wide' : ''}`}
                    >
                        {children}
                    </div>

                    <p className="auth-copyright">
                        © {currentYear} Cleanora. Laundry &amp; Care.
                    </p>
                </main>
            </div>
        </div>
    );
}
