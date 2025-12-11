import { useState, useEffect } from "react";
import { serviceTypesService } from "@/services/serviceTypes";

/**
 * Custom hook to fetch and use service types
 * Results are cached automatically
 */
export function useServiceTypes() {
    const [serviceTypes, setServiceTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        serviceTypesService
            .getAll()
            .then((data) => {
                if (isMounted) {
                    setServiceTypes(data);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    setError(err);
                    setLoading(false);
                    // Fallback to empty array on error
                    setServiceTypes([]);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    return { serviceTypes, loading, error };
}

