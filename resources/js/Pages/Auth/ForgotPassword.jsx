import AuthIcon from '@/Components/Auth/AuthIcon';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (event) => {
        event.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Lupa password" />

            <header className="auth-form-head">
                <span className="auth-kicker">Pemulihan akun</span>
                <h1>
                    Lupa <em>password?</em>
                </h1>
                <p>
                    Masukkan email akunmu. Kami akan mengirim tautan untuk
                    membuat password baru.
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

                <button
                    type="submit"
                    className="auth-submit"
                    disabled={processing}
                >
                    {processing ? 'Mengirim...' : 'Kirim tautan reset'}
                    {!processing && <AuthIcon name="arrow" size={17} />}
                </button>
            </form>

            <p className="auth-switch">
                Ingat passwordmu? <Link href={route('login')}>Masuk</Link>
            </p>
        </GuestLayout>
    );
}
