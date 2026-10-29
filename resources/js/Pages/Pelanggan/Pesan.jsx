import '../../../css/pesan.css';

import SmartLink from '@/Components/Cleanora/SmartLink';
import { readOrderDraft, saveOrderDraft } from '@/Data/orderDraft';
import CleanoraLayout from '@/Layouts/CleanoraLayout';
import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const timeOptions = [
    { value: '08:00-10:00', label: '08.00–10.00' },
    { value: '10:00-12:00', label: '10.00–12.00' },
    { value: '12:00-14:00', label: '12.00–14.00' },
    { value: '14:00-16:00', label: '14.00–16.00' },
    { value: '16:00-18:00', label: '16.00–18.00' },
];

const rupiah = (value) =>
    `Rp${new Intl.NumberFormat('id-ID').format(value)}`;

const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const getServiceById = (services, id) =>
    services.find(
        (service) =>
            String(service.id) === String(id) ||
            String(service.slug) === String(id),
    ) ?? null;

export default function PelangganPesan({ services = [] }) {
    const { url } = usePage();

    const requestedServiceId = useMemo(() => {
        const query = url.split('?')[1] ?? '';
        return new URLSearchParams(query).get('layanan') ?? '';
    }, [url]);

    const savedDraft = useMemo(readOrderDraft, []);
    const initialService =
        getServiceById(services, requestedServiceId) ??
        getServiceById(services, savedDraft?.serviceId);

    const [customerName, setCustomerName] = useState(
        () => savedDraft?.customerName ?? '',
    );
    const [phone, setPhone] = useState(() => savedDraft?.phone ?? '');
    const [address, setAddress] = useState(() => savedDraft?.address ?? '');
    const [serviceId, setServiceId] = useState(
        () => initialService?.id ?? '',
    );
    const [quantity, setQuantity] = useState(() => {
        const savedQuantity = Number(savedDraft?.quantity);

        if (
            initialService &&
            Number.isFinite(savedQuantity) &&
            savedQuantity >= initialService.min
        ) {
            return String(Math.min(savedQuantity, 100));
        }

        return initialService ? String(initialService.min) : '1';
    });
    const [notes, setNotes] = useState(() => savedDraft?.notes ?? '');
    const [deliveryMethod, setDeliveryMethod] = useState(() =>
        savedDraft?.deliveryMethod === 'jemput' ? 'jemput' : 'antar-sendiri',
    );
    const [pickupDate, setPickupDate] = useState(
        () => savedDraft?.pickupDate ?? getLocalDateString(new Date()),
    );
    const [pickupTime, setPickupTime] = useState(
        () => savedDraft?.pickupTime ?? '',
    );
    const [agreement, setAgreement] = useState(false);

    const minPickupDate = useMemo(() => getLocalDateString(new Date()), []);

    useEffect(() => {
        const requestedService = getServiceById(services, requestedServiceId);

        if (!requestedService) {
            return;
        }

        setServiceId(requestedService.id);
        setQuantity((current) => {
            const numeric = Number(current) || requestedService.min;
            return String(Math.max(requestedService.min, numeric));
        });
    }, [requestedServiceId]);

    const selectedService = useMemo(
        () => getServiceById(services, serviceId),
        [serviceId, services],
    );

    const quantityConfig = useMemo(() => {
        if (!selectedService) {
            return {
                label: 'Berat / Jumlah Barang',
                min: 1,
                step: 1,
                hint: 'Pilih layanan terlebih dahulu untuk melihat satuan.',
            };
        }

        const isWeight = selectedService.unit === 'kg';

        return {
            label: isWeight
                ? 'Berat Cucian (kg)'
                : `Jumlah Barang (${selectedService.unit})`,
            min: selectedService.min,
            step: selectedService.step,
            hint: isWeight
                ? selectedService.min >= 3
                    ? 'Minimal 3 kg. Berat akhir dikonfirmasi saat penimbangan.'
                    : 'Minimal 1 kg. Berat akhir dikonfirmasi saat penimbangan.'
                : `Jumlah dihitung per ${selectedService.unit}. Harga akhir dapat bergantung pada ukuran atau bahan.`,
        };
    }, [selectedService]);

    const quantityValue = Number(quantity) || 0;
    const total = selectedService
        ? selectedService.price * quantityValue
        : 0;

    const handleServiceChange = (event) => {
        const nextService = getServiceById(services, event.target.value);

        setServiceId(event.target.value);
        setQuantity((current) => {
            if (!nextService) {
                return '1';
            }

            const numeric = Number(current) || nextService.min;
            return String(Math.max(nextService.min, numeric));
        });
    };

    const adjustQuantity = (direction) => {
        const min = selectedService?.min ?? 1;
        const step = selectedService?.step ?? 1;
        const current = Number(quantity) || min;
        const next =
            direction === 'increase'
                ? Math.min(100, current + step)
                : Math.max(min, current - step);

        setQuantity(String(next));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (
            !selectedService ||
            !Number.isFinite(quantityValue) ||
            quantityValue < selectedService.min ||
            quantityValue > 100
        ) {
            window.alert('Periksa kembali layanan dan jumlah pesanan.');
            return;
        }

        if (deliveryMethod === 'jemput' && !address.trim()) {
            window.alert(
                'Isi alamat penjemputan agar petugas dapat menjemput cucianmu.',
            );
            document.getElementById('address')?.focus();

            return;
        }

        saveOrderDraft({
            customerName: customerName.trim(),
            phone: phone.trim(),
            address: address.trim(),
            serviceId: selectedService.id,
            quantity: quantityValue,
            notes: notes.trim(),
            deliveryMethod,
            pickupDate,
            pickupTime,
        });

        router.visit(route('pelanggan.pesan.konfirmasi'));
    };

    return (
        <CleanoraLayout
            title="Pemesanan Manual"
            active="pesan"
            pageClassName="cleanora-order-page"
        >
            <section className="order-hero">
                <div className="container order-hero-content">
                    <div className="breadcrumb">
                        <Link href={route('pelanggan.dashboard')}>
                            Beranda
                        </Link>
                        <span>/</span>
                        <Link href={route('pelanggan.layanan')}>
                            Layanan &amp; Tarif
                        </Link>
                        <span>/</span>
                        <span>Pemesanan</span>
                    </div>

                    <span className="section-label">PEMESANAN MANUAL</span>

                    <h1>
                        Cucianmu, Kami
                        <br />
                        Urus dengan <em>Sepenuh Hati.</em>
                    </h1>

                    <p>
                        Isi formulir di bawah ini untuk memesan layanan
                        laundry. Periksa kembali detail pesanan sebelum
                        mengirimkannya.
                    </p>
                </div>
            </section>

            <section className="order-section">
                <div className="container order-layout">
                    <div className="form-column">
                        <div className="form-heading">
                            <span className="section-label">
                                FORMULIR PESANAN
                            </span>
                            <h2>
                                Lengkapi Detail <em>Pesananmu.</em>
                            </h2>
                            <p>
                                Kolom bertanda{' '}
                                <span className="required">*</span> wajib
                                diisi.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <section
                                className="form-card"
                                id="data-pelanggan"
                            >
                                <div className="form-section-title">
                                    <span className="step-number">01</span>
                                    <div>
                                        <h3>Informasi Pelanggan</h3>
                                        <p>Bagaimana kami menghubungimu?</p>
                                    </div>
                                </div>

                                <div className="form-fields">
                                    <div className="field full-width">
                                        <label htmlFor="customerName">
                                            Nama Lengkap{' '}
                                            <span className="required">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="customerName"
                                            name="customerName"
                                            value={customerName}
                                            onChange={(event) =>
                                                setCustomerName(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Masukkan nama lengkap"
                                            autoComplete="name"
                                            maxLength={100}
                                            required
                                        />
                                    </div>

                                    <div className="field full-width">
                                        <label htmlFor="phone">
                                            Nomor WhatsApp{' '}
                                            <span className="required">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={phone}
                                            onChange={(event) =>
                                                setPhone(event.target.value)
                                            }
                                            placeholder="Contoh: 081234567890"
                                            autoComplete="tel"
                                            inputMode="tel"
                                            maxLength={20}
                                            pattern="[0-9+() .-]{9,20}"
                                            title="Masukkan nomor telepon yang valid"
                                            required
                                        />
                                        <small>
                                            Pastikan nomor aktif agar kami
                                            dapat mengonfirmasi pesananmu.
                                        </small>
                                    </div>

                                </div>
                            </section>

                            <section
                                className="form-card"
                                id="detail-layanan"
                            >
                                <div className="form-section-title">
                                    <span className="step-number">02</span>
                                    <div>
                                        <h3>Pilih Layanan</h3>
                                        <p>
                                            Tentukan perawatan yang kamu
                                            butuhkan.
                                        </p>
                                    </div>
                                </div>

                                <div className="form-fields">
                                    <div className="field full-width">
                                        <label htmlFor="service">
                                            Jenis Layanan{' '}
                                            <span className="required">*</span>
                                        </label>

                                        <select
                                            id="service"
                                            name="service"
                                            value={serviceId}
                                            onChange={handleServiceChange}
                                            required
                                        >
                                            <option value="">
                                                Pilih layanan laundry
                                            </option>
                                            {services.map((service) => (
                                                <option
                                                    key={service.id}
                                                    value={service.id}
                                                >
                                                    {service.name} —{' '}
                                                    {service.startingAt
                                                        ? 'mulai '
                                                        : ''}
                                                    {rupiah(service.price)}/
                                                    {service.unit}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="field full-width">
                                        <label htmlFor="quantity">
                                            {quantityConfig.label}{' '}
                                            <span className="required">*</span>
                                        </label>

                                        <div className="quantity-control">
                                            <button
                                                type="button"
                                                className="quantity-btn"
                                                aria-label="Kurangi jumlah"
                                                onClick={() =>
                                                    adjustQuantity('decrease')
                                                }
                                            >
                                                −
                                            </button>

                                            <input
                                                type="number"
                                                id="quantity"
                                                name="quantity"
                                                min={quantityConfig.min}
                                                max={100}
                                                step={quantityConfig.step}
                                                value={quantity}
                                                onChange={(event) =>
                                                    setQuantity(
                                                        event.target.value,
                                                    )
                                                }
                                                required
                                            />

                                            <button
                                                type="button"
                                                className="quantity-btn"
                                                aria-label="Tambah jumlah"
                                                onClick={() =>
                                                    adjustQuantity('increase')
                                                }
                                            >
                                                +
                                            </button>
                                        </div>

                                        <small>{quantityConfig.hint}</small>
                                    </div>

                                    <div className="field full-width">
                                        <label htmlFor="notes">
                                            Catatan Khusus{' '}
                                            <span className="optional">
                                                (opsional)
                                            </span>
                                        </label>
                                        <textarea
                                            id="notes"
                                            name="notes"
                                            rows={3}
                                            maxLength={500}
                                            value={notes}
                                            onChange={(event) =>
                                                setNotes(event.target.value)
                                            }
                                            placeholder="Contoh: pisahkan pakaian putih, ada noda pada bagian kerah..."
                                        />
                                    </div>
                                </div>
                            </section>

                            <section
                                className="form-card"
                                id="metode-penyerahan"
                            >
                                <div className="form-section-title">
                                    <span className="step-number">03</span>
                                    <div>
                                        <h3>Penyerahan Cucian</h3>
                                        <p>
                                            Pilih cara menyerahkan cucianmu.
                                        </p>
                                    </div>
                                </div>

                                <div className="field full-width">
                                    <label>Metode Penyerahan</label>

                                    <div className="choice-grid">
                                        <label className="choice-card">
                                            <input
                                                type="radio"
                                                name="deliveryMethod"
                                                value="antar-sendiri"
                                                checked={
                                                    deliveryMethod ===
                                                    'antar-sendiri'
                                                }
                                                onChange={() =>
                                                    setDeliveryMethod(
                                                        'antar-sendiri',
                                                    )
                                                }
                                            />
                                            <span className="choice-icon">
                                                ⌂
                                            </span>
                                            <span className="choice-title">
                                                Antar Sendiri
                                            </span>
                                            <span className="choice-description">
                                                Datang ke outlet laundry.
                                            </span>
                                        </label>

                                        <label className="choice-card">
                                            <input
                                                type="radio"
                                                name="deliveryMethod"
                                                value="jemput"
                                                checked={
                                                    deliveryMethod === 'jemput'
                                                }
                                                onChange={() =>
                                                    setDeliveryMethod('jemput')
                                                }
                                            />
                                            <span className="choice-icon">
                                                ↗
                                            </span>
                                            <span className="choice-title">
                                                Jemput Cucian
                                            </span>
                                            <span className="choice-description">
                                                Kami jemput sesuai area
                                                layanan.
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                <div className="form-fields schedule-fields">
                                    {deliveryMethod === 'jemput' && (
                                        <div className="field full-width">
                                            <label htmlFor="address">
                                                Alamat Penjemputan{' '}
                                                <span className="required">
                                                    *
                                                </span>
                                            </label>
                                            <textarea
                                                id="address"
                                                name="address"
                                                rows={3}
                                                maxLength={500}
                                                autoComplete="street-address"
                                                value={address}
                                                onChange={(event) =>
                                                    setAddress(
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Nama jalan, nomor rumah, kelurahan, dan patokan"
                                                required
                                            />
                                            <small>
                                                Alamat lengkap membantu
                                                petugas menemukan lokasimu.
                                            </small>
                                        </div>
                                    )}

                                    <div className="field">
                                        <label htmlFor="pickupDate">
                                            Tanggal Penyerahan{' '}
                                            <span className="required">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            id="pickupDate"
                                            name="pickupDate"
                                            min={minPickupDate}
                                            value={pickupDate}
                                            onChange={(event) =>
                                                setPickupDate(
                                                    event.target.value,
                                                )
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="field">
                                        <label htmlFor="pickupTime">
                                            Perkiraan Waktu{' '}
                                            <span className="required">*</span>
                                        </label>
                                        <select
                                            id="pickupTime"
                                            name="pickupTime"
                                            value={pickupTime}
                                            onChange={(event) =>
                                                setPickupTime(
                                                    event.target.value,
                                                )
                                            }
                                            required
                                        >
                                            <option value="">
                                                Pilih waktu
                                            </option>
                                            {timeOptions.map((option) => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="notice-box">
                                    <span className="notice-icon">i</span>
                                    <p>
                                        {deliveryMethod === 'jemput'
                                            ? 'Permintaan jemput akan dikonfirmasi oleh pihak laundry. Biaya dan ketersediaan bergantung pada area.'
                                            : 'Silakan bawa cucian ke outlet pada waktu yang diminta. Jadwal tetap perlu dikonfirmasi.'}
                                    </p>
                                </div>
                            </section>

                            <div className="agreement">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        id="agreement"
                                        name="agreement"
                                        checked={agreement}
                                        onChange={(event) =>
                                            setAgreement(event.target.checked)
                                        }
                                        required
                                    />
                                    <span>
                                        Saya telah memeriksa informasi pesanan
                                        dan memahami bahwa total akhir dapat
                                        disesuaikan setelah berat atau kondisi
                                        barang dikonfirmasi.{' '}
                                        <span className="required">*</span>
                                    </span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary submit-button"
                            >
                                Periksa dan Konfirmasi Pesanan <span>→</span>
                            </button>

                            <p className="secure-note">
                                <span>✓</span>
                                Periksa kembali detail sebelum mengirim
                                pesanan.
                            </p>
                        </form>
                    </div>

                    <aside className="summary-column">
                        <div className="summary-card">
                            <div className="summary-header">
                                <span className="section-label">
                                    RINGKASAN PESANAN
                                </span>
                                <h3>
                                    Pesanan <em>Anda.</em>
                                </h3>
                                <p>Rincian biaya sementara.</p>
                            </div>

                            <div className="summary-service">
                                <div className="summary-service-icon">✦</div>
                                <div>
                                    <strong>
                                        {selectedService
                                            ? selectedService.name
                                            : 'Belum memilih layanan'}
                                    </strong>
                                    <small>
                                        {selectedService
                                            ? `${quantityValue} ${selectedService.unit}`
                                            : 'Pilih layanan'}
                                    </small>
                                </div>
                            </div>

                            <div className="summary-lines">
                                <div className="summary-line">
                                    <span>Tarif layanan</span>
                                    <strong>
                                        {selectedService
                                            ? `${rupiah(selectedService.price)}/${selectedService.unit}`
                                            : 'Rp0'}
                                    </strong>
                                </div>

                                <div className="summary-line">
                                    <span>Jumlah / berat</span>
                                    <strong>
                                        {selectedService
                                            ? `${quantityValue} ${selectedService.unit}`
                                            : '0'}
                                    </strong>
                                </div>

                                <div className="summary-line">
                                    <span>Biaya jemput</span>
                                    <strong>
                                        {deliveryMethod === 'jemput'
                                            ? 'Dikonfirmasi'
                                            : 'Rp0'}
                                    </strong>
                                </div>

                                <div className="summary-line">
                                    <span>Biaya antar kembali</span>
                                    <strong>Belum termasuk</strong>
                                </div>
                            </div>

                            <div className="summary-total">
                                <span>Estimasi biaya layanan</span>
                                <strong>{rupiah(total)}</strong>
                                <small>
                                    {selectedService
                                        ? 'Estimasi layanan, belum termasuk biaya tambahan.'
                                        : 'Pilih layanan untuk melihat estimasi.'}
                                </small>
                            </div>

                            <div className="summary-footnote">
                                <span>ⓘ</span>
                                <p>
                                    Ini hanya estimasi. Biaya final dapat
                                    berubah berdasarkan berat aktual, kondisi
                                    barang, area penjemputan, dan konfirmasi
                                    pihak laundry.
                                </p>
                            </div>

                            <div className="summary-divider"></div>

                            <div className="summary-help">
                                <div className="help-icon">?</div>
                                <div>
                                    <strong>
                                        Butuh bantuan memesan?
                                    </strong>
                                    <p>
                                        Kamu juga dapat menggunakan chatbot
                                        untuk membantu menyusun pesanan.
                                    </p>
                                    <SmartLink
                                        href={route('pelanggan.chatbot')}
                                    >
                                        Coba Chatbot AI →
                                    </SmartLink>
                                </div>
                            </div>
                        </div>

                        <div className="trust-card">
                            <span className="trust-icon">✓</span>
                            <div>
                                <strong>Transparansi Harga</strong>
                                <p>
                                    Konfirmasi rincian biaya sebelum laundry
                                    diproses.
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </CleanoraLayout>
    );
}
