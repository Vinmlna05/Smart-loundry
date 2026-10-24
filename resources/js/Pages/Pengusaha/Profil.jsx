import '../../../css/pengusaha-profil.css';

import AdminIcon from '@/Components/Pengusaha/AdminIcon';
import {
    loadPengusahaProfile,
    savePengusahaProfile,
} from '@/Data/pengusahaProfile';
import PengusahaLayout from '@/Layouts/PengusahaLayout';
import { Link, usePage } from '@inertiajs/react';
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

const joinedLabel = (value) => {
    if (!value) {
        return 'Belum tercatat';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Belum tercatat';
    }

    return new Intl.DateTimeFormat('id-ID', {
        month: 'long',
        year: 'numeric',
    }).format(date);
};

const profileFields = [
    {
        key: 'businessName',
        label: 'Nama usaha',
        placeholder: 'Contoh: Cleanora Laundry',
        hint: 'Nama ini tampil di sidebar dan halaman operasional.',
        autoComplete: 'organization',
    },
    {
        key: 'whatsapp',
        label: 'Nomor WhatsApp usaha',
        placeholder: 'Contoh: 0812-3456-7890',
        hint: 'Dipakai untuk komunikasi pesanan dan nota pelanggan.',
        autoComplete: 'tel',
    },
    {
        key: 'outletAddress',
        label: 'Alamat outlet utama',
        placeholder: 'Alamat lengkap outlet',
        hint: 'Alamat ini menjadi lokasi penyerahan dan penjemputan.',
        autoComplete: 'street-address',
        wide: true,
    },
    {
        key: 'operatingHours',
        label: 'Jam operasional',
        placeholder: 'Contoh: Setiap hari, 07.00–21.00',
        hint: 'Tampil sebagai informasi operasional usaha.',
        autoComplete: 'off',
        wide: true,
    },
];

