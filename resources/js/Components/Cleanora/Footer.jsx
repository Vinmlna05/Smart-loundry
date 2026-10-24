import SmartLink from '@/Components/Cleanora/SmartLink';

export default function Footer({ brandHref, description, columns }) {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <SmartLink
                            href={brandHref}
                            className="logo footer-logo"
                        >
                            <span className="logo-icon">✦</span>
                            <span className="logo-text">
                                <strong>Cleanora</strong>
                                <small>Laundry &amp; Care</small>
                            </span>
                        </SmartLink>

                        <p>{description}</p>
                    </div>

                    {columns.map((column) => (
                        <div key={column.title} className="footer-column">
                            <h3>{column.title}</h3>

                            {column.links.map((link) => (
                                <SmartLink
                                    key={`${link.label}-${link.href}`}
                                    href={link.href}
                                    method={link.method}
                                >
                                    {link.label}
                                </SmartLink>
                            ))}
                        </div>
                    ))}
                </div>

                <div className="footer-bottom">
                    <p>
                        © {new Date().getFullYear()} Cleanora Laundry. Hak
                        cipta dilindungi.
                    </p>
                    <p>Bersih, praktis, dan terpercaya.</p>
                </div>
            </div>
        </footer>
    );
}
