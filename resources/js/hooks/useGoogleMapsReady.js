import { useEffect, useState } from "react";

function hasGoogleMapsPlaces() {
    return Boolean(window.google?.maps?.places);
}

export default function useGoogleMapsReady() {
    const [isReady, setIsReady] = useState(() => typeof window !== "undefined" && hasGoogleMapsPlaces());

    useEffect(() => {
        if (typeof window === "undefined") {
            return undefined;
        }

        if (hasGoogleMapsPlaces()) {
            setIsReady(true);
            return undefined;
        }

        const intervalId = window.setInterval(() => {
            if (hasGoogleMapsPlaces()) {
                setIsReady(true);
                window.clearInterval(intervalId);
            }
        }, 300);

        return () => {
            window.clearInterval(intervalId);
        };
    }, []);

    return isReady;
}
