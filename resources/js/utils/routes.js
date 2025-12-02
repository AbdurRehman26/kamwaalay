// Route helper functions to replace Ziggy/Inertia routes
export const routes = {
    home: () => "/",
    login: () => "/login",
    register: () => "/register",
    verifyOtp: () => "/verify-otp",
    dashboard: {
        overview: () => "/dashboard",
        documents: () => "/dashboard/documents",
    },
    messages: () => "/messages",
    notifications: () => "/notifications",
    profile: {
        edit: () => "/profile",
    },
    helpers: {
        index: () => "/helpers",
        show: (id) => `/helpers/${id}`,
        create: () => "/helpers/create",
        edit: (id) => `/helpers/${id}/edit`,
    },
    businesses: {
        show: (id) => `/businesses/${id}`,
    },
    business: {
        workers: {
            index: () => "/business/workers",
            create: () => "/business/workers/create",
            edit: (id) => `/business/workers/${id}/edit`,
        },
    },
    bookings: {
        index: () => "/bookings",
        create: () => "/bookings/create",
        show: (id) => `/service-requests/${id}`,
    },
    "service-requests": {
        browse: () => "/service-requests",
        show: (id) => `/service-requests/${id}`,
    },
    "service-listings": {
        index: () => "/service-listings",
        show: (id) => `/service-listings/${id}`,
        create: () => "/service-listings/create",
        edit: (id) => `/service-listings/${id}/edit`,
        "my-listings": () => "/my-service-listings",
    },
    "job-applications": {
        index: () => "/job-applications",
        create: (bookingId) => `/bookings/${bookingId}/apply`,
        show: (id) => `/job-applications/${id}`,
        "my-applications": () => "/my-applications",
        "my-request-applications": () => "/my-request-applications",
    },
    onboarding: {
        helper: () => "/onboarding/helper",
    },
    admin: {
        dashboard: () => "/admin/dashboard",
        helpers: () => "/admin/helpers",
        bookings: () => "/admin/bookings",
        documents: () => "/admin/documents",
    },
    about: () => "/about",
    contact: () => "/contact",
    faq: () => "/faq",
    terms: () => "/terms",
    privacy: () => "/privacy",
};

// Helper function to match Ziggy's route() function
export function route(name, params = {}) {
    const parts = name.split(".");
    let path = routes;

    for (const part of parts) {
        if (path[part]) {
            path = path[part];
        } else {
            console.warn(`Route "${name}" not found`);
            return "#";
        }
    }

    // If path is an object (like dashboard: { overview: ... }), try to use 'overview' as default
    if (typeof path === "object" && path !== null && !Array.isArray(path)) {
        if (path.overview && typeof path.overview === "function") {
            path = path.overview;
        } else {
            console.warn(`Route "${name}" is an object but has no 'overview' property`);
            return "#";
        }
    }

    if (typeof path === "function") {
        if (Array.isArray(params)) {
            return path(...params);
        } else if (typeof params === "object" && params !== null && Object.keys(params).length > 0) {
            // Handle object params like {helper: 1}
            const firstParam = Object.values(params)[0];
            return path(firstParam);
        } else if (params !== null && params !== undefined && params !== "") {
            // Handle primitive values (number, string) passed directly
            return path(params);
        }
        return path();
    }

    return path;
}

