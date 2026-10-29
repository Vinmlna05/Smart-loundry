import '../../../css/pengusaha-layanan.css';

import AdminIcon from '@/Components/Pengusaha/AdminIcon';
import {
    serviceCategories,
    serviceCategoryConfig,
} from '@/Data/adminServices';
import { formatRupiah } from '@/Data/adminOrders';
import PengusahaLayout from '@/Layouts/PengusahaLayout';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const categoryOrder = {
    kiloan: 0,
    satuan: 1,
    tambahan: 2,
};

const formatTanggal = (value) =>
    value
        ? new Intl.DateTimeFormat('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
          }).format(new Date(`${value}T12:00:00`))
        : 'Baru saja';

const priceLabel = (service) =>
    service.price === 0 ? 'Gratis' : formatRupiah(service.price);

export default function PengusahaLayanan({ services = [] }) {
    const { flash, errors } = usePage().props;
    const [serviceList, setServiceList] = useState(services);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('category');
    const [selectedServiceId, setSelectedServiceId] = useState(null);
    const [formMode, setFormMode] = useState(null);
    const [toast, setToast] = useState('');

    useEffect(() => {
        setServiceList(services);
    }, [services]);

    useEffect(() => {
        if (flash?.status) {
            setToast(flash.status);
        }
    }, [flash?.status]);

    const activeCount = serviceList.filter(
        (service) => service.active,
    ).length;
    const inactiveCount = serviceList.length - activeCount;
    const selectedService =
        serviceList.find((service) => service.id === selectedServiceId) ??
        null;
    const satuanServices = useMemo(
        () =>
            serviceList.filter(
                (service) => service.category === 'satuan',
            ),
        [serviceList],
    );

    const summaryItems = useMemo(
        () => [
            {
                key: 'all',
                label: 'Semua layanan',
                value: serviceList.length,
                note: `${activeCount} aktif, ${inactiveCount} nonaktif`,
                icon: 'services',
                tone: 'is-teal',
            },
            {
                key: 'kiloan',
                label: 'Kiloan',
                value: serviceList.filter(
                    (service) => service.category === 'kiloan',
                ).length,
                note: 'Dihitung berdasarkan berat',
                icon: 'package',
                tone: 'is-blue',
            },
            {
                key: 'satuan',
                label: 'Satuan',
                value: serviceList.filter(
                    (service) => service.category === 'satuan',
                ).length,
                note: 'Per pcs, pasang, atau item',
                icon: 'spark',
                tone: 'is-gold',
            },
            {
                key: 'tambahan',
                label: 'Tambahan',
                value: serviceList.filter(
                    (service) => service.category === 'tambahan',
                ).length,
                note: 'Antar dan jemput cucian',
                icon: 'truck',
                tone: 'is-green',
            },
        ],
        [activeCount, inactiveCount, serviceList],
    );

    const filteredServices = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return serviceList
            .filter((service) => {
                if (
                    selectedCategory !== 'all' &&
                    service.category !== selectedCategory
                ) {
                    return false;
                }

                if (
                    statusFilter !== 'all' &&
                    service.active !== (statusFilter === 'active')
                ) {
                    return false;
                }

                if (!keyword) {
                    return true;
                }

                return [
                    service.name,
                    service.description,
                    service.unitLabel,
                    service.duration,
                    service.minimum,
                ].some((value) =>
                    String(value).toLowerCase().includes(keyword),
                );
            })
            .sort((first, second) => {
                if (sortBy === 'name') {
                    return first.name.localeCompare(second.name, 'id');
                }

                if (sortBy === 'price-desc') {
                    return second.price - first.price;
                }

                if (sortBy === 'price-asc') {
                    return first.price - second.price;
                }

                return (
                    categoryOrder[first.category] -
                        categoryOrder[second.category] ||
                    first.name.localeCompare(second.name, 'id')
                );
            });
    }, [search, selectedCategory, serviceList, sortBy, statusFilter]);

    const hasFilters =
        selectedCategory !== 'all' || statusFilter !== 'all' || search !== '';

    useEffect(() => {
        if (!toast) {
            return undefined;
        }

        const timeout = window.setTimeout(() => setToast(''), 3000);

        return () => window.clearTimeout(timeout);
    }, [toast]);

    useEffect(() => {
        if (!selectedServiceId) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setSelectedServiceId(null);
            }
        };

        document.body.classList.add('admin-drawer-open');
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.classList.remove('admin-drawer-open');
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedServiceId]);

    const resetFilters = () => {
        setSelectedCategory('all');
        setStatusFilter('all');
        setSearch('');
        setSortBy('category');
    };

    const toggleService = (serviceId) => {
        const service = serviceList.find((item) => item.id === serviceId);

        if (!service) {
            return;
        }

        router.patch(
            route('pengusaha.layanan.update', service.id),
            { is_active: !service.active },
            {
                preserveScroll: true,
                onError: () => {
                    setToast('Status layanan gagal diperbarui.');
                },
            },
        );
    };

    const downloadTariffs = () => {
        if (filteredServices.length === 0) {
            setToast('Tidak ada layanan yang bisa diunduh.');

            return;
        }

        const rows = [
            [
                'Layanan',
                'Kategori',
                'Tarif',
                'Satuan',
                'Minimum',
                'Estimasi',
                'Status',
                'Deskripsi',
            ],
            ...filteredServices.map((service) => [
                service.name,
                serviceCategoryConfig[service.category].label,
                service.price,
                service.unit,
                service.minimum,
                service.duration,
                service.active ? 'Aktif' : 'Nonaktif',
                service.description,
            ]),
        ];

        const csv = rows
            .map((row) =>
                row
                    .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                    .join(','),
            )
            .join('\r\n');
        const blob = new Blob([`\uFEFF${csv}`], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `cleanora-tarif-${new Date()
            .toISOString()
            .slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);

        setToast(`${filteredServices.length} tarif berhasil diunduh.`);
    };

    return (
        <PengusahaLayout
            title="Layanan & Tarif - Cleanora"
            active="services"
            breadcrumb="Layanan & tarif"
        >
            <div className="admin-page-head">
                <div className="admin-page-heading">
                    <span className="admin-eyebrow">
                        <span aria-hidden="true">✦</span>
                        Pengaturan usaha
                    </span>
                    <h1>
                        Layanan &amp; <em>tarif.</em>
                    </h1>
                    <p>
                        Periksa jenis layanan, tarif per kilogram atau satuan,
                        estimasi pengerjaan, dan status tampil di halaman
                        pelanggan.
                    </p>
                </div>

                <div className="admin-head-actions">
                    <span className="admin-sample-badge">
                        <span aria-hidden="true" />
                        Tersimpan di database
                    </span>
                    <button
                        type="button"
                        className="admin-button admin-button-outline"
                        onClick={downloadTariffs}
                    >
                        <AdminIcon name="download" size={16} />
                        Unduh daftar tarif
                    </button>
                    <button
                        type="button"
                        className="admin-button admin-button-primary"
                        onClick={() => setFormMode('create')}
                    >
                        <span aria-hidden="true">+</span>
                        Tambah layanan
                    </button>
                </div>
            </div>

            <section
                className="admin-order-summary"
                aria-label="Ringkasan layanan"
            >
                {summaryItems.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        className={`admin-queue-card ${item.tone}${
                            selectedCategory === item.key ? ' is-active' : ''
                        }`}
                        aria-pressed={selectedCategory === item.key}
                        onClick={() => setSelectedCategory(item.key)}
                    >
                        <span className="admin-queue-icon">
                            <AdminIcon name={item.icon} size={19} />
                        </span>
                        <span className="admin-queue-content">
                            <span className="admin-queue-label">
                                {item.label}
                            </span>
                            <strong>{item.value}</strong>
                            <small>{item.note}</small>
                        </span>
                        <span className="admin-queue-arrow" aria-hidden="true">
                            <AdminIcon name="chevron" size={15} />
                        </span>
                    </button>
                ))}
            </section>

            <section className="admin-card admin-orders admin-services-page">
                <div className="admin-card-head">
                    <div>
                        <span className="admin-card-label">
                            TARIF LAYANAN
                        </span>
                        <h2>Daftar layanan</h2>
                        <p>
                            {activeCount} layanan aktif dari{' '}
                            {serviceList.length} layanan terdaftar.
                        </p>
                    </div>
                    <span className="admin-orders-count">
                        {filteredServices.length} layanan
                    </span>
                </div>

                <div className="admin-orders-toolbar admin-orders-toolbar-page">
                    <label className="admin-search admin-search-wide">
                        <AdminIcon name="search" size={16} />
                        <span className="sr-only">Cari layanan</span>
                        <input
                            type="search"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Cari layanan, satuan, atau estimasi..."
                        />
                    </label>

                    <div className="admin-filter-group">
                        <label className="admin-select">
                            <span className="sr-only">Filter status</span>
                            <select
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(event.target.value)
                                }
                            >
                                <option value="all">Semua status</option>
                                <option value="active">Aktif</option>
                                <option value="inactive">Nonaktif</option>
                            </select>
                            <AdminIcon name="chevron" size={13} />
                        </label>

                        <label className="admin-select">
                            <span className="sr-only">Urutkan layanan</span>
                            <select
                                value={sortBy}
                                onChange={(event) =>
                                    setSortBy(event.target.value)
                                }
                            >
                                <option value="category">
                                    Urutan kategori
                                </option>
                                <option value="name">Nama A-Z</option>
                                <option value="price-desc">
                                    Tarif tertinggi
                                </option>
                                <option value="price-asc">
                                    Tarif terendah
                                </option>
                            </select>
                            <AdminIcon name="chevron" size={13} />
                        </label>

                        {hasFilters && (
                            <button
                                type="button"
                                className="admin-filter-reset"
                                onClick={resetFilters}
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                <div className="admin-table-wrap">
                    <table className="admin-table admin-services-table">
                        <thead>
                            <tr>
                                <th scope="col">Layanan</th>
                                <th scope="col">Kategori</th>
                                <th scope="col">Tarif</th>
                                <th scope="col">Estimasi</th>
                                <th scope="col">Minimum</th>
                                <th scope="col">Status</th>
                                <th scope="col">
                                    <span className="sr-only">Aksi</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredServices.map((service) => {
                                const category =
                                    serviceCategoryConfig[service.category];

                                return (
                                    <tr key={service.id}>
                                        <td data-label="Layanan">
                                            <div className="admin-service-cell">
                                                <span
                                                    className={`admin-service-mark ${category.tone}`}
                                                    aria-hidden="true"
                                                >
                                                    <AdminIcon
                                                        name={
                                                            service.category ===
                                                            'tambahan'
                                                                ? 'truck'
                                                                : 'services'
                                                        }
                                                        size={16}
                                                    />
                                                </span>
                                                <div className="admin-cell-main">
                                                    <strong>
                                                        {service.name}
                                                    </strong>
                                                    <span>
                                                        {service.description}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label="Kategori">
                                            <span
                                                className={`admin-service-category ${category.tone}`}
                                            >
                                                {category.label}
                                            </span>
                                        </td>
                                        <td data-label="Tarif">
                                            <div className="admin-cell-main admin-service-price">
                                                <strong>
                                                    {priceLabel(service)}
                                                </strong>
                                                <span>{service.unitLabel}</span>
                                            </div>
                                        </td>
                                        <td data-label="Estimasi">
                                            <div className="admin-cell-main">
                                                <strong>
                                                    {service.duration}
                                                </strong>
                                                <span>
                                                    Setelah diterima
                                                </span>
                                            </div>
                                        </td>
                                        <td data-label="Minimum">
                                            <span className="admin-service-minimum">
                                                {service.minimum}
                                            </span>
                                        </td>
                                        <td data-label="Status">
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={service.active}
                                                aria-label={`${
                                                    service.active
                                                        ? 'Nonaktifkan'
                                                        : 'Aktifkan'
                                                } layanan ${service.name}`}
                                                className={`admin-service-switch${
                                                    service.active
                                                        ? ' is-active'
                                                        : ''
                                                }`}
                                                onClick={() =>
                                                    toggleService(service.id)
                                                }
                                            >
                                                <span
                                                    className="admin-service-switch-track"
                                                    aria-hidden="true"
                                                >
                                                    <span />
                                                </span>
                                                {service.active
                                                    ? 'Aktif'
                                                    : 'Nonaktif'}
                                            </button>
                                        </td>
                                        <td data-label="Aksi">
                                            <button
                                                type="button"
                                                className="admin-detail-button"
                                                onClick={() =>
                                                    setSelectedServiceId(
                                                        service.id,
                                                    )
                                                }
                                                aria-label={`Buka detail layanan ${service.name}`}
                                            >
                                                Detail
                                                <AdminIcon
                                                    name="chevron"
                                                    size={14}
                                                />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {filteredServices.length === 0 && (
                        <div className="admin-empty">
                            <span className="admin-empty-icon">
                                <AdminIcon name="search" size={21} />
                            </span>
                            <strong>
                                Tidak ada layanan yang cocok.
                            </strong>
                            <p>
                                Coba kata kunci lain, ubah filter, atau
                                tampilkan semua layanan.
                            </p>
                            <button
                                type="button"
                                className="admin-button admin-button-outline"
                                onClick={resetFilters}
                            >
                                Reset filter
                            </button>
                        </div>
                    )}
                </div>

                <div className="admin-table-foot">
                    <span>
                        {filteredServices.length} layanan ditampilkan · Tarif
                        dalam Rupiah
                    </span>
                    <span className="admin-service-active-note">
                        <span aria-hidden="true" />
                        {activeCount} aktif
                    </span>
                </div>
            </section>

            <section className="admin-card admin-orders admin-item-prices">
                <div className="admin-card-head">
                    <div>
                        <span className="admin-card-label">
                            TARIF PER ITEM
                        </span>
                        <h2>Tarif satuan per item</h2>
                        <p>
                            Tarif tambahan untuk barang tertentu yang tidak
                            dihitung berdasarkan kilogram.
                        </p>
                    </div>
                    <span className="admin-orders-count">
                        {satuanServices.length} item
                    </span>
                </div>

                <div className="admin-table-wrap">
                    <table className="admin-table admin-item-price-table">
                        <thead>
                            <tr>
                                <th scope="col">Jenis item</th>
                                <th scope="col">Keterangan</th>
                                <th scope="col">Satuan</th>
                                <th scope="col">Tarif</th>
                                <th scope="col">
                                    <span className="sr-only">Aksi</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {satuanServices.map((item) => (
                                <tr key={item.id}>
                                    <td data-label="Jenis item">
                                        <strong className="admin-item-name">
                                            {item.name}
                                        </strong>
                                    </td>
                                    <td data-label="Keterangan">
                                        <span className="admin-item-note">
                                            {item.description || '-'}
                                        </span>
                                    </td>
                                    <td data-label="Satuan">
                                        <span className="admin-service-minimum">
                                            per {item.unit}
                                        </span>
                                    </td>
                                    <td data-label="Tarif">
                                        <strong className="admin-item-price">
                                            {formatRupiah(item.price)}
                                        </strong>
                                    </td>
                                    <td data-label="Aksi">
                                        <button
                                            type="button"
                                            className="admin-detail-button"
                                            onClick={() =>
                                                setSelectedServiceId(item.id)
                                            }
                                        >
                                            Detail
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {satuanServices.length === 0 && (
                    <div className="admin-empty">
                        <strong>Belum ada tarif satuan.</strong>
                        <p>
                            Tambahkan layanan berkategori satuan untuk
                            menampilkan tarif per item.
                        </p>
                    </div>
                )}

                <p className="admin-item-price-note">
                    <AdminIcon name="alert" size={14} />
                    Tarif item dapat berubah setelah bahan, ukuran, dan
                    kondisi barang diperiksa petugas.
                </p>
            </section>

            <p className="admin-dashboard-note">
                Semua perubahan layanan dan tarif langsung tersimpan ke
                database dan dipakai halaman pelanggan serta chatbot AI.
            </p>

            {selectedService && (
                <ServiceDrawer
                    service={selectedService}
                    onClose={() => setSelectedServiceId(null)}
                    onToggle={() => toggleService(selectedService.id)}
                    onEdit={() => {
                        setSelectedServiceId(null);
                        setFormMode(selectedService);
                    }}
                />
            )}

            {formMode && (
                <ServiceFormDrawer
                    key={formMode === 'create' ? 'create' : formMode.id}
                    service={formMode === 'create' ? null : formMode}
                    errors={errors}
                    onClose={() => setFormMode(null)}
                />
            )}

            {toast && (
                <div className="admin-toast" role="status">
                    <span>
                        <AdminIcon name="check" size={14} />
                    </span>
                    {toast}
                </div>
            )}
        </PengusahaLayout>
    );
}

function ServiceDrawer({ service, onClose, onToggle, onEdit }) {
    const category = serviceCategoryConfig[service.category];

    return (
        <div
            className="admin-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-service-title"
        >
            <button
                type="button"
                className="admin-drawer-backdrop"
                aria-label="Tutup detail layanan"
                onClick={onClose}
            />

            <aside className="admin-drawer-panel admin-service-panel">
                <div className="admin-drawer-head">
                    <div>
                        <span className="admin-card-label">
                            DETAIL LAYANAN
                        </span>
                        <h2 id="admin-service-title">{service.name}</h2>
                    </div>
                    <button
                        type="button"
                        className="admin-icon-button"
                        aria-label="Tutup detail layanan"
                        onClick={onClose}
                    >
                        <AdminIcon name="close" size={18} />
                    </button>
                </div>

                <div className="admin-drawer-body">
                    <div className="admin-service-drawer-status">
                        <span
                            className={`admin-service-category ${category.tone}`}
                        >
                            {category.label}
                        </span>
                        <span
                            className={`admin-status ${
                                service.active
                                    ? 'is-success'
                                    : 'is-danger'
                            }`}
                        >
                            <span aria-hidden="true" />
                            {service.active ? 'Aktif' : 'Nonaktif'}
                        </span>
                    </div>

                    <div className="admin-service-hero">
                        <div>
                            <span>Tarif layanan</span>
                            <strong>{priceLabel(service)}</strong>
                            <small>{service.unitLabel}</small>
                        </div>
                        <div>
                            <span>Estimasi</span>
                            <strong>{service.duration}</strong>
                            <small>Setelah cucian diterima</small>
                        </div>
                    </div>

                    <p className="admin-service-description">
                        {service.description}
                    </p>

                    <dl className="admin-drawer-grid">
                        <div>
                            <dt>Kategori</dt>
                            <dd>{category.label}</dd>
                        </div>
                        <div>
                            <dt>Satuan</dt>
                            <dd>{service.unit}</dd>
                        </div>
                        <div>
                            <dt>Minimum</dt>
                            <dd>{service.minimum}</dd>
                        </div>
                        <div>
                            <dt>Pesanan bulan ini</dt>
                            <dd>{service.ordersThisMonth} pesanan</dd>
                        </div>
                        <div>
                            <dt>Terakhir diperbarui</dt>
                            <dd>{formatTanggal(service.updatedAt)}</dd>
                        </div>
                        <div>
                            <dt>Status tampil</dt>
                            <dd>
                                {service.active
                                    ? 'Tampil di halaman pelanggan'
                                    : 'Disembunyikan dari pelanggan'}
                            </dd>
                        </div>
                    </dl>

                    <section className="admin-service-includes">
                        <span className="admin-card-label">
                            TERMASUK DALAM LAYANAN
                        </span>
                        <ul>
                            {service.includes.map((item) => (
                                <li key={item}>
                                    <span aria-hidden="true">
                                        <AdminIcon name="check" size={11} />
                                    </span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </section>

                    <p className="admin-service-note">
                        <AdminIcon name="alert" size={14} />
                        {service.note}
                    </p>
                </div>

                <div className="admin-drawer-foot admin-service-drawer-foot">
                    <p>
                        Perubahan tarif dan status langsung dipakai halaman
                        pelanggan serta chatbot AI.
                    </p>
                    <div className="admin-service-drawer-actions">
                        <button
                            type="button"
                            className="admin-button admin-button-primary"
                            onClick={onEdit}
                        >
                            Edit layanan
                        </button>
                        <button
                            type="button"
                            className={`admin-button ${
                                service.active
                                    ? 'admin-button-outline'
                                    : 'admin-button-primary'
                            }`}
                            onClick={onToggle}
                        >
                            {service.active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button
                            type="button"
                            className="admin-button admin-button-outline"
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

function ServiceFormDrawer({ service, errors = {}, onClose }) {
    const [form, setForm] = useState(() => ({
        name: service?.name ?? '',
        category: service?.category ?? 'kiloan',
        description: service?.description ?? '',
        unit: service?.unit ?? 'kg',
        price: service?.price ?? 0,
        min_quantity: service?.minQuantity ?? 1,
        step_quantity: service?.stepQuantity ?? 0.5,
        estimated_hours: service?.estimatedHours ?? 24,
        is_starting_at: service?.startingAt ?? false,
        is_active: service?.active ?? true,
    }));
    const [processing, setProcessing] = useState(false);

    const update = (key, value) => {
        setForm((previous) => ({ ...previous, [key]: value }));
    };

    const submit = (event) => {
        event.preventDefault();
        setProcessing(true);

        const payload = {
            ...form,
            price: Number(form.price) || 0,
            min_quantity: Number(form.min_quantity) || 0.1,
            step_quantity: Number(form.step_quantity) || 0.1,
            estimated_hours:
                form.estimated_hours === ''
                    ? null
                    : Number(form.estimated_hours),
        };

        const options = {
            preserveScroll: true,
            onSuccess: () => onClose(),
            onFinish: () => setProcessing(false),
        };

        if (service) {
            router.patch(
                route('pengusaha.layanan.update', service.id),
                payload,
                options,
            );

            return;
        }

        router.post(route('pengusaha.layanan.store'), payload, options);
    };

    return (
        <div
            className="admin-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-service-form-title"
        >
            <button
                type="button"
                className="admin-drawer-backdrop"
                aria-label="Tutup formulir layanan"
                onClick={onClose}
            />

            <aside className="admin-drawer-panel admin-service-panel">
                <div className="admin-drawer-head">
                    <div>
                        <span className="admin-card-label">
                            {service ? 'EDIT LAYANAN' : 'LAYANAN BARU'}
                        </span>
                        <h2 id="admin-service-form-title">
                            {service ? service.name : 'Tambah layanan'}
                        </h2>
                    </div>
                    <button
                        type="button"
                        className="admin-icon-button"
                        aria-label="Tutup formulir layanan"
                        onClick={onClose}
                    >
                        <AdminIcon name="close" size={18} />
                    </button>
                </div>

                <form
                    id="admin-service-form"
                    className="admin-service-form"
                    onSubmit={submit}
                >
                    <div className="admin-drawer-body">
                        <label className="admin-service-field">
                            <span>Nama layanan</span>
                            <input
                                type="text"
                                value={form.name}
                                maxLength={100}
                                onChange={(event) =>
                                    update('name', event.target.value)
                                }
                                placeholder="Contoh: Cuci Selimut"
                                required
                            />
                            {errors.name && (
                                <small className="admin-service-error">
                                    {errors.name}
                                </small>
                            )}
                        </label>

                        <div className="admin-service-form-grid">
                            <label className="admin-service-field">
                                <span>Kategori</span>
                                <select
                                    value={form.category}
                                    onChange={(event) =>
                                        update('category', event.target.value)
                                    }
                                >
                                    {serviceCategories.map((category) => (
                                        <option
                                            key={category.value}
                                            value={category.value}
                                        >
                                            {category.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.category && (
                                    <small className="admin-service-error">
                                        {errors.category}
                                    </small>
                                )}
                            </label>

                            <label className="admin-service-field">
                                <span>Satuan</span>
                                <input
                                    type="text"
                                    value={form.unit}
                                    maxLength={20}
                                    list="service-unit-options"
                                    onChange={(event) =>
                                        update('unit', event.target.value)
                                    }
                                    placeholder="kg, pcs, pasang..."
                                    required
                                />
                                <datalist id="service-unit-options">
                                    <option value="kg" />
                                    <option value="pcs" />
                                    <option value="pasang" />
                                    <option value="potong" />
                                    <option value="buah" />
                                </datalist>
                                {errors.unit && (
                                    <small className="admin-service-error">
                                        {errors.unit}
                                    </small>
                                )}
                            </label>
                        </div>

                        <label className="admin-service-field">
                            <span>Deskripsi</span>
                            <textarea
                                rows={3}
                                maxLength={500}
                                value={form.description}
                                onChange={(event) =>
                                    update('description', event.target.value)
                                }
                                placeholder="Jelaskan layanan dan ketentuannya."
                            />
                            {errors.description && (
                                <small className="admin-service-error">
                                    {errors.description}
                                </small>
                            )}
                        </label>

                        <div className="admin-service-form-grid">
                            <label className="admin-service-field">
                                <span>Tarif per satuan (Rp)</span>
                                <input
                                    type="number"
                                    min={0}
                                    max={10000000}
                                    step={500}
                                    value={form.price}
                                    onChange={(event) =>
                                        update('price', event.target.value)
                                    }
                                    required
                                />
                                {errors.price && (
                                    <small className="admin-service-error">
                                        {errors.price}
                                    </small>
                                )}
                            </label>

                            <label className="admin-service-field">
                                <span>Estimasi pengerjaan (jam)</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={720}
                                    value={form.estimated_hours}
                                    onChange={(event) =>
                                        update(
                                            'estimated_hours',
                                            event.target.value,
                                        )
                                    }
                                />
                                {errors.estimated_hours && (
                                    <small className="admin-service-error">
                                        {errors.estimated_hours}
                                    </small>
                                )}
                            </label>

                            <label className="admin-service-field">
                                <span>Jumlah minimal</span>
                                <input
                                    type="number"
                                    min={0.1}
                                    max={100}
                                    step={0.1}
                                    value={form.min_quantity}
                                    onChange={(event) =>
                                        update(
                                            'min_quantity',
                                            event.target.value,
                                        )
                                    }
                                    required
                                />
                                {errors.min_quantity && (
                                    <small className="admin-service-error">
                                        {errors.min_quantity}
                                    </small>
                                )}
                            </label>

                            <label className="admin-service-field">
                                <span>Kelipatan jumlah</span>
                                <input
                                    type="number"
                                    min={0.1}
                                    max={100}
                                    step={0.1}
                                    value={form.step_quantity}
                                    onChange={(event) =>
                                        update(
                                            'step_quantity',
                                            event.target.value,
                                        )
                                    }
                                    required
                                />
                                {errors.step_quantity && (
                                    <small className="admin-service-error">
                                        {errors.step_quantity}
                                    </small>
                                )}
                            </label>
                        </div>

                        <div className="admin-service-switches">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={(event) =>
                                        update(
                                            'is_active',
                                            event.target.checked,
                                        )
                                    }
                                />
                                <span>
                                    <strong>Tampilkan ke pelanggan</strong>
                                    <small>
                                        Layanan aktif muncul di halaman
                                        pelanggan dan chatbot.
                                    </small>
                                </span>
                            </label>

                            <label>
                                <input
                                    type="checkbox"
                                    checked={form.is_starting_at}
                                    onChange={(event) =>
                                        update(
                                            'is_starting_at',
                                            event.target.checked,
                                        )
                                    }
                                />
                                <span>
                                    <strong>Tarif mulai dari</strong>
                                    <small>
                                        Tandai jika harga bisa berubah sesuai
                                        ukuran atau bahan.
                                    </small>
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="admin-drawer-foot admin-service-drawer-foot">
                        <p>
                            Tarif disimpan sebagai rupiah dan langsung dipakai
                            chatbot tanpa menebak harga.
                        </p>
                        <div className="admin-service-drawer-actions">
                            <button
                                type="button"
                                className="admin-button admin-button-outline"
                                onClick={onClose}
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="admin-button admin-button-primary"
                                disabled={processing}
                            >
                                {processing
                                    ? 'Menyimpan...'
                                    : service
                                      ? 'Simpan perubahan'
                                      : 'Tambah layanan'}
                            </button>
                        </div>
                    </div>
                </form>
            </aside>
        </div>
    );
}
