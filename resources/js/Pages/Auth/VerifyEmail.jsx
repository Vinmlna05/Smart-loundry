import AuthIcon from '@/Components/Auth/AuthIcon';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (event) => {
        event.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Verifikasi email" />

            <header className="auth-form-head">
                <span className="auth-kicker">Satu langkah lagi</span>
                <h1>
                    Verifikasi <em>emailmu.</em>
                </h1>
                <p>
                    Kami sudah mengirim tautan verifikasi ke email yang kamu
                    daftarkan. Buka tautan tersebut untuk mulai memakai
                    Cleanora.
                </p>
            </header>

            {status === 'verification-link-sent' && (
                <div className="auth-alert is-success" role="status">
                    <AuthIcon name="check" size={15} />
                    <span>
                        Tautan verifikasi baru sudah dikirim ke emailmu.
                    </span>
                </div>
            )}

            <form className="auth-form" onSubmit={submit}>
                <button
                    type="submit"
                    className="auth-submit"
                    disabled={processing}
                >
                    {processing
                        ? 'Mengirim...'
                        : 'Kirim ulang tautan verifikasi'}
                    {!processing && <AuthIcon name="arrow" size={17} />}
                </button>
            </form>

            <p className="auth-switch">
                Sudah verifikasi?{' '}
                <Link href={route('login')}>Kembali masuk</Link>
            </p>

            <p className="auth-note">
                Belum menerima email? Periksa folder spam atau kirim ulang
                tautan di atas.
            </p>

            <p className="auth-switch">
                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="auth-link"
                >
                    Keluar dari akun
                </Link>
            </p>
        </GuestLayout>
    );
}
