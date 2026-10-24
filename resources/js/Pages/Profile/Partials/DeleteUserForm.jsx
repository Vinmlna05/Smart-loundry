import Modal from '@/Components/Modal';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeleteUserForm() {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (event) => {
        event.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <>
            <section className="profile-card profile-form-card profile-danger-card">
                <div className="profile-card-head">
                    <span
                        className="profile-card-icon is-danger"
                        aria-hidden="true"
                    >
                        03
                    </span>
                    <div>
                        <span className="section-label">ZONA BERBAHAYA</span>
                        <h2>Hapus akun.</h2>
                        <p>
                            Menghapus akun bersifat permanen. Riwayat dan data
                            yang tersimpan tidak dapat dikembalikan.
                        </p>
                    </div>
                </div>

                <div className="profile-danger-body">
                    <p>
                        Pastikan kamu sudah menyimpan informasi penting sebelum
                        melanjutkan.
                    </p>

                    <button
                        type="button"
                        className="btn profile-danger-button"
                        onClick={confirmUserDeletion}
                    >
                        Hapus akun
                    </button>
                </div>
            </section>

            <Modal
                show={confirmingUserDeletion}
                onClose={closeModal}
                maxWidth="md"
            >
                <form onSubmit={deleteUser} className="profile-modal">
                    <span className="profile-modal-icon" aria-hidden="true">
                        !
                    </span>

                    <h2>Hapus akun ini?</h2>
                    <p>
                        Semua data akun akan dihapus permanen. Masukkan kata
                        sandi untuk mengonfirmasi tindakan ini.
                    </p>

                    <div className="profile-modal-field">
                        <label htmlFor="delete_password">Kata sandi</label>
                        <input
                            id="delete_password"
                            ref={passwordInput}
                            type="password"
                            name="password"
                            value={data.password}
                            onChange={(event) =>
                                setData('password', event.target.value)
                            }
                            placeholder="Masukkan kata sandi"
                            autoComplete="current-password"
                        />
                        {errors.password && (
                            <p className="profile-error" role="alert">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <div className="profile-modal-actions">
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={closeModal}
                        >
                            Batal
                        </button>

                        <button
                            type="submit"
                            className="btn profile-danger-button"
                            disabled={processing}
                        >
                            {processing ? 'Menghapus...' : 'Hapus akun'}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
