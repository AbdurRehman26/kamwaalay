import { useState, useEffect } from "react";
import { languagesService } from "@/services/languages";

/**
 * Custom hook to fetch and use languages
 * Results are cached automatically
 */
export function useLanguages() {
    const [languages, setLanguages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        languagesService
            .getAll()
            .then((data) => {
                if (isMounted) {
                    setLanguages(data);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    setError(err);
                    setLoading(false);
                    // Fallback to empty array on error
                    setLanguages([]);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    return { languages, loading, error };
}

