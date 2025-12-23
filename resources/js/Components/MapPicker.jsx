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
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
        libraries: libraries
    });

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

    if (!isLoaded) {
        return (
            <div style={{ height: height, width: "100%", borderRadius: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f3f4f6" }}>
                <p className="text-gray-500">Loading Maps...</p>
            </div>
        );
    }

    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
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
                {/* Search Bar */}
                <div className="absolute top-2 left-2 right-12 z-10 flex gap-2">
                    <Autocomplete
                        onLoad={onAutocompleteLoad}
                        onPlaceChanged={onPlaceChanged}
                        className="flex-grow"
                    >
                        <input
                            type="text"
                            placeholder="Search location..."
                            className="w-full px-4 py-2 rounded-lg border-0 shadow-md text-gray-900 focus:ring-2 focus:ring-indigo-500"
                            style={{ width: "300px", maxWidth: "100%" }}
                        />
                    </Autocomplete>
                    <button
                        type="button"
                        onClick={() => {
                            if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(
                                    (pos) => {
                                        const { latitude, longitude } = pos.coords;
                                        // Geocode the position
                                        updatePositionAndAddress(latitude, longitude);

                                        if (map) {
                                            map.panTo({ lat: latitude, lng: longitude });
                                            map.setZoom(15);
                                        }
                                    },
                                    (error) => {
                                        console.error("Error getting location:", error);
                                        alert("Could not get your location. Please check browser permissions.");
                                    }
                                );
                            } else {
                                alert("Geolocation is not supported by this browser.");
                            }
                        }}
                        className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                        title="Locate Me"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                    </button>
                </div>

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
