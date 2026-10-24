import AuthIcon from '@/Components/Auth/AuthIcon';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });
    const [showPassword, setShowPassword] = useState(false);

    const submit = (event) => {
        event.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Masuk" />

            <header className="auth-form-head">
                <span className="auth-kicker">Selamat datang kembali</span>
                <h1>
                    Masuk ke <em>Cleanora.</em>
                </h1>
                <p>
                    Pantau pesanan dan kelola operasional laundry dalam satu
                    tempat yang rapi.
                </p>
            </header>

            {status && (
                <div className="auth-alert is-success" role="status">
                    <AuthIcon name="check" size={15} />
                    <span>{status}</span>
                </div>
            )}

            <form className="auth-form" onSubmit={submit}>
                <div className="auth-field">
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
                            autoFocus
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
                            autoComplete="current-password"
                            placeholder="Masukkan password"
                            aria-invalid={Boolean(errors.password)}
                            aria-describedby={
                                errors.password
                                    ? 'password-error'
                                    : undefined
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
                                setShowPassword((previous) => !previous)
                            }
                        >
                            <AuthIcon
                                name={showPassword ? 'eyeOff' : 'eye'}
                                size={17}
                            />
                        </button>
                    </div>
                    {errors.password && (
                        <p
                            className="auth-field-error"
                            id="password-error"
                            role="alert"
                        >
                            {errors.password}
                        </p>
                    )}
                </div>

                <div className="auth-row">
                    <label className="auth-check">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={data.remember}
                            onChange={(event) =>
                                setData('remember', event.target.checked)
                            }
                        />
                        <span className="auth-check-box" aria-hidden="true">
                            <AuthIcon name="check" size={11} />
                        </span>
                        <span>Ingat saya</span>
                    </label>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="auth-link"
                        >
                            Lupa password?
                        </Link>
                    )}
                </div>

                <button
                    type="submit"
                    className="auth-submit"
                    disabled={processing}
                >
                    {processing ? 'Memproses...' : 'Masuk ke akun'}
                    {!processing && <AuthIcon name="arrow" size={17} />}
                </button>
            </form>

            <p className="auth-switch">
                Belum punya akun?{' '}
                <Link href={route('register')}>Daftar gratis</Link>
            </p>

            <p className="auth-note">
                Halaman masuk ini dipakai oleh pelanggan dan pengusaha
                Cleanora.
            </p>
        </GuestLayout>
    );
}
