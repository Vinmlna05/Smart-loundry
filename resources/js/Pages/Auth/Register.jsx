import AuthIcon from '@/Components/Auth/AuthIcon';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

const roles = [
    {
        value: 'pelanggan',
        icon: 'user',
        label: 'Pelanggan',
        description: 'Pesan, lacak, dan simpan riwayat cucian.',
    },
    {
        value: 'pengusaha',
        icon: 'package',
        label: 'Pengusaha',
        description: 'Kelola pesanan dan operasional outlet.',
    },
];

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const submit = (event) => {
        event.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout wide>
            <Head title="Daftar" />

            <header className="auth-form-head">
                <span className="auth-kicker">Akun baru</span>
                <h1>
                    Mulai dengan <em>Cleanora.</em>
                </h1>
                <p>
                    Pilih jenis akun, lalu lengkapi data untuk mulai memakai
                    layanan laundry.
                </p>
            </header>

            <form className="auth-form" onSubmit={submit}>
                <fieldset
                    className="auth-fieldset"
                    aria-describedby={
                        errors.role ? 'role-error' : undefined
                    }
                >
                    <legend>Daftar sebagai</legend>

                    <div className="auth-role-grid">
                        {roles.map((role) => {
                            const isActive = data.role === role.value;

                            return (
                                <label
                                    key={role.value}
                                    className={`auth-role${
                                        isActive ? ' is-active' : ''
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="role"
                                        value={role.value}
                                        checked={isActive}
                                        onChange={() =>
                                            setData('role', role.value)
                                        }
                                        required
                                    />
                                    <span
                                        className="auth-role-icon"
                                        aria-hidden="true"
                                    >
                                        <AuthIcon
                                            name={role.icon}
                                            size={16}
                                        />
                                    </span>
                                    <span className="auth-role-copy">
                                        <strong>{role.label}</strong>
                                        <small>{role.description}</small>
                                    </span>
                                    <span
                                        className="auth-role-check"
                                        aria-hidden="true"
                                    >
                                        <AuthIcon name="check" size={10} />
                                    </span>
                                </label>
                            );
                        })}
                    </div>

                    {errors.role && (
                        <p
                            className="auth-field-error"
                            id="role-error"
                            role="alert"
                        >
                            {errors.role}
                        </p>
                    )}
                </fieldset>

                <div className="auth-form-grid">
                    <div className="auth-field is-full">
                        <label htmlFor="name">Nama lengkap</label>
                        <div className="auth-input-wrap">
                            <span className="auth-input-icon">
                                <AuthIcon name="user" size={17} />
                            </span>
                            <input
                                id="name"
                                name="name"
                                value={data.name}
                                className="auth-input"
                                autoComplete="name"
                                placeholder="Nama lengkap"
                                aria-invalid={Boolean(errors.name)}
                                aria-describedby={
                                    errors.name ? 'name-error' : undefined
                                }
                                onChange={(event) =>
                                    setData('name', event.target.value)
                                }
                                autoFocus
                                required
                            />
                        </div>
                        {errors.name && (
                            <p
                                className="auth-field-error"
                                id="name-error"
                                role="alert"
                            >
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="auth-field is-full">
                        <label htmlFor="email">Email</label>
                        <div className="auth-input-wrap">
                            <span className="auth-input-icon">
                                <AuthIcon name="mail" size={17} />
                            </span>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="auth-input"
                                autoComplete="username"
                                placeholder="nama@email.com"
                                aria-invalid={Boolean(errors.email)}
                                aria-describedby={
                                    errors.email ? 'email-error' : undefined
                                }
                                onChange={(event) =>
                                    setData('email', event.target.value)
                                }
                                required
                            />
                        </div>
                        {errors.email && (
                            <p
                                className="auth-field-error"
                                id="email-error"
                                role="alert"
                            >
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div className="auth-field">
                        <label htmlFor="password">Password</label>
                        <div className="auth-input-wrap">
                            <span className="auth-input-icon">
                                <AuthIcon name="lock" size={17} />
                            </span>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={data.password}
                                className="auth-input has-toggle"
                                autoComplete="new-password"
                                placeholder="Minimal 8 karakter"
                                aria-invalid={Boolean(errors.password)}
                                aria-describedby={
                                    errors.password
                                        ? 'password-error'
                                        : 'password-hint'
                                }
                                onChange={(event) =>
                                    setData('password', event.target.value)
                                }
                                required
                            />
                            <button
                                type="button"
                                className="auth-input-toggle"
                                aria-label={
                                    showPassword
                                        ? 'Sembunyikan password'
                                        : 'Tampilkan password'
                                }
                                onClick={() =>
                                    setShowPassword(
                                        (previous) => !previous,
                                    )
                                }
                            >
                                <AuthIcon
                                    name={showPassword ? 'eyeOff' : 'eye'}
                                    size={17}
                                />
                            </button>
                        </div>
                        {errors.password ? (
                            <p
                                className="auth-field-error"
                                id="password-error"
                                role="alert"
                            >
                                {errors.password}
                            </p>
                        ) : (
                            <p
                                className="auth-field-hint"
                                id="password-hint"
                            >
                                Gunakan minimal 8 karakter.
                            </p>
                        )}
                    </div>

                    <div className="auth-field">
                        <label htmlFor="password_confirmation">
                            Konfirmasi password
                        </label>
                        <div className="auth-input-wrap">
                            <span className="auth-input-icon">
                                <AuthIcon name="lock" size={17} />
                            </span>
                            <input
                                id="password_confirmation"
                                type={
                                    showConfirmation ? 'text' : 'password'
                                }
                                name="password_confirmation"
                                value={data.password_confirmation}
                                className="auth-input has-toggle"
                                autoComplete="new-password"
                                placeholder="Ulangi password"
                                aria-invalid={Boolean(
                                    errors.password_confirmation,
                                )}
                                aria-describedby={
                                    errors.password_confirmation
                                        ? 'password-confirmation-error'
                                        : undefined
                                }
                                onChange={(event) =>
                                    setData(
                                        'password_confirmation',
                                        event.target.value,
                                    )
                                }
                                required
                            />
                            <button
                                type="button"
                                className="auth-input-toggle"
                                aria-label={
                                    showConfirmation
                                        ? 'Sembunyikan konfirmasi password'
                                        : 'Tampilkan konfirmasi password'
                                }
                                onClick={() =>
                                    setShowConfirmation(
                                        (previous) => !previous,
                                    )
                                }
                            >
                                <AuthIcon
                                    name={
                                        showConfirmation ? 'eyeOff' : 'eye'
                                    }
                                    size={17}
                                />
                            </button>
                        </div>
                        {errors.password_confirmation && (
                            <p
                                className="auth-field-error"
                                id="password-confirmation-error"
                                role="alert"
                            >
                                {errors.password_confirmation}
                            </p>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    className="auth-submit"
                    disabled={processing}
                >
                    {processing ? 'Membuat akun...' : 'Buat akun'}
                    {!processing && <AuthIcon name="arrow" size={17} />}
                </button>
            </form>

            <p className="auth-switch">
                Sudah punya akun? <Link href={route('login')}>Masuk</Link>
            </p>

            <p className="auth-note">
                Data akun dipakai untuk menyimpan riwayat pesanan dan
                memudahkan proses berikutnya.
            </p>
        </GuestLayout>
    );
}
