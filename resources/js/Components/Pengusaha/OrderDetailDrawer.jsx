import AdminIcon from '@/Components/Pengusaha/AdminIcon';
import {
    formatRupiah,
    initialsOf,
    orderStatusTone,
    orderTimeline,
} from '@/Data/adminOrders';
import { useEffect, useRef, useState } from 'react';

export default function OrderDetailDrawer({ order, onClose }) {
    const panelRef = useRef(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.body.classList.add('admin-drawer-open');
        window.addEventListener('keydown', handleKeyDown);
        panelRef.current?.focus();

        return () => {
            document.body.classList.remove('admin-drawer-open');
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    useEffect(() => {
        if (!copied) {
            return undefined;
        }

        const timeout = window.setTimeout(() => setCopied(false), 2000);

        return () => window.clearTimeout(timeout);
    }, [copied]);

    if (!order) {
        return null;
    }

    const location = order.address ?? order.outlet ?? 'Belum ditentukan';
    const isCanceled = order.status === 'Dibatalkan';

    const copyOrderNumber = async () => {
        try {
            await navigator.clipboard.writeText(order.id);
            setCopied(true);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div
            className="admin-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-order-drawer-title"
        >
            <button
                type="button"
                className="admin-drawer-backdrop"
                aria-label="Tutup detail pesanan"
                onClick={onClose}
            />

            <aside
                className="admin-drawer-panel"
                ref={panelRef}
                tabIndex={-1}
            >
                <div className="admin-drawer-head">
                    <div>
                        <span className="admin-card-label">
                            DETAIL PESANAN
                        </span>
                        <h2 id="admin-order-drawer-title">{order.id}</h2>
                    </div>
                    <button
                        type="button"
                        className="admin-icon-button"
                        aria-label="Tutup detail pesanan"
                        onClick={onClose}
                    >
                        <AdminIcon name="close" size={18} />
                    </button>
                </div>

                <div className="admin-drawer-body">
                    <div className="admin-drawer-status">
                        <span
                            className={`admin-status ${
                                orderStatusTone[order.status] ?? 'is-info'
                            }`}
                        >
                            <span aria-hidden="true" />
                            {order.status}
                        </span>
                        <span className="admin-source is-neutral">
                            {order.source}
                        </span>
                    </div>

                    <div className="admin-drawer-customer">
                        <span className="admin-avatar">
                            {initialsOf(order.customer)}
                        </span>
                        <div>
                            <strong>{order.customer}</strong>
                            <small>{order.phone}</small>
                        </div>
                        <span className="admin-drawer-time">{order.time}</span>
                    </div>

                    <dl className="admin-drawer-grid">
                        <div>
                            <dt>Layanan</dt>
                            <dd>{order.service}</dd>
                        </div>
                        <div>
                            <dt>Berat</dt>
                            <dd>{order.weight}</dd>
                        </div>
                        <div>
                            <dt>Metode</dt>
                            <dd>{order.intake}</dd>
                        </div>
                        <div>
                            <dt>Pembayaran</dt>
                            <dd>{order.payment}</dd>
                        </div>
                        <div>
                            <dt>Total</dt>
                            <dd className="admin-drawer-total">
                                {formatRupiah(order.total)}
                            </dd>
                        </div>
                        <div>
                            <dt>Nomor pesanan</dt>
                            <dd>{order.id}</dd>
                        </div>
                        <div className="admin-drawer-grid-wide">
                            <dt>{order.address ? 'Alamat jemput' : 'Outlet'}</dt>
                            <dd>{location}</dd>
                        </div>
                        {order.note && (
                            <div className="admin-drawer-grid-wide">
                                <dt>Catatan</dt>
                                <dd>{order.note}</dd>
                            </div>
                        )}
                    </dl>

                    {isCanceled ? (
                        <div className="admin-drawer-cancel">
                            <span>
                                <AdminIcon name="alert" size={16} />
                            </span>
                            <div>
                                <strong>Pesanan dibatalkan.</strong>
                                <p>
                                    Pesanan ini tidak dilanjutkan ke proses
                                    pencucian. Tidak ada pembayaran yang perlu
                                    ditagih.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="admin-drawer-timeline">
                            <span className="admin-card-label">
                                PROGRES PESANAN
                            </span>
                            <ol>
                                {orderTimeline.map((step, index) => {
                                    const stepClass =
                                        index < order.step
                                            ? 'is-done'
                                            : index === order.step
                                              ? 'is-current'
                                              : '';

                                    return (
                                        <li
                                            key={step.label}
                                            className={stepClass}
                                        >
                                            <span className="admin-timeline-dot">
                                                {index < order.step ? (
                                                    <AdminIcon
                                                        name="check"
                                                        size={11}
                                                    />
                                                ) : (
                                                    index + 1
                                                )}
                                            </span>
                                            <div>
                                                <strong>{step.label}</strong>
                                                <small>{step.detail}</small>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>
                    )}
                </div>

                <div className="admin-drawer-foot">
                    <p>
                        Data contoh untuk pratinjau. Pemrosesan pesanan akan
                        tersedia pada tahap berikutnya.
                    </p>
                    <div className="admin-drawer-actions">
                        <button
                            type="button"
                            className="admin-button admin-button-outline"
                            onClick={copyOrderNumber}
                        >
                            {copied ? 'Nomor disalin' : 'Salin nomor'}
                        </button>
                        <button
                            type="button"
                            className="admin-button admin-button-primary"
                            onClick={onClose}
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    );
}
