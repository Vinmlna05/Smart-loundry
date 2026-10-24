import '../../css/pelanggan.css';

import Footer from '@/Components/Cleanora/Footer';
import Navbar from '@/Components/Cleanora/Navbar';
import { Head, usePage } from '@inertiajs/react';
import { useMemo } from 'react';

const FOOTER_DESCRIPTION =
    'Perawatan pakaian yang lebih mudah, untuk keseharian yang lebih nyaman.';

export default function CleanoraLayout({
    title,
    active = 'dashboard',
    pageClassName = '',
    children,
}) {
    const user = usePage().props.auth.user;
    const isPengusaha = user?.role === 'pengusaha';
    const dashboardHref = route(
        isPengusaha ? 'pengusaha.dashboard' : 'pelanggan.dashboard',
    );
    const layananHref = isPengusaha ? null : route('pelanggan.layanan');
    const orderHref = isPengusaha ? null : route('pelanggan.pesan');
    const chatbotHref = isPengusaha ? null : route('pelanggan.chatbot');
    const trackHref = isPengusaha ? null : route('pelanggan.lacak-pesanan');
    const profileHref = route('profile.edit');
    const logoutHref = route('logout');

    const navItems = useMemo(() => {
        if (isPengusaha) {
            return [
                {
                    label: 'Dashboard',
                    href: dashboardHref,
                    active: active === 'dashboard',
                },
                {
                    label: 'Profil Saya',
                    href: profileHref,
                    active: active === 'profile',
                    mobileOnly: true,
                },
                {
                    label: 'Keluar',
                    href: logoutHref,
                    method: 'post',
                    mobileOnly: true,
                },
            ];
        }

        return [
            {
                label: 'Beranda',
                href: dashboardHref,
                active: active === 'dashboard',
            },
            {
                label: 'Layanan & Tarif',
                href: layananHref,
                active: active === 'layanan',
            },
            {
                label: 'Cara Pesan',
                href: `${dashboardHref}#cara-pesan`,
            },
            {
                label: 'Tentang Kami',
                href: `${dashboardHref}#tentang`,
            },
            {
                label: 'Profil Saya',
                href: profileHref,
                active: active === 'profile',
                mobileOnly: true,
            },
            {
                label: 'Keluar',
                href: logoutHref,
                method: 'post',
                mobileOnly: true,
            },
        ];
    }, [
        active,
        chatbotHref,
        dashboardHref,
        isPengusaha,
        layananHref,
        logoutHref,
        orderHref,
        profileHref,
    ]);

    const cta = useMemo(() => {
        if (isPengusaha) {
            return null;
        }

        return {
            label: 'Pesan Sekarang',
            href: orderHref,
            icon: '→',
        };
    }, [isPengusaha, orderHref]);

    const footerColumns = useMemo(() => {
        if (isPengusaha) {
            return [
                {
                    title: 'Navigasi',
                    links: [
                        { label: 'Dashboard', href: dashboardHref },
                        { label: 'Profil Saya', href: profileHref },
                        { label: 'Keluar', href: logoutHref, method: 'post' },
                    ],
                },
                {
                    title: 'Fitur',
                    links: [
                        {
                            label: 'Kelola Layanan',
                            href: `${dashboardHref}#kelola-layanan`,
                        },
                        {
                            label: 'Pesanan Masuk',
                            href: `${dashboardHref}#pesanan-masuk`,
                        },
                        {
                            label: 'Profil Usaha',
                            href: `${dashboardHref}#profil-usaha`,
                        },
                    ],
                },
                {
                    title: 'Akun',
                    links: [
                        { label: 'Informasi Profil', href: profileHref },
                        { label: 'Keamanan Akun', href: profileHref },
                        { label: 'Keluar', href: logoutHref, method: 'post' },
                    ],
                },
            ];
        }

        return [
            {
                title: 'Navigasi',
                links: [
                    { label: 'Beranda', href: dashboardHref },
                    { label: 'Layanan & Tarif', href: layananHref },
                    {
                        label: 'Cara Pesan',
                        href: `${dashboardHref}#cara-pesan`,
                    },
                    {
                        label: 'Tentang Kami',
                        href: `${dashboardHref}#tentang`,
                    },
                ],
            },
            {
                title: 'Layanan',
                links: [
                    {
                        label: 'Cuci Kering',
                        href: `${layananHref}#daftar-layanan`,
                    },
                    {
                        label: 'Cuci dan Setrika',
                        href: `${layananHref}#daftar-layanan`,
                    },
                    {
                        label: 'Setrika Saja',
                        href: `${layananHref}#daftar-layanan`,
                    },
                    {
                        label: 'Chatbot AI',
                        href: chatbotHref,
                    },
                    { label: 'Pesan Manual', href: orderHref },
                ],
            },
            {
                title: 'Bantuan',
                links: [
                    {
                        label: 'Lacak Pesanan',
                        href: trackHref,
                    },
                    { label: 'Pertanyaan Umum', href: `${layananHref}#faq` },
                    {
                        label: 'Hubungi Kami',
                        href: `${dashboardHref}#tentang`,
                    },
                    { label: 'Profil Saya', href: profileHref },
                    { label: 'Keluar', href: logoutHref, method: 'post' },
                ],
            },
        ];
    }, [
        chatbotHref,
        dashboardHref,
        isPengusaha,
        layananHref,
        logoutHref,
        orderHref,
        profileHref,
        trackHref,
    ]);

    return (
        <div className={`cleanora-page ${pageClassName}`.trim()}>
            <Head title={title}>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <Navbar
                brandHref={dashboardHref}
                items={navItems}
                user={user}
                profileHref={profileHref}
                cta={cta}
            />

            <main>{children}</main>

            <Footer
                brandHref={dashboardHref}
                description={FOOTER_DESCRIPTION}
                columns={footerColumns}
            />
        </div>
    );
}
