import '../../../css/profil.css';

import CleanoraLayout from '@/Layouts/CleanoraLayout';
import { Link, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

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

const joinedLabel = (value) => {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return new Intl.DateTimeFormat('id-ID', {
        month: 'long',
        year: 'numeric',
    }).format(date);
};

export default function Edit({ mustVerifyEmail, status }) {
    const user = usePage().props.auth.user;
    const isPengusaha = user?.role === 'pengusaha';
    const roleLabel = isPengusaha ? 'Pengusaha' : 'Pelanggan';
    const dashboardHref = isPengusaha
        ? route('pengusaha.dashboard')
        : route('pelanggan.dashboard');

    const quickLinks = isPengusaha
        ? [
              {
                  label: 'Dashboard',
                  href: dashboardHref,
              },
          ]
        : [
              {
                  label: 'Lacak pesanan',
                  href: route('pelanggan.lacak-pesanan'),
              },
              {
                  label: 'Pesan manual',
                  href: route('pelanggan.pesan'),
              },
              {
                  label: 'Chatbot AI',
                  href: route('pelanggan.chatbot'),
              },
          ];

    return (
        <CleanoraLayout
            title="Profil Saya — Cleanora"
            active="profile"
            pageClassName="cleanora-profile-page"
        >
            <section className="profile-hero">
                <div className="container profile-hero-content">
                    <div className="breadcrumb">
                        <Link href={dashboardHref}>Beranda</Link>
                        <span aria-hidden="true">/</span>
                        <span>Profil Saya</span>
                    </div>

                    <span className="section-label">AKUN SAYA</span>
                    <h1>
                        Profil <em>Saya.</em>
                    </h1>
                    <p>
                        Kelola data akun, keamanan, dan akses cepat ke pesananmu
                        dalam satu tempat.
                    </p>

                    <div className="profile-hero-note">
                        <span aria-hidden="true">✧</span>
                        <span>
                            Data akun hanya dipakai untuk kebutuhan pesanan dan
                            notifikasi Cleanora.
                        </span>
                    </div>
                </div>

                <span className="profile-hero-decoration" aria-hidden="true">
                    ✧
                </span>
            </section>

            <section className="profile-section">
                <div className="container">
                    <div className="profile-layout">
                        <aside className="profile-sidebar">
                            <div className="profile-card profile-summary">
                                <div className="profile-avatar">
                                    {initialsOf(user?.name)}
                                    <span
                                        className="profile-avatar-star"
                                        aria-hidden="true"
                                    >
                                        ✦
                                    </span>
                                </div>

                                <h2>{user?.name}</h2>
                                <p>{user?.email}</p>

                                <div className="profile-summary-badges">
                                    <span className="profile-role">
                                        {roleLabel}
                                    </span>
                                </div>

                                <div className="profile-summary-divider" />

                                <dl className="profile-summary-list">
                                    <div className="profile-summary-row">
                                        <dt>Status akun</dt>
                                        <dd className="is-active">Aktif</dd>
                                    </div>
                                    <div className="profile-summary-row">
                                        <dt>Peran</dt>
                                        <dd>{roleLabel}</dd>
                                    </div>
                                    <div className="profile-summary-row">
                                        <dt>Bergabung</dt>
                                        <dd>{joinedLabel(user?.created_at)}</dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="profile-card profile-nav-card">
                                <span className="profile-nav-label">
                                    Halaman akun
                                </span>
                                <nav
                                    className="profile-nav"
                                    aria-label="Navigasi halaman akun"
                                >
                                    <a
                                        href="#data-pribadi"
                                        className="profile-nav-item"
                                    >
                                        <span>Data pribadi</span>
                                        <span aria-hidden="true">→</span>
                                    </a>
                                    <a
                                        href="#keamanan"
                                        className="profile-nav-item"
                                    >
                                        <span>Keamanan</span>
                                        <span aria-hidden="true">→</span>
                                    </a>
                                    <a
                                        href="#hapus-akun"
                                        className="profile-nav-item"
                                    >
                                        <span>Hapus akun</span>
                                        <span aria-hidden="true">→</span>
                                    </a>
                                </nav>

                                <div className="profile-nav-divider" />

                                <span className="profile-nav-label">
                                    Akses cepat
                                </span>
                                <nav
                                    className="profile-nav"
                                    aria-label="Akses cepat"
                                >
                                    {quickLinks.map((link) => (
                                        <Link
                                            key={link.label}
                                            href={link.href}
                                            className="profile-nav-item"
                                        >
                                            <span>{link.label}</span>
                                            <span aria-hidden="true">→</span>
                                        </Link>
                                    ))}
                                </nav>
                            </div>
                        </aside>

                        <div className="profile-main">
                            <div
                                id="data-pribadi"
                                className="profile-anchor"
                            >
                                <UpdateProfileInformationForm
                                    mustVerifyEmail={mustVerifyEmail}
                                    status={status}
                                />
                            </div>

                            <div id="keamanan" className="profile-anchor">
                                <UpdatePasswordForm />
                            </div>

                            <div id="hapus-akun" className="profile-anchor">
                                <DeleteUserForm />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </CleanoraLayout>
    );
}
