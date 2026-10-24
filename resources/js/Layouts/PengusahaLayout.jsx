import '../../css/pelanggan.css';
import '../../css/pengusaha.css';

import AdminIcon from '@/Components/Pengusaha/AdminIcon';
import { adminCustomers } from '@/Data/adminCustomers';
import { adminOrders } from '@/Data/adminOrders';
import {
    loadPengusahaProfile,
    PENGUSAHA_PROFILE_EVENT,
} from '@/Data/pengusahaProfile';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const initialsOf = (name) => {
    const parts = String(name ?? '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) {
        return 'CL';
    }

    return parts
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
};

const todayLabel = () =>
    new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(new Date());

export default function PengusahaLayout({
    title,
    active = 'dashboard',
    breadcrumb = 'Ringkasan',
    children,
}) {
    const user = usePage().props.auth.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [businessProfile, setBusinessProfile] = useState(
        loadPengusahaProfile,
    );
    const dashboardHref = route('pengusaha.dashboard');
    const ordersHref = route('pengusaha.pesanan');
    const customersHref = route('pengusaha.pelanggan');
    const servicesHref = route('pengusaha.layanan');
    const paymentsHref = route('pengusaha.pembayaran');
    const reportsHref = route('pengusaha.laporan');
    const chatbotHref = route('pengusaha.chatbot');
    const profileHref = route('profile.edit');
    const logoutHref = route('logout');
    const attentionCount = adminOrders.filter(
        (order) => order.group === 'attention',
    ).length;

    const navGroups = useMemo(
        () => [
            {
                title: 'Operasional',
                items: [
                    {
                        key: 'dashboard',
                        label: 'Dashboard',
                        icon: 'dashboard',
                        href: dashboardHref,
                        active: active === 'dashboard',
                    },
                    {
                        key: 'orders',
                        label: 'Manajemen pesanan',
                        icon: 'orders',
                        href: ordersHref,
                        active: active === 'orders',
                        badge: String(adminOrders.length),
                    },
                    {
                        key: 'customers',
                        label: 'Pelanggan',
                        icon: 'customers',
                        href: customersHref,
                        active: active === 'customers',
                        badge: String(adminCustomers.length),
                    },
                ],
            },
            {
                title: 'Pengelolaan',
                items: [
                    {
                        key: 'services',
                        label: 'Layanan & tarif',
                        icon: 'services',
                        href: servicesHref,
                        active: active === 'services',
                    },
                    {
                        key: 'payments',
                        label: 'Pembayaran',
                        icon: 'payments',
                        href: paymentsHref,
                        active: active === 'payments',
                        badge: String(
                            adminOrders.filter(
                                (order) =>
                                    order.status === 'Menunggu pembayaran',
                            ).length,
                        ),
                    },
                    {
                        key: 'reports',
                        label: 'Laporan',
                        icon: 'reports',
                        href: reportsHref,
                        active: active === 'reports',
                    },
                    {
                        key: 'chatbot',
                        label: 'Chatbot AI',
                        icon: 'chatbot',
                        href: chatbotHref,
                        active: active === 'chatbot',
                    },
                ],
            },
            {
                title: 'Akun',
                items: [
                    {
                        key: 'profile',
                        label: 'Profil usaha',
                        icon: 'profile',
                        href: profileHref,
                        active: active === 'profile',
                    },
                ],
            },
        ],
        [
            active,
            chatbotHref,
            customersHref,
            dashboardHref,
            ordersHref,
            paymentsHref,
            profileHref,
            reportsHref,
            servicesHref,
        ],
    );

    useEffect(() => {
        if (!sidebarOpen) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setSidebarOpen(false);
            }
        };

        document.body.classList.add('admin-nav-open');
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.classList.remove('admin-nav-open');
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [sidebarOpen]);

    useEffect(() => {
        const handleProfileUpdate = (event) => {
            setBusinessProfile(
                event.detail ?? loadPengusahaProfile(),
            );
        };

        window.addEventListener(
            PENGUSAHA_PROFILE_EVENT,
            handleProfileUpdate,
        );

        return () => {
            window.removeEventListener(
                PENGUSAHA_PROFILE_EVENT,
                handleProfileUpdate,
            );
        };
    }, []);

    const renderNavItem = (item) => {
        const classes = [
            'admin-nav-item',
            item.active ? 'is-active' : '',
            item.soon ? 'is-disabled' : '',
        ]
            .filter(Boolean)
            .join(' ');

        const content = (
            <>
                <span className="admin-nav-icon">
                    <AdminIcon name={item.icon} size={18} />
                </span>
                <span className="admin-nav-label">{item.label}</span>
                {item.soon && (
                    <span className="admin-nav-soon">Segera</span>
                )}
                {item.badge && (
                    <span className="admin-nav-badge">{item.badge}</span>
                )}
            </>
        );

        if (item.soon) {
            return (
                <div key={item.key} className={classes} aria-disabled="true">
                    {content}
                </div>
            );
        }

        if (item.href?.startsWith('#')) {
            return (
                <a
                    key={item.key}
                    href={item.href}
                    className={classes}
                    onClick={() => setSidebarOpen(false)}
                >
                    {content}
                </a>
            );
        }

        return (
            <Link
                key={item.key}
                href={item.href}
                className={classes}
                aria-current={item.active ? 'page' : undefined}
                onClick={() => setSidebarOpen(false)}
            >
                {content}
            </Link>
        );
    };

    return (
        <div className="cleanora-page cleanora-admin">
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

            <button
                type="button"
                className={`admin-sidebar-scrim${sidebarOpen ? ' is-visible' : ''}`}
                aria-label="Tutup menu navigasi"
                tabIndex={sidebarOpen ? 0 : -1}
                onClick={() => setSidebarOpen(false)}
            />

            <aside
                id="admin-sidebar"
                className={`admin-sidebar${sidebarOpen ? ' is-open' : ''}`}
                aria-label="Navigasi pengusaha"
            >
                <div className="admin-sidebar-brand">
                    <Link
                        href={dashboardHref}
                        className="admin-logo"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <span className="admin-logo-mark" aria-hidden="true">
                            ✦
                        </span>
                        <span className="admin-logo-text">
                            <strong>Cleanora</strong>
                            <small>Laundry &amp; Care</small>
                        </span>
                    </Link>

                    <button
                        type="button"
                        className="admin-sidebar-close"
                        aria-label="Tutup menu"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <AdminIcon name="close" size={19} />
                    </button>
                </div>

                <div className="admin-outlet">
                    <span className="admin-outlet-icon" aria-hidden="true">
                        ✦
                    </span>
                    <div>
                        <strong>{businessProfile.businessName}</strong>
                        <small>{businessProfile.operatingHours}</small>
                    </div>
                    <span className="admin-outlet-status" title="Outlet aktif">
                        Aktif
                    </span>
                </div>

                <nav className="admin-nav">
                    {navGroups.map((group) => (
                        <div key={group.title} className="admin-nav-group">
                            <span className="admin-nav-heading">
                                {group.title}
                            </span>
                            {group.items.map(renderNavItem)}
                        </div>
                    ))}
                </nav>

                <div className="admin-sidebar-foot">
                    <Link
                        href={profileHref}
                        className="admin-sidebar-user"
                    >
                        <span className="admin-avatar" aria-hidden="true">
                            {initialsOf(user?.name)}
                        </span>
                        <span className="admin-sidebar-user-text">
                            <strong>{user?.name}</strong>
                            <small>{user?.email}</small>
                        </span>
                        <AdminIcon name="chevron" size={15} />
                    </Link>

                    <Link
                        href={logoutHref}
                        method="post"
                        as="button"
                        className="admin-logout"
                    >
                        <AdminIcon name="logout" size={16} />
                        Keluar
                    </Link>
                </div>
            </aside>

            <div className="admin-frame">
                <header className="admin-topbar">
                    <div className="admin-topbar-left">
                        <button
                            type="button"
                            className="admin-menu-button"
                            aria-label="Buka menu navigasi"
                            aria-expanded={sidebarOpen}
                            aria-controls="admin-sidebar"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <AdminIcon name="menu" size={20} />
                        </button>

                        <div className="admin-breadcrumb">
                            <Link href={dashboardHref}>Dashboard</Link>
                            <span aria-hidden="true">/</span>
                            <span>{breadcrumb}</span>
                        </div>
                    </div>

                    <div className="admin-topbar-right">
                        <span className="admin-date">
                            <AdminIcon name="calendar" size={15} />
                            {todayLabel()}
                        </span>

                        <Link
                            href={`${ordersHref}?group=attention`}
                            className="admin-icon-button"
                            aria-label={`${attentionCount} pesanan perlu tindakan`}
                        >
                            <AdminIcon name="bell" size={18} />
                            <span className="admin-bell-count" aria-hidden="true">
                                {attentionCount}
                            </span>
                        </Link>

                        <span className="admin-topbar-divider" aria-hidden="true" />

                        <Link href={profileHref} className="admin-topbar-user">
                            <span className="admin-avatar" aria-hidden="true">
                                {initialsOf(user?.name)}
                            </span>
                            <span className="admin-topbar-user-text">
                                <strong>{user?.name}</strong>
                                <small>Pengusaha</small>
                            </span>
                        </Link>
                    </div>
                </header>

                <main className="admin-main">{children}</main>
            </div>
        </div>
    );
}
