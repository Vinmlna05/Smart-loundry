const icons = {
    dashboard: (
        <>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </>
    ),
    orders: (
        <>
            <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
            <path d="M9 8h6M9 12h6" />
        </>
    ),
    queue: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </>
    ),
    customers: (
        <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
    ),
    services: (
        <>
            <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" />
            <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
        </>
    ),
    payments: (
        <>
            <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
            <path d="M3 9h18" />
            <path d="M16 14h2" />
        </>
    ),
    reports: (
        <>
            <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
        </>
    ),
    chatbot: (
        <>
            <path d="M21 12a8 8 0 0 1-8 8H7l-4 2v-5a8 8 0 0 1 8-9h2a8 8 0 0 1 8 4Z" />
            <path d="M8 11h.01M12 11h.01M16 11h.01" />
        </>
    ),
    profile: (
        <>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
        </>
    ),
    logout: (
        <>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5M21 12H9" />
        </>
    ),
    search: (
        <>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
        </>
    ),
    bell: (
        <>
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
        </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    calendar: (
        <>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 11h18" />
        </>
    ),
    download: (
        <>
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M4 21h16" />
        </>
    ),
    chevron: <path d="m9 6 6 6-6 6" />,
    check: <path d="m5 13 4 4L19 7" />,
    package: (
        <>
            <path d="m21 8-9-5-9 5 9 5 9-5Z" />
            <path d="M3 8v8l9 5 9-5V8" />
            <path d="M12 13v8" />
        </>
    ),
    truck: (
        <>
            <path d="M3 7h11v10H3z" />
            <path d="M14 10h4l3 3v4h-7" />
            <circle cx="6.5" cy="18.5" r="1.5" />
            <circle cx="17.5" cy="18.5" r="1.5" />
        </>
    ),
    spark: (
        <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" />
    ),
    trend: (
        <>
            <path d="m3 17 6-6 4 4 8-8" />
            <path d="M15 7h6v6" />
        </>
    ),
    arrow: (
        <>
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
        </>
    ),
    settings: (
        <>
            <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
            <path d="M1 14h6M9 8h6M17 16h6" />
        </>
    ),
    alert: (
        <>
            <path d="M12 9v4M12 17h.01" />
            <path d="m10.3 3.9-7.5 13A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-3.1l-7.5-13a2 2 0 0 0-3.4 0Z" />
        </>
    ),
    message: (
        <>
            <path d="M21 12a8 8 0 0 1-8 8H7l-4 2v-5a8 8 0 0 1 8-9h2a8 8 0 0 1 8 4Z" />
            <path d="M8 11h.01M12 11h.01M16 11h.01" />
        </>
    ),
    printer: (
        <>
            <path d="M7 8V3h10v5" />
            <rect x="4" y="8" width="16" height="8" rx="2" />
            <path d="M7 16h10v5H7z" />
        </>
    ),
};

export default function AdminIcon({ name, size = 18, className = '' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
            focusable="false"
        >
            {icons[name] ?? icons.spark}
        </svg>
    );
}
