import api from "./api";

let cachedLanguages = null;
let cachePromise = null;

export const languagesService = {
    /**
     * Get all active languages
     * Results are cached to avoid repeated API calls
     */
    async getAll() {
        // Return cached data if available
        if (cachedLanguages) {
            return Promise.resolve(cachedLanguages);
        }

        // If a request is already in progress, return that promise
        if (cachePromise) {
            return cachePromise;
        }

        // Fetch from API
        cachePromise = api.get("/languages")
            .then((response) => {
                const languages = response.data;
                cachedLanguages = languages;
                cachePromise = null;
                return languages;
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
        cachedLanguages = null;
        cachePromise = null;
    },
};

