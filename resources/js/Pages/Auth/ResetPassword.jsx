import AuthIcon from '@/Components/Auth/AuthIcon';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const submit = (event) => {
        event.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Password baru" />

            <header className="auth-form-head">
                <span className="auth-kicker">Pemulihan akun</span>
                <h1>
                    Buat password <em>baru.</em>
                </h1>
                <p>
                    Pilih password yang kuat dan mudah kamu ingat untuk
                    kembali mengakses akun.
                </p>
            </header>

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
                    <label htmlFor="password">Password baru</label>
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
                            autoFocus
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
                    {errors.password ? (
                        <p
                            className="auth-field-error"
                            id="password-error"
                            role="alert"
                        >
                            {errors.password}
                        </p>
                    ) : (
                        <p className="auth-field-hint" id="password-hint">
                            Gunakan minimal 8 karakter.
                        </p>
                    )}
                </div>

                <div className="auth-field">
                    <label htmlFor="password_confirmation">
                        Konfirmasi password baru
                    </label>
                    <div className="auth-input-wrap">
                        <span className="auth-input-icon">
                            <AuthIcon name="lock" size={17} />
                        </span>
                        <input
                            id="password_confirmation"
                            type={showConfirmation ? 'text' : 'password'}
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="auth-input has-toggle"
                            autoComplete="new-password"
                            placeholder="Ulangi password baru"
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
                                setShowConfirmation((previous) => !previous)
                            }
                        >
                            <AuthIcon
                                name={showConfirmation ? 'eyeOff' : 'eye'}
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

                <button
                    type="submit"
                    className="auth-submit"
                    disabled={processing}
                >
                    {processing ? 'Menyimpan...' : 'Simpan password baru'}
                    {!processing && <AuthIcon name="arrow" size={17} />}
                </button>
            </form>

            <p className="auth-switch">
                Kembali ke{' '}
                <Link href={route('login')}>halaman masuk</Link>
            </p>
        </GuestLayout>
    );
}
