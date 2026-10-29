import '../css/app.css';
import { syncCsrfToken } from './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        syncCsrfToken(props.initialPage.props.csrf_token);

        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#0B7A85',
    },
});

router.on('success', (event) => {
    syncCsrfToken(event.detail.page.props.csrf_token);
});
