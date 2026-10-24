import { Link, useForm, usePage } from '@inertiajs/react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit = (event) => {
        event.preventDefault();

        patch(route('profile.update'), {
            preserveScroll: true,
        });
    };

    return (
        <section className="profile-card profile-form-card">
            <div className="profile-card-head">
                <span className="profile-card-icon" aria-hidden="true">
                    01
                </span>
                <div>
                    <span className="section-label">DATA PRIBADI</span>
                    <h2>Informasi akun.</h2>
                    <p>
                        Nama dan email dipakai untuk keperluan pesanan dan
                        notifikasi Cleanora.
                    </p>
                </div>
            </div>

            <form className="profile-form" onSubmit={submit}>
                <div className="profile-fields">
                    <div className="profile-field">
                        <label htmlFor="name">Nama lengkap</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={data.name}
                            onChange={(event) =>
                                setData('name', event.target.value)
                            }
                            autoComplete="name"
                            required
                        />
                        {errors.name && (
                            <p className="profile-error" role="alert">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="profile-field">
                        <label htmlFor="email">Alamat email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={data.email}
                            onChange={(event) =>
                                setData('email', event.target.value)
                            }
                            autoComplete="username"
                            required
                        />
                        <span className="profile-field-hint">
                            Gunakan email aktif agar notifikasi pesanan tetap
                            diterima.
                        </span>
                        {errors.email && (
                            <p className="profile-error" role="alert">
                                {errors.email}
                            </p>
                        )}
                    </div>
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="profile-notice">
                        <span aria-hidden="true">!</span>
                        <p>
                            Email kamu belum terverifikasi.{' '}
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="profile-inline-link"
                            >
                                Kirim ulang tautan verifikasi
                            </Link>
                            .
                        </p>
                    </div>
                )}

                {status === 'verification-link-sent' && (
                    <p className="profile-notice is-success" role="status">
                        Tautan verifikasi baru sudah dikirim ke emailmu.
                    </p>
                )}

                <div className="profile-form-footer">
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={processing}
                    >
                        {processing ? 'Menyimpan...' : 'Simpan perubahan'}
                    </button>

                    {recentlySuccessful && (
                        <span className="profile-save-note" role="status">
                            Perubahan disimpan.
                        </span>
                    )}
                </div>
            </form>
        </section>
    );
}
