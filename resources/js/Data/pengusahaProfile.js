const STORAGE_KEY = 'cleanora.pengusaha-profile';

export const PENGUSAHA_PROFILE_EVENT = 'cleanora:pengusaha-profile';

export const defaultPengusahaProfile = {
    businessName: 'Cleanora Laundry',
    whatsapp: '0812-3456-7890',
    outletAddress: 'Jl. Merdeka No. 18, Bandung',
    operatingHours: 'Setiap hari, 07.00–21.00',
};

const normalizeProfile = (profile) => ({
    ...defaultPengusahaProfile,
    ...(profile && typeof profile === 'object' ? profile : {}),
});

export const loadPengusahaProfile = () => {
    if (typeof window === 'undefined') {
        return defaultPengusahaProfile;
    }

    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);

        return stored
            ? normalizeProfile(JSON.parse(stored))
            : defaultPengusahaProfile;
    } catch {
        return defaultPengusahaProfile;
    }
};

export const savePengusahaProfile = (profile) => {
    const nextProfile = normalizeProfile(profile);

    if (typeof window === 'undefined') {
        return nextProfile;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
    window.dispatchEvent(
        new CustomEvent(PENGUSAHA_PROFILE_EVENT, {
            detail: nextProfile,
        }),
    );

    return nextProfile;
};