export default function PengusahaProfil() {
    const user = usePage().props.auth.user;
    const savedInitial = useMemo(() => loadPengusahaProfile(), []);
    const [savedProfile, setSavedProfile] = useState(savedInitial);
    const [form, setForm] = useState(savedInitial);
    const [toast, setToast] = useState('');
    const [error, setError] = useState('');

    const isDirty = JSON.stringify(form) !== JSON.stringify(savedProfile);
    const quickLinks = [
        {
            label: 'Dashboard',
            description: 'Ringkasan operasional hari ini',
            href: route('pengusaha.dashboard'),
            icon: 'dashboard',
        },
        {
            label: 'Manajemen pesanan',
            description: 'Cari, filter, dan proses pesanan',
            href: route('pengusaha.pesanan'),
            icon: 'orders',
        },
        {
            label: 'Layanan & tarif',
            description: 'Periksa layanan dan harga aktif',
            href: route('pengusaha.layanan'),
            icon: 'services',
        },
    ];

    useEffect(() => {
        if (!toast) {
            return undefined;
        }

        const timeout = window.setTimeout(() => setToast(''), 3000);

        return () => window.clearTimeout(timeout);
    }, [toast]);

    const updateField = (key, value) => {
        setForm((previous) => ({
            ...previous,
            [key]: value,
        }));
        setError('');
    };

    const submitProfile = (event) => {
        event.preventDefault();

        if (!form.businessName.trim() || !form.whatsapp.trim()) {
            setError(
                'Nama usaha dan nomor WhatsApp usaha perlu diisi sebelum menyimpan.',
            );

            return;
        }

        const nextProfile = savePengusahaProfile(form);

        setForm(nextProfile);
        setSavedProfile(nextProfile);
        setToast('Profil usaha diperbarui pada pratinjau lokal.');
    };

    const resetProfile = () => {
        setForm(savedProfile);
        setError('');
        setToast('Perubahan dikembalikan ke profil terakhir.');
    };

    return (
        <PengusahaLayout
            title="Profil Usaha — Cleanora"
            active="profile"
            breadcrumb="Profil usaha"
        >
            <div className="admin-page-head">
                <div className="admin-page-heading">
                    <span className="admin-eyebrow">
                        <span aria-hidden="true">✧</span>
                        Akun pengusaha
                    </span>
                    <h1>
                        Profil <em>usaha.</em>
                    </h1>
                    <p>
                        Lengkapi identitas usaha dan informasi kontak yang
                        dipakai pada operasional Cleanora.
                    </p>
                </div>

                <div className="admin-head-actions">
                    <span className="admin-sample-badge">
                        <span aria-hidden="true" />
                        Pratinjau lokal
                    </span>
                </div>
            </div>

            <div className="admin-profile-grid">
                <aside className="admin-profile-side">
                    <section className="admin-card admin-profile-identity">
                        <div className="admin-profile-cover">
                            <span
                                className="admin-profile-mark"
                                aria-hidden="true"
                            >
                                <AdminIcon name="profile" size={24} />
                            </span>
                            <span className="admin-profile-status">
                                Akun aktif
                            </span>
                        </div>

                        <div className="admin-profile-identity-body">
                            <span className="admin-card-label">
                                PENGUSAHA
                            </span>
                            <h2>{form.businessName || 'Nama usaha'}</h2>
                            <p>{form.outletAddress || 'Alamat belum diisi'}</p>

                            <div className="admin-profile-badges">
                                <span className="admin-profile-badge">
                                    Pengusaha
                                </span>
                                <span className="admin-profile-badge is-soft">
                                    {form.operatingHours ||
                                        'Jam belum diisi'}
                                </span>
                            </div>

                            <dl className="admin-profile-list">
                                <div>
                                    <dt>WhatsApp usaha</dt>
                                    <dd>{form.whatsapp || '-'}</dd>
                                </div>
                                <div>
                                    <dt>Pemilik akun</dt>
                                    <dd>{user?.name}</dd>
                                </div>
                                <div>
                                    <dt>Email</dt>
                                    <dd>{user?.email}</dd>
                                </div>
                                <div>
                                    <dt>Akses</dt>
                                    <dd>Dashboard pengusaha</dd>
                                </div>
                                <div>
                                    <dt>Bergabung</dt>
                                    <dd>{joinedLabel(user?.created_at)}</dd>
                                </div>
                            </dl>
                        </div>
                    </section>

                    <section className="admin-card admin-profile-quick">
                        <div className="admin-profile-card-head">
                            <div>
                                <span className="admin-card-label">
                                    AKSES CEPAT
                                </span>
                                <h2>Halaman kerja</h2>
                            </div>
                        </div>

                        <div className="admin-profile-links">
                            {quickLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className="admin-profile-link"
                                >
                                    <span className="admin-profile-link-icon">
                                        <AdminIcon
                                            name={link.icon}
                                            size={17}
                                        />
                                    </span>
                                    <span>
                                        <strong>{link.label}</strong>
                                        <small>{link.description}</small>
                                    </span>
                                    <AdminIcon name="chevron" size={14} />
                                </Link>
                            ))}
                        </div>
                    </section>
                </aside>

                <div className="admin-profile-main">
                    <section
                        className="admin-card admin-profile-form-card"
                        id="identitas-usaha"
                    >
                        <div className="admin-profile-card-head">
                            <div>
                                <span className="admin-card-label">
                                    IDENTITAS USAHA
                                </span>
                                <h2>Informasi usaha</h2>
                                <p>
                                    Data ini membantu pelanggan mengenali
                                    outlet dan menghubungi pengelola.
                                </p>
                            </div>
                            <span className="admin-profile-avatar">
                                {initialsOf(user?.name)}
                            </span>
                        </div>

                        <form
                            className="admin-profile-form"
                            onSubmit={submitProfile}
                        >
                            <div className="admin-profile-fields">
                                {profileFields.map((field) => (
                                    <label
                                        key={field.key}
                                        className={`admin-profile-field${
                                            field.wide ? ' is-wide' : ''
                                        }`}
                                    >
                                        <span>{field.label}</span>
                                        <input
                                            type="text"
                                            value={form[field.key]}
                                            placeholder={field.placeholder}
                                            autoComplete={field.autoComplete}
                                            onChange={(event) =>
                                                updateField(
                                                    field.key,
                                                    event.target.value,
                                                )
                                            }
                                            required={
                                                field.key ===
                                                    'businessName' ||
                                                field.key === 'whatsapp'
                                            }
                                        />
                                        <small>{field.hint}</small>
                                    </label>
                                ))}
                            </div>

                            {error && (
                                <p
                                    className="admin-profile-error"
                                    role="alert"
                                >
                                    {error}
                                </p>
                            )}

                            <div className="admin-profile-form-foot">
                                <div className="admin-profile-actions">
                                    <button
                                        type="submit"
                                        className="admin-button admin-button-primary"
                                        disabled={!isDirty}
                                    >
                                        Simpan perubahan
                                    </button>
                                    <button
                                        type="button"
                                        className="admin-button admin-button-outline"
                                        onClick={resetProfile}
                                        disabled={!isDirty}
                                    >
                                        Atur ulang
                                    </button>
                                </div>
                            </div>
                        </form>
                    </section>

                    <section className="admin-card admin-profile-form-card">
                        <div className="admin-profile-card-head">
                            <div>
                                <span className="admin-card-label">
                                    AKUN LOGIN
                                </span>
                                <h2>Akses pengelola</h2>
                                <p>
                                    Akun ini memakai akses pengusaha untuk
                                    melihat seluruh operasional outlet.
                                </p>
                            </div>
                        </div>

                        <dl className="admin-profile-account">
                            <div>
                                <dt>Nama pengelola</dt>
                                <dd>{user?.name}</dd>
                            </div>
                            <div>
                                <dt>Email login</dt>
                                <dd>{user?.email}</dd>
                            </div>
                            <div>
                                <dt>Peran</dt>
                                <dd>
                                    <span className="admin-profile-badge">
                                        Pengusaha
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt>Status akun</dt>
                                <dd>
                                    <span className="admin-profile-badge is-success">
                                        Aktif
                                    </span>
                                </dd>
                            </div>
                        </dl>
                    </section>

                    <p className="admin-profile-note">
                        Perubahan pada halaman ini masih berupa pratinjau
                        tampilan dan disimpan di browser, belum masuk ke
                        database.
                    </p>
                </div>
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
