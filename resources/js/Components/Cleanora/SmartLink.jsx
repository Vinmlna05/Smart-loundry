import { Link, usePage } from '@inertiajs/react';

function toPathname(value) {
    if (!value) {
        return '';
    }

    try {
        return new URL(value, window.location.origin).pathname;
    } catch {
        return value;
    }
}

export default function SmartLink({ href, method, children, ...props }) {
    const { url } = usePage();
    const currentPath = toPathname(url);
    const hasHash = typeof href === 'string' && href.includes('#');

    if (method) {
        return (
            <Link href={href} method={method} {...props}>
                {children}
            </Link>
        );
    }

    if (hasHash) {
        const [path, hash] = href.split('#');
        const isSamePage = !path || toPathname(path) === currentPath;
        const target = isSamePage ? `#${hash}` : href;

        return (
            <a href={target} {...props}>
                {children}
            </a>
        );
    }

    return (
        <Link href={href} {...props}>
            {children}
        </Link>
    );
}
