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
    const { url, props: pageProps } = usePage();
    const currentPath = toPathname(url);
    const hasHash = typeof href === 'string' && href.includes('#');

    if (method) {
        const csrfToken = pageProps.csrf_token ?? '';

        const methodName = String(method).toUpperCase();

        return (
            <form
                method="POST"
                action={href}
                style={{ display: 'contents' }}
                onSubmit={(event) => {
                    event.stopPropagation();
                }}
            >
                <input type="hidden" name="_token" value={csrfToken} />
                {methodName !== 'POST' && (
                    <input type="hidden" name="_method" value={methodName} />
                )}
                <button type="submit" {...props}>
                    {children}
                </button>
            </form>
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
