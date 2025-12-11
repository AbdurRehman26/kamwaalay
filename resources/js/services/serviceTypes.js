import api from "./api";

let cachedServiceTypes = null;
let cachePromise = null;

export const serviceTypesService = {
    /**
     * Get all active service types
     * Results are cached to avoid repeated API calls
     */
    async getAll() {
        // Return cached data if available
        if (cachedServiceTypes) {
            return Promise.resolve(cachedServiceTypes);
        }

        // If a request is already in progress, return that promise
        if (cachePromise) {
            return cachePromise;
        }

        // Fetch from API
        cachePromise = api.get("/service-types")
            .then((response) => {
                // Transform to match frontend format
                const serviceTypes = response.data.map((st) => ({
                    value: st.slug,
                    label: st.name,
                    icon: st.icon || "",
                }));
                cachedServiceTypes = serviceTypes;
                cachePromise = null;
                return serviceTypes;
            })
            .catch((error) => {
                cachePromise = null;
                throw error;
            });

        return cachePromise;
    },

    /**
     * Clear the cache (useful for testing or when data needs to be refreshed)
     */
    clearCache() {
        cachedServiceTypes = null;
        cachePromise = null;
    },
};

