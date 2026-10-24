const icons = {
    spark: (
        <>
            <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" />
            <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
        </>
    ),
    mail: (
        <>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
        </>
    ),
    lock: (
        <>
            <rect x="5" y="10" width="14" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </>
    ),
    eye: (
        <>
            <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
        </>
    ),
    eyeOff: (
        <>
            <path d="m3 3 18 18" />
            <path d="M10.6 6.2A10.9 10.9 0 0 1 12 6c6.5 0 10 6 10 6a18.7 18.7 0 0 1-3.1 3.7" />
            <path d="M6.2 6.7A18.4 18.4 0 0 0 2 12s3.5 6 10 6a10.7 10.7 0 0 0 4.1-.8" />
            <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        </>
    ),
    arrow: (
        <>
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
        </>
    ),
    check: <path d="m5 13 4 4L19 7" />,
    user: (
        <>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
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
    shield: (
        <>
            <path d="M12 3 19 6v5c0 4.4-2.9 8.4-7 9.6C7.9 19.4 5 15.4 5 11V6l7-3Z" />
            <path d="m9 12 2 2 4-4" />
        </>
    ),
    package: (
        <>
            <path d="m21 8-9-5-9 5 9 5 9-5Z" />
            <path d="M3 8v8l9 5 9-5V8" />
            <path d="M12 13v8" />
        </>
    ),
};

export default function AuthIcon({ name, size = 18, className = '' }) {
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
