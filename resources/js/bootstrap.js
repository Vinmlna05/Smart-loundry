import axios from 'axios';

window.axios = axios;
window.axios.defaults.withCredentials = true;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

export function syncCsrfToken(token) {
    if (!token || typeof document === 'undefined') {
        return;
    }

    let meta = document.head.querySelector('meta[name="csrf-token"]');

    if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'csrf-token');
        document.head.appendChild(meta);
    }

    meta.setAttribute('content', token);
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
}

syncCsrfToken(
    document.head
        ?.querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content'),
);
