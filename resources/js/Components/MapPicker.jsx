import React, { useState, useEffect, useCallback, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from "@react-google-maps/api";

const containerStyle = {
    width: "100%",
    height: "100%"
};

const defaultCenter = {
    lat: 24.8607,
    lng: 67.0011
};

// Define libraries outside of component to prevent re-loading loop
const libraries = ["places"];

export default function MapPicker({ latitude, longitude, onChange, height = "300px" }) {
    // Get API key from environment or use window global if already loaded
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || (typeof window !== "undefined" ? window.GOOGLE_MAPS_API_KEY : "") || "";
    
    // Check if Google Maps is already loaded (from script tag in app.blade.php)
    const isAlreadyLoaded = typeof window !== "undefined" && window.google && window.google.maps;
    
    const { isLoaded, loadError } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: apiKey,
        libraries: libraries,
        // Prevent reloading if already loaded
        preventGoogleFontsLoading: false,
    });
    
    // Use already loaded Google Maps if available
    const mapsLoaded = isAlreadyLoaded || isLoaded;

    const [map, setMap] = useState(null);
    const [autocomplete, setAutocomplete] = useState(null);
    const [geocoder, setGeocoder] = useState(null);

    // Use state to track position locally for smoother UI updates
    const [position, setPosition] = useState(null);

    // Update local state when props change
    useEffect(() => {
        if (latitude && longitude) {
            setPosition({ lat: parseFloat(latitude), lng: parseFloat(longitude) });
        }
    }, [latitude, longitude]);

    const onLoad = useCallback(function callback(map) {
        setMap(map);
        setGeocoder(new google.maps.Geocoder());
    }, []);

    const onUnmount = useCallback(function callback(map) {
        setMap(null);
        setGeocoder(null);
    }, []);

    // Helper to reverse geocode and call onChange
    const updatePositionAndAddress = useCallback((lat, lng, explicitAddress = null) => {
        setPosition({ lat, lng });

        if (explicitAddress) {
            onChange(lat, lng, explicitAddress);
        } else if (geocoder) {
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === "OK" && results[0]) {
                    onChange(lat, lng, results[0].formatted_address);
                } else {
                    console.error("Geocoder failed:", status);
                    onChange(lat, lng, "");
                }
            });
        } else {
            onChange(lat, lng, "");
        }
    }, [geocoder, onChange]);

    const onMapClick = useCallback((e) => {
        updatePositionAndAddress(e.latLng.lat(), e.latLng.lng());
    }, [updatePositionAndAddress]);

    const onMarkerDragEnd = useCallback((e) => {
        updatePositionAndAddress(e.latLng.lat(), e.latLng.lng());
    }, [updatePositionAndAddress]);

    // Autocomplete handlers
    const onAutocompleteLoad = useCallback((autocompleteInstance) => {
        setAutocomplete(autocompleteInstance);
    }, []);

    const onPlaceChanged = useCallback(() => {
        if (autocomplete !== null) {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
                const newLat = place.geometry.location.lat();
                const newLng = place.geometry.location.lng();

                // Use formatted_address from Place result if available
                const address = place.formatted_address || "";

                updatePositionAndAddress(newLat, newLng, address);

                if (map) {
                    map.panTo({ lat: newLat, lng: newLng });
                    map.setZoom(15);
                }
            } else {
                console.log("Autocomplete: No details available for input: " + place.name);
            }
        }
    }, [autocomplete, map, updatePositionAndAddress]);

    if (loadError && !isAlreadyLoaded) {
        return (
            <div style={{ height: height, width: "100%", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fee2e2", color: "#ef4444", padding: "1rem", flexDirection: "column", textAlign: "center" }}>
                <p className="font-bold">⚠️ Google Maps Error</p>
                <p className="text-sm mt-1">This page can't load Google Maps correctly.</p>
                <p className="text-xs mt-2">Please check your API key configuration.</p>
            </div>
        );
    }

    if (!mapsLoaded) {
        return (
            <div style={{ height: height, width: "100%", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f3f4f6" }}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                    <p className="text-gray-500">Loading Maps...</p>
                </div>
            </div>
        );
    }

    if (!apiKey && !isAlreadyLoaded) {
        return (
            <div style={{ height: height, width: "100%", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fee2e2", color: "#ef4444", padding: "1rem", flexDirection: "column", textAlign: "center" }}>
                <p className="font-bold">Google Maps API Key Missing</p>
                <p className="text-sm mt-1">Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.</p>
            </div>
        );
    }

    return (
        <div style={{ height: height, width: "100%", borderRadius: "0.5rem", overflow: "hidden", position: "relative" }}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={position || defaultCenter}
                zoom={13}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={onMapClick}
                options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: true,
                }}
            >
                {/* Search Bar and Locate Me (Removed - External Control) */}

                {(position || (latitude && longitude)) && (
                    <Marker
                        position={position || { lat: parseFloat(latitude), lng: parseFloat(longitude) }}
                        draggable={true}
                        onDragEnd={onMarkerDragEnd}
                    />
                )}
            </GoogleMap>
        </div>
    );
}
