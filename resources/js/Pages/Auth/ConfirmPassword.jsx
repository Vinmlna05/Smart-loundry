import AuthIcon from '@/Components/Auth/AuthIcon';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    const submit = (event) => {
        event.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Konfirmasi password" />

            <header className="auth-form-head">
                <span className="auth-kicker">Area aman</span>
                <h1>
                    Konfirmasi <em>password.</em>
                </h1>
                <p>
                    Masukkan password akun untuk melanjutkan ke bagian yang
                    membutuhkan verifikasi tambahan.
                </p>
            </header>

            <form className="auth-form" onSubmit={submit}>
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

                <button
                    type="submit"
                    className="auth-submit"
                    disabled={processing}
                >
                    {processing ? 'Memeriksa...' : 'Konfirmasi'}
                    {!processing && <AuthIcon name="arrow" size={17} />}
                </button>
            </form>
        </GuestLayout>
    );
}
