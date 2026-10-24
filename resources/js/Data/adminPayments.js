import { adminOrders } from './adminOrders';

const paymentMeta = {
    'LDR-20261024-0001': {
        method: 'Transfer bank',
        channel: 'BCA',
        proof: {
            name: 'bukti-transfer-ayu.jpg',
            uploadedAt: '2026-10-24T09:41:00',
            size: '248 KB',
        },
    },
    'LDR-20261024-0003': {
        method: 'Transfer bank',
        channel: 'BCA',
        paidAt: '2026-10-24T08:59:00',
        confirmedBy: 'Petugas outlet',
    },
    'LDR-20261024-0004': {
        method: 'QRIS',
        channel: 'QRIS outlet',
        paidAt: '2026-10-24T08:31:00',
        confirmedBy: 'Petugas outlet',
    },
    'LDR-20261024-0005': {
        method: 'Tunai',
        channel: 'Pembayaran di outlet',
        paidAt: '2026-10-24T10:05:00',
        confirmedBy: 'Petugas outlet',
    },
    'LDR-20261023-0007': {
        method: 'Transfer bank',
        channel: 'BCA',
    },
    'LDR-20261023-0009': {
        method: 'QRIS',
        channel: 'QRIS outlet',
        paidAt: '2026-10-23T13:20:00',
        confirmedBy: 'Petugas outlet',
    },
    'LDR-20261023-0010': {
        method: 'Transfer bank',
        channel: 'BCA',
        paidAt: '2026-10-23T12:40:00',
        confirmedBy: 'Petugas outlet',
    },
    'LDR-20261023-0011': {
        method: 'Tunai',
        channel: 'Pembayaran di outlet',
        paidAt: '2026-10-23T11:35:00',
        confirmedBy: 'Petugas outlet',
    },
    'LDR-20261022-0013': {
        method: 'Transfer bank',
        channel: 'BCA',
        paidAt: '2026-10-22T15:40:00',
        confirmedBy: 'Petugas outlet',
    },
    'LDR-20261022-0014': {
        method: 'Transfer bank',
        channel: 'BCA',
        proof: {
            name: 'bukti-transfer-mega.jpg',
            uploadedAt: '2026-10-22T15:10:00',
            size: '196 KB',
        },
    },
};

export const paymentStatusConfig = {
    'Perlu konfirmasi': {
        tone: 'is-pending',
        description: 'Bukti transfer sudah diunggah',
    },
    'Belum dibayar': {
        tone: 'is-unpaid',
        description: 'Belum ada bukti pembayaran',
    },
    Lunas: {
        tone: 'is-paid',
        description: 'Pembayaran sudah diverifikasi',
    },
    'Belum ditagih': {
        tone: 'is-neutral',
        description: 'Menunggu berat aktual',
    },
};

const dateFromOrder = (order) => {
    const datePart = order.id.split('-')[1];
    const timePart = order.time.replace('.', ':');

    return `${datePart.slice(0, 4)}-${datePart.slice(
        4,
        6,
    )}-${datePart.slice(6, 8)}T${timePart}:00`;
};

const resolveStatus = (order, meta) => {
    if (order.payment === 'Lunas') {
        return 'Lunas';
    }

    if (order.payment === 'Belum ditagih') {
        return 'Belum ditagih';
    }

    return meta.proof ? 'Perlu konfirmasi' : 'Belum dibayar';
};

export const adminPayments = adminOrders
    .filter((order) => order.payment !== 'Tidak perlu bayar')
    .map((order) => {
        const meta = paymentMeta[order.id] ?? {};

        return {
            id: order.id,
            invoiceNumber: order.id.replace('LDR-', 'INV-'),
            orderId: order.id,
            customer: order.customer,
            phone: order.phone,
            service: order.service,
            weight: order.weight,
            amount: order.total,
            status: resolveStatus(order, meta),
            method: meta.method ?? 'Belum ditagih',
            channel: meta.channel ?? '-',
            proof: meta.proof ?? null,
            issuedAt: dateFromOrder(order),
            paidAt: meta.paidAt ?? null,
            confirmedBy: meta.confirmedBy ?? null,
            orderStatus: order.status,
            note: order.note,
        };
    });

export const formatTanggalWaktu = (value) => {
    if (!value) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
        .format(new Date(value))
        .replace('.', ':');
};
