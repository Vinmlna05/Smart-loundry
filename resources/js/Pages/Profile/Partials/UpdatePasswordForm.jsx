import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function UpdatePasswordForm() {
    const [showPassword, setShowPassword] = useState(false);

    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (event) => {
        event.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowPassword(false);
            },
            onError: (formErrors) => {
                if (formErrors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (formErrors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    const inputType = showPassword ? 'text' : 'password';

    return (
        <section className="profile-card profile-form-card">
            <div className="profile-card-head">
                <span className="profile-card-icon" aria-hidden="true">
                    02
                </span>
                <div>
                    <span className="section-label">KEAMANAN</span>
                    <h2>Kata sandi.</h2>
                    <p>
                        Gunakan kata sandi yang panjang dan unik agar akun tetap
                        aman.
                    </p>
                </div>
            </div>

            <form className="profile-form" onSubmit={updatePassword}>
                <div className="profile-password-meta">
                    <p>
                        Minimal 8 karakter. Kombinasikan huruf, angka, dan
                        simbol.
                    </p>

                    <label className="profile-toggle">
                        <input
                            type="checkbox"
                            checked={showPassword}
                            onChange={(event) =>
                                setShowPassword(event.target.checked)
                            }
                        />
                        Tampilkan kata sandi
                    </label>
                </div>

                <div className="profile-field">
                    <label htmlFor="current_password">Kata sandi saat ini</label>
                    <input
                        id="current_password"
                        ref={currentPasswordInput}
                        type={inputType}
                        value={data.current_password}
                        onChange={(event) =>
                            setData('current_password', event.target.value)
                        }
                        autoComplete="current-password"
                        required
                    />
                    {errors.current_password && (
                        <p className="profile-error" role="alert">
                            {errors.current_password}
                        </p>
                    )}
                </div>

                <div className="profile-fields">
                    <div className="profile-field">
                        <label htmlFor="password">Kata sandi baru</label>
                        <input
                            id="password"
                            ref={passwordInput}
                            type={inputType}
                            value={data.password}
                            onChange={(event) =>
                                setData('password', event.target.value)
                            }
                            autoComplete="new-password"
                            minLength={8}
                            required
                        />
                        {errors.password && (
                            <p className="profile-error" role="alert">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <div className="profile-field">
                        <label htmlFor="password_confirmation">
                            Ulangi kata sandi baru
                        </label>
                        <input
                            id="password_confirmation"
                            type={inputType}
                            value={data.password_confirmation}
                            onChange={(event) =>
                                setData(
                                    'password_confirmation',
                                    event.target.value,
                                )
                            }
                            autoComplete="new-password"
                            minLength={8}
                            required
                        />
                        {errors.password_confirmation && (
                            <p className="profile-error" role="alert">
                                {errors.password_confirmation}
                            </p>
                        )}
                    </div>
                </div>

                <div className="profile-form-footer">
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={processing}
                    >
                        {processing
                            ? 'Memperbarui...'
                            : 'Perbarui kata sandi'}
                    </button>

                    {recentlySuccessful && (
                        <span className="profile-save-note" role="status">
                            Kata sandi diperbarui.
                        </span>
                    )}
                </div>
            </form>
        </section>
    );
}
