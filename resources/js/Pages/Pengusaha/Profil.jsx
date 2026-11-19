import '../../../css/pengusaha-profil.css';

import AdminIcon from '@/Components/Pengusaha/AdminIcon';
import PengusahaLayout from '@/Layouts/PengusahaLayout';
import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const MAX_ACCOUNTS = 3;

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

const emptyAccount = (isPrimary = false) => ({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    isPrimary,
});

const normalizeAccounts = (accounts) => {
    if (!Array.isArray(accounts)) {
        return [];
    }

    const normalized = accounts
        .slice(0, MAX_ACCOUNTS)
        .map((account) => ({
            bankName: account.bankName ?? '',
            accountNumber: account.accountNumber ?? '',
            accountHolder: account.accountHolder ?? '',
            isPrimary: Boolean(account.isPrimary),
        }));

    if (normalized.length > 0 && !normalized.some((account) => account.isPrimary)) {
        normalized[0].isPrimary = true;
    }

    return normalized;
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

export default function PengusahaProfil({ profile, qrisUrl = null }) {
    const user = usePage().props.auth.user;
    const savedInitial = useMemo(
        () => ({
            businessName: profile?.businessName ?? '',
            whatsapp: profile?.whatsapp ?? '',
            outletAddress: profile?.outletAddress ?? '',
            operatingHours: profile?.operatingHours ?? '',
            bankAccounts: normalizeAccounts(profile?.bankAccounts),
        }),
        [profile],
    );
    const [savedProfile, setSavedProfile] = useState(savedInitial);
    const [form, setForm] = useState(savedInitial);
    const [qrisFile, setQrisFile] = useState(null);
    const [qrisPreview, setQrisPreview] = useState(qrisUrl);
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState('');

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
            label: 'Pembayaran & nota',
            description: 'Periksa pembayaran dan nota pelanggan',
            href: route('pengusaha.pembayaran'),
            icon: 'payments',
        },
    ];

    useEffect(() => {
        setSavedProfile(savedInitial);
        setForm(savedInitial);
        setQrisPreview(qrisUrl);
    }, [savedInitial, qrisUrl]);

    useEffect(() => {
        if (!toast) {
            return undefined;
        }

        const timeout = window.setTimeout(() => setToast(''), 3000);

        return () => window.clearTimeout(timeout);
    }, [toast]);

    useEffect(() => {
        if (!qrisFile) {
            return undefined;
        }

        const preview = URL.createObjectURL(qrisFile);
        setQrisPreview(preview);

        return () => URL.revokeObjectURL(preview);
    }, [qrisFile]);

    const updateField = (key, value) => {
        setForm((previous) => ({
            ...previous,
            [key]: value,
        }));
        setErrors((previous) => ({ ...previous, [key]: undefined }));
    };

    const updateAccount = (index, key, value) => {
        setForm((previous) => ({
            ...previous,
            bankAccounts: previous.bankAccounts.map((account, position) =>
                position === index ? { ...account, [key]: value } : account,
            ),
        }));
        setErrors((previous) => ({ ...previous, [`bankAccounts.${index}.${key}`]: undefined }));
    };

    const addAccount = () => {
        setForm((previous) => {
            if (previous.bankAccounts.length >= MAX_ACCOUNTS) {
                return previous;
            }

            return {
                ...previous,
                bankAccounts: [
                    ...previous.bankAccounts,
                    emptyAccount(previous.bankAccounts.length === 0),
                ],
            };
        });
    };

    const removeAccount = (index) => {
        setForm((previous) => {
            const next = previous.bankAccounts.filter(
                (_, position) => position !== index,
            );

            if (next.length > 0 && !next.some((account) => account.isPrimary)) {
                next[0] = { ...next[0], isPrimary: true };
            }

            return { ...previous, bankAccounts: next };
        });
    };

    const setPrimaryAccount = (index) => {
        setForm((previous) => ({
            ...previous,
            bankAccounts: previous.bankAccounts.map((account, position) => ({
                ...account,
                isPrimary: position === index,
            })),
        }));
    };

    const submitProfile = (event) => {
        event.preventDefault();
        setErrors({});

        router.patch(route('pengusaha.profil.update'), form, {
            preserveScroll: true,
            onSuccess: (page) => {
                const next = page.props.profile;

                if (next) {
                    const normalized = {
                        businessName: next.businessName ?? '',
                        whatsapp: next.whatsapp ?? '',
                        outletAddress: next.outletAddress ?? '',
                        operatingHours: next.operatingHours ?? '',
                        bankAccounts: normalizeAccounts(next.bankAccounts),
                    };

                    setSavedProfile(normalized);
                    setForm(normalized);
                }

                setToast(page.props.flash?.status ?? 'Profil usaha diperbarui.');
            },
            onError: (validationErrors) => {
                setErrors(validationErrors);
                setToast('Periksa kembali data profil usaha.');
            },
        });
    };

    const submitQris = (event) => {
        event.preventDefault();

        if (!qrisFile) {
            setErrors((previous) => ({
                ...previous,
                qris: 'Pilih foto QRIS terlebih dahulu.',
            }));

            return;
        }

        router.post(
            route('pengusaha.profil.qris'),
            { qris: qrisFile },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: (page) => {
                    setQrisFile(null);
                    setQrisPreview(page.props.qrisUrl);
                    setErrors((previous) => ({ ...previous, qris: undefined }));
                    setToast(page.props.flash?.status ?? 'Foto QRIS diperbarui.');
                },
                onError: (validationErrors) => {
                    setErrors((previous) => ({
                        ...previous,
                        ...validationErrors,
                    }));
                    setToast('Foto QRIS belum bisa disimpan.');
                },
            },
        );
    };

    const resetProfile = () => {
        setForm(savedProfile);
        setErrors({});
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
                        Lengkapi identitas usaha, rekening pembayaran, dan
                        foto QRIS yang dipakai pada operasional Cleanora.
                    </p>
                </div>

                <div className="admin-head-actions">
                    <span className="admin-sample-badge">
                        <span aria-hidden="true" />
                        Tersimpan di database
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
                                    <dt>Rekening aktif</dt>
                                    <dd>{form.bankAccounts.length} rekening</dd>
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
                                        {errors[field.key] && (
                                            <small className="admin-profile-field-error">
                                                {errors[field.key]}
                                            </small>
                                        )}
                                    </label>
                                ))}
                            </div>

                            <div className="admin-profile-accounts">
                                <div className="admin-profile-accounts-head">
                                    <div>
                                        <span className="admin-card-label">
                                            REKENING PEMBAYARAN
                                        </span>
                                        <h3>Rekening tujuan transfer</h3>
                                        <p>
                                            Tambahkan maksimal 3 rekening.
                                            Tandai satu rekening sebagai
                                            utama.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="admin-button admin-button-outline"
                                        onClick={addAccount}
                                        disabled={
                                            form.bankAccounts.length >=
                                            MAX_ACCOUNTS
                                        }
                                    >
                                        <AdminIcon name="plus" size={15} />
                                        Tambah rekening
                                    </button>
                                </div>

                                {form.bankAccounts.length === 0 && (
                                    <div className="admin-profile-account-empty">
                                        <strong>
                                            Belum ada rekening tujuan.
                                        </strong>
                                        <p>
                                            Tambahkan rekening agar nota
                                            transfer bisa dikirim ke pelanggan.
                                        </p>
                                    </div>
                                )}

                                <div className="admin-profile-account-list">
                                    {form.bankAccounts.map(
                                        (account, index) => (
                                            <div
                                                key={`account-${index}`}
                                                className={`admin-profile-account-row${
                                                    account.isPrimary
                                                        ? ' is-primary'
                                                        : ''
                                                }`}
                                            >
                                                <div className="admin-profile-account-top">
                                                    <label className="admin-profile-primary">
                                                        <input
                                                            type="radio"
                                                            name="primary-account"
                                                            checked={
                                                                account.isPrimary
                                                            }
                                                            onChange={() =>
                                                                setPrimaryAccount(
                                                                    index,
                                                                )
                                                            }
                                                        />
                                                        <span>Rekening utama</span>
                                                    </label>
                                                    <button
                                                        type="button"
                                                        className="admin-profile-account-remove"
                                                        onClick={() =>
                                                            removeAccount(
                                                                index,
                                                            )
                                                        }
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>

                                                <div className="admin-profile-account-fields">
                                                    <label>
                                                        <span>Nama bank</span>
                                                        <input
                                                            type="text"
                                                            value={
                                                                account.bankName
                                                            }
                                                            placeholder="Contoh: BCA"
                                                            onChange={(event) =>
                                                                updateAccount(
                                                                    index,
                                                                    'bankName',
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                        {errors[
                                                            `bankAccounts.${index}.bankName`
                                                        ] && (
                                                            <small className="admin-profile-field-error">
                                                                {
                                                                    errors[
                                                                        `bankAccounts.${index}.bankName`
                                                                    ]
                                                                }
                                                            </small>
                                                        )}
                                                    </label>
                                                    <label>
                                                        <span>
                                                            Nomor rekening
                                                        </span>
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            value={
                                                                account.accountNumber
                                                            }
                                                            placeholder="Contoh: 1234567890"
                                                            onChange={(event) =>
                                                                updateAccount(
                                                                    index,
                                                                    'accountNumber',
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                        {errors[
                                                            `bankAccounts.${index}.accountNumber`
                                                        ] && (
                                                            <small className="admin-profile-field-error">
                                                                {
                                                                    errors[
                                                                        `bankAccounts.${index}.accountNumber`
                                                                    ]
                                                                }
                                                            </small>
                                                        )}
                                                    </label>
                                                    <label>
                                                        <span>
                                                            Atas nama
                                                        </span>
                                                        <input
                                                            type="text"
                                                            value={
                                                                account.accountHolder
                                                            }
                                                            placeholder="Nama pemilik rekening"
                                                            onChange={(event) =>
                                                                updateAccount(
                                                                    index,
                                                                    'accountHolder',
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                        {errors[
                                                            `bankAccounts.${index}.accountHolder`
                                                        ] && (
                                                            <small className="admin-profile-field-error">
                                                                {
                                                                    errors[
                                                                        `bankAccounts.${index}.accountHolder`
                                                                    ]
                                                                }
                                                            </small>
                                                        )}
                                                    </label>
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>

                            {errors.bankAccounts && (
                                <p
                                    className="admin-profile-error"
                                    role="alert"
                                >
                                    {errors.bankAccounts}
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
                                    QRIS
                                </span>
                                <h2>Foto QR pembayaran</h2>
                                <p>
                                    Satu foto QRIS dipakai untuk semua nota
                                    QRIS. Unggah foto baru untuk menggantinya.
                                </p>
                            </div>
                            <span className="admin-profile-avatar">
                                <AdminIcon name="payments" size={18} />
                            </span>
                        </div>

                        <form
                            className="admin-profile-qris"
                            onSubmit={submitQris}
                        >
                            <div className="admin-profile-qris-preview">
                                {qrisPreview ? (
                                    <img
                                        src={qrisPreview}
                                        alt="Foto QRIS pembayaran Cleanora"
                                    />
                                ) : (
                                    <div className="admin-profile-qris-empty">
                                        <AdminIcon name="payments" size={24} />
                                        <strong>Belum ada foto QRIS</strong>
                                        <small>
                                            Unggah foto QRIS agar metode QRIS
                                            bisa dipakai saat membuat nota.
                                        </small>
                                    </div>
                                )}
                            </div>

                            <div className="admin-profile-qris-actions">
                                <label className="admin-profile-qris-input">
                                    <span>
                                        {qrisPreview
                                            ? 'Ganti foto QRIS'
                                            : 'Unggah foto QRIS'}
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png"
                                        onChange={(event) =>
                                            setQrisFile(
                                                event.target.files?.[0] ??
                                                    null,
                                            )
                                        }
                                    />
                                </label>
                                <small>
                                    Format JPG atau PNG, maksimal 2 MB.
                                </small>
                                {qrisFile && (
                                    <small>
                                        File dipilih: {qrisFile.name}
                                    </small>
                                )}
                                {errors.qris && (
                                    <small className="admin-profile-field-error">
                                        {errors.qris}
                                    </small>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="admin-button admin-button-primary"
                                disabled={!qrisFile}
                            >
                                Simpan foto QRIS
                            </button>
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
