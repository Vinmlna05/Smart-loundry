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
