const STORAGE_KEY = 'cleanora:order-draft';

export function readOrderDraft() {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const raw = window.sessionStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return null;
        }

        const draft = JSON.parse(raw);

        return draft && typeof draft === 'object' ? draft : null;
    } catch {
        return null;
    }
}

export function saveOrderDraft(draft) {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
        return;
    }
}

export function clearOrderDraft() {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
        return;
    }
}
