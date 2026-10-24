import SmartLink from '@/Components/Cleanora/SmartLink';
import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

export default function Navbar({ brandHref, items, user, profileHref, cta }) {
    const { url } = usePage();
    const [menuOpen, setMenuOpen] = useState(false);

    const closeMenu = useCallback(() => setMenuOpen(false), []);

    useEffect(() => {
        closeMenu();
    }, [url, closeMenu]);

    useEffect(() => {
        if (!menuOpen) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                closeMenu();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [menuOpen, closeMenu]);

    return (
        <header className="navbar">
            <div className="container nav-container">
                <SmartLink
                    href={brandHref}
                    className="logo"
                    onClick={closeMenu}
                >
                    <span className="logo-icon">✦</span>
                    <span className="logo-text">
                        <strong>Cleanora</strong>
                        <small>Laundry &amp; Care</small>
                    </span>
                </SmartLink>

                <button
                    type="button"
                    className="menu-toggle"
                    id="menuToggle"
                    aria-label={
                        menuOpen
                            ? 'Tutup menu navigasi'
                            : 'Buka menu navigasi'
                    }
                    aria-expanded={menuOpen}
                    aria-controls="navMenu"
                    onClick={() => setMenuOpen((previous) => !previous)}
                >
                    ☰
                </button>

                <nav
                    className={`nav-menu${menuOpen ? ' show' : ''}`}
                    id="navMenu"
                >
                    {items.map((item) => (
                        <SmartLink
                            key={`${item.label}-${item.href}`}
                            href={item.href}
                            method={item.method}
                            className={[
                                'nav-link',
                                item.active ? 'active' : '',
                                item.mobileOnly ? 'mobile-only' : '',
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            aria-current={item.active ? 'page' : undefined}
                            onClick={closeMenu}
                        >
                            {item.label}
                        </SmartLink>
                    ))}
                </nav>

                <div className="nav-actions">
                    <SmartLink href={profileHref} className="track-link">
                        Halo, {user.name}
                    </SmartLink>

                    {cta && (
                        <SmartLink href={cta.href} className="btn btn-primary nav-cta">
                            {cta.label} <span>{cta.icon}</span>
                        </SmartLink>
                    )}
                </div>
            </div>
        </header>
    );
}
