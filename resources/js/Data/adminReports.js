import { adminOrders } from './adminOrders';
import { adminPayments } from './adminPayments';

const paymentById = adminPayments.reduce((payments, payment) => {
    payments[payment.id] = payment;

    return payments;
}, {});

const dateFromOrder = (order) => {
    const datePart = order.id.split('-')[1];
    const timePart = order.time.replace('.', ':');

    return `${datePart.slice(0, 4)}-${datePart.slice(
        4,
        6,
    )}-${datePart.slice(6, 8)}T${timePart}:00`;
};

export const reportTransactions = adminOrders
    .map((order) => {
        const payment = paymentById[order.id] ?? null;
        const date = dateFromOrder(order);
        const isCanceled =
            order.status === 'Dibatalkan' ||
            order.payment === 'Tidak perlu bayar';

        return {
            id: order.id,
            invoiceNumber:
                payment?.invoiceNumber ??
                order.id.replace('LDR-', 'INV-'),
            date,
            dateKey: date.slice(0, 10),
            time: order.time.replace('.', ':'),
            customer: order.customer,
            phone: order.phone,
            service: order.service,
            source: order.source,
            intake: order.intake,
            outlet: order.outlet ?? null,
            amount: order.total,
            orderStatus: order.status,
            paymentStatus: payment?.status ?? 'Tidak perlu bayar',
            paymentMethod: payment?.method ?? '-',
            paymentChannel: payment?.channel ?? '-',
            paidAt: payment?.paidAt ?? null,
            paidDateKey: payment?.paidAt
                ? payment.paidAt.slice(0, 10)
                : null,
            isCanceled,
        };
    })
    .sort((first, second) => new Date(second.date) - new Date(first.date));

export const reportLatestDateKey = reportTransactions.reduce(
    (latest, transaction) =>
        transaction.dateKey > latest ? transaction.dateKey : latest,
    '',
);

export const reportEarliestDateKey = reportTransactions.reduce(
    (earliest, transaction) =>
        !earliest || transaction.dateKey < earliest
            ? transaction.dateKey
            : earliest,
    '',
);

export const reportPeriodOptions = [
    { value: 'all', label: 'Semua data', days: null },
    { value: '7', label: '7 hari terakhir', days: 7 },
    { value: '30', label: '30 hari terakhir', days: 30 },
];

export const reportPaymentStatuses = [
    'Lunas',
    'Perlu konfirmasi',
    'Belum dibayar',
    'Belum ditagih',
    'Tidak perlu bayar',
];

export const shiftDateKey = (dateKey, days) => {
    const date = new Date(`${dateKey}T12:00:00`);

    date.setDate(date.getDate() + days);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
});

const weekdayFormatter = new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
});

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});

export const formatReportDateKey = (dateKey) =>
    dateKey
        ? dateFormatter.format(new Date(`${dateKey}T12:00:00`))
        : '-';

export const formatReportWeekday = (dateKey) =>
    dateKey
        ? weekdayFormatter.format(new Date(`${dateKey}T12:00:00`))
        : '-';

export const formatReportDateTime = (value) =>
    value
        ? dateTimeFormatter
              .format(new Date(value))
              .replace('.', ':')
        : '-';

export const formatReportRange = (startKey, endKey) => {
    if (!startKey || !endKey) {
        return '-';
    }

    const start = new Date(`${startKey}T12:00:00`);
    const end = new Date(`${endKey}T12:00:00`);
    const sameMonth =
        start.getMonth() === end.getMonth() &&
        start.getFullYear() === end.getFullYear();

    if (sameMonth && startKey !== endKey) {
        return `${start.getDate()}–${dateFormatter.format(end)}`;
    }

    if (startKey === endKey) {
        return dateFormatter.format(start);
    }

    return `${dateFormatter.format(start)} – ${dateFormatter.format(end)}`;
};
