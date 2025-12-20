import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/Layouts/DashboardLayout";
import api from "@/services/api";
import { serviceListingsService } from "@/services/serviceListings";
import { route } from "@/utils/routes";
import { useServiceTypes } from "@/hooks/useServiceTypes";

export default function ServiceListingEdit() {
    const { listingId } = useParams();
    const navigate = useNavigate();
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedServiceTypes, setSelectedServiceTypes] = useState([]);
    const [selectedLocations, setSelectedLocations] = useState([]);
    const [locationQuery, setLocationQuery] = useState("");
    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
    const locationRef = useRef(null);
    const searchTimeoutRef = useRef(null);
    const pinAddressInputRef = useRef(null);
    const autocompleteRef = useRef(null);
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [data, setData] = useState({
        work_type: "",
        monthly_rate: "",
        description: "",
        pin_address: "",
        status: "active",
        is_active: true,
    });
    const [gettingLocation, setGettingLocation] = useState(false);

    // Fetch listing from API
    useEffect(() => {
        if (listingId) {
            // Use the edit endpoint to get listing data
            api.get(`/service-listings/${listingId}/edit`)
                .then((response) => {
                    const listingData = response.data.listing;
                    setListing(listingData);
                    
                    // service_types is now an array of strings
                    setSelectedServiceTypes(
                        listingData.service_types && listingData.service_types.length > 0 
                            ? listingData.service_types
                            : []
                    );
                    
                    // Use location_details if available, otherwise fallback to city/area
                    if (listingData.location_details && listingData.location_details.length > 0) {
                        setSelectedLocations(listingData.location_details);
                    } else if (listingData.locations && listingData.locations.length > 0) {
                        // Fallback: create location objects using the listing's city/area
                        const locations = listingData.locations.map((locationId) => ({
                            id: locationId,
                            city_name: listingData.city || "",
                            area: listingData.area || "",
                            display_text: listingData.city && listingData.area 
                                ? `${listingData.city}, ${listingData.area}`
                                : listingData.city || `Location ID: ${locationId}`
                        }));
                        setSelectedLocations(locations);
                    }
                    
                    setData({
                        work_type: listingData.work_type || "",
                        monthly_rate: listingData.monthly_rate || "",
                        description: listingData.description || "",
                        pin_address: listingData.pin_address || "",
                        pin_latitude: listingData.pin_latitude || "",
                        pin_longitude: listingData.pin_longitude || "",
                        status: listingData.status || "active",
                        is_active: listingData.is_active ?? true,
                    });
                    setLoading(false);
                })
                .catch((err) => {
                    console.error("Error fetching listing:", err);
                    setError(err.response?.data?.message || "Failed to load listing");
                    setLoading(false);
                });
        }
    }, [listingId]);

    // Fetch service types from API
    const { serviceTypes } = useServiceTypes();

    const addServiceType = (serviceType) => {
        if (!selectedServiceTypes.includes(serviceType)) {
            setSelectedServiceTypes([...selectedServiceTypes, serviceType]);
        }
    };

    const removeServiceType = (serviceType) => {
        setSelectedServiceTypes(selectedServiceTypes.filter(st => st !== serviceType));
    };

    const addLocation = (location) => {
        // Check if location already exists by ID or display text
        const exists = selectedLocations.some(loc => 
            loc.id === location.id || loc.display_text === location.display_text
        );
        if (!exists) {
            setSelectedLocations([...selectedLocations, {
                id: location.id || location.display_text,
                city_name: location.city_name,
                area: location.area || "",
                display_text: location.display_text
            }]);
        }
        setLocationQuery("");
        setShowLocationSuggestions(false);
    };

    const removeLocation = (locationId) => {
        setSelectedLocations(selectedLocations.filter(loc => loc.id !== locationId));
    };

    // Fetch location suggestions
    useEffect(() => {
        if (locationQuery.length >= 2) {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            searchTimeoutRef.current = setTimeout(() => {
                api
                    .get("/locations/search", {
                        params: { q: locationQuery },
                    })
                    .then((response) => {
                        setLocationSuggestions(response.data);
                        setShowLocationSuggestions(true);
                    })
                    .catch((error) => {
                        console.error("Error fetching locations:", error);
                        setLocationSuggestions([]);
                    });
            }, 300);
        } else {
            setLocationSuggestions([]);
            setShowLocationSuggestions(false);
        }
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [locationQuery]);

    const handleLocationSelect = (location) => {
        addLocation(location);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (locationRef.current && !locationRef.current.contains(event.target)) {
                setShowLocationSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Initialize Google Places Autocomplete
    // Note: Using deprecated Autocomplete API for now as PlaceAutocompleteElement has compatibility issues
    useEffect(() => {
        if (pinAddressInputRef.current && window.google && window.google.maps && window.google.maps.places) {
            try {
                // Use the deprecated Autocomplete API (still works and more stable)
                const autocomplete = new window.google.maps.places.Autocomplete(
                    pinAddressInputRef.current,
                    {
                        componentRestrictions: { country: "pk" },
                        fields: ["formatted_address", "geometry", "name"],
                        types: ["address"]
                    }
                );

                autocompleteRef.current = autocomplete;

                autocomplete.addListener("place_changed", () => {
                    const place = autocomplete.getPlace();
                    if (place.formatted_address) {
                        const lat = place.geometry?.location?.lat();
                        const lng = place.geometry?.location?.lng();
                        setData({ 
                            ...data, 
                            pin_address: place.formatted_address,
                            pin_latitude: lat ? lat.toString() : "",
                            pin_longitude: lng ? lng.toString() : ""
                        });
                    }
                });

                return () => {
                    if (autocompleteRef.current) {
                        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
                    }
                };
            } catch (error) {
                console.error("Error initializing Google Places Autocomplete:", error);
                // Silently fail - user can still type addresses manually
            }
        }
    }, [data.pin_address]);

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            setErrors({ ...errors, pin_address: "Geolocation is not supported by your browser." });
            return;
        }

        // Check if we're in a secure context (HTTPS or localhost)
        if (!window.isSecureContext && window.location.protocol !== "https:" && !window.location.hostname.includes("localhost") && !window.location.hostname.includes("127.0.0.1")) {
            setErrors({ 
                ...errors, 
                pin_address: "Geolocation requires HTTPS or localhost. Please access the site via https://localhost or manually enter your address. The address autocomplete will still work." 
            });
            return;
        }

        if (!window.google || !window.google.maps || !window.google.maps.Geocoder) {
            setErrors({ ...errors, pin_address: "Google Maps API is not loaded. Please refresh the page." });
            return;
        }

        setGettingLocation(true);
        setErrors({ ...errors, pin_address: null });

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                try {
                    // Use Google Geocoding API for reverse geocoding
                    const geocoder = new window.google.maps.Geocoder();
                    const latlng = { lat: latitude, lng: longitude };
                    
                    geocoder.geocode({ location: latlng }, (results, status) => {
                        if (status === "OK" && results && results.length > 0) {
                            // Use the formatted address from Google
                            const formattedAddress = results[0].formatted_address;
                            setData({ 
                                ...data, 
                                pin_address: formattedAddress,
                                pin_latitude: latitude.toString(),
                                pin_longitude: longitude.toString()
                            });
                        } else {
                            // Fallback to coordinates if geocoding fails
                            setData({ 
                                ...data, 
                                pin_address: `${latitude}, ${longitude}`,
                                pin_latitude: latitude.toString(),
                                pin_longitude: longitude.toString()
                            });
                        }
                        setGettingLocation(false);
                    });
                } catch (error) {
                    console.error("Error reverse geocoding:", error);
                    // Fallback to coordinates
                    setData({ 
                        ...data, 
                        pin_address: `${latitude}, ${longitude}`,
                        pin_latitude: latitude.toString(),
                        pin_longitude: longitude.toString()
                    });
                    setGettingLocation(false);
                }
            },
            (error) => {
                console.error("Error getting location:", error);
                let errorMessage = "Unable to get your location.";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Location access denied. Please enable location permissions in your browser settings.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Location request timed out. Please try again.";
                        break;
                    default:
                        // Handle secure origin error (code 1)
                        if (error.code === 1 || error.message?.includes("secure origins")) {
                            errorMessage = "Geolocation requires HTTPS or localhost. Please use https://localhost or manually enter your address.";
                        } else {
                            errorMessage = `Unable to get your location: ${error.message || "Unknown error"}`;
                        }
                        break;
                }
                setErrors({ ...errors, pin_address: errorMessage });
                setGettingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    const submit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        
        // Validation
        if (selectedServiceTypes.length === 0) {
            setErrors({ service_types: "Please select at least one service type." });
            setProcessing(false);
            return;
        }

        if (!data.pin_address || data.pin_address.trim() === "") {
            setErrors({ pin_address: "Pin address is required." });
            setProcessing(false);
            return;
        }

        // Prepare data for API - locations should be array of IDs
        const apiData = {
            service_types: selectedServiceTypes,
            locations: selectedLocations.length > 0 ? selectedLocations.map(loc => loc.id) : null, // Optional
            work_type: data.work_type,
            monthly_rate: data.monthly_rate || null,
            description: data.description || null,
            pin_address: data.pin_address, // Required
            pin_latitude: data.pin_latitude ? parseFloat(data.pin_latitude) : null,
            pin_longitude: data.pin_longitude ? parseFloat(data.pin_longitude) : null,
            status: data.status,
            is_active: data.is_active,
        };
        
        try {
            await serviceListingsService.updateListing(listingId, apiData);
            // Redirect to my listings
            navigate(route("service-listings.my-listings"));
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ submit: [error.response?.data?.message || "Failed to update listing"] });
            }
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="flex flex-col items-center gap-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                            <p className="text-gray-600 dark:text-gray-400">Loading listing details...</p>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !listing) {
        return (
            <DashboardLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center border border-gray-100 dark:border-gray-700">
                            <div className="text-6xl mb-6">❌</div>
                            <p className="text-red-600 dark:text-red-400 text-xl mb-6 font-semibold">{error || "Listing not found"}</p>
                            <Link
                                to={route("service-listings.my-listings")}
                                className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-indigo-500/30 font-bold"
                            >
                                Back to My Listings
                            </Link>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-10 relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none">
                    <div className="relative z-10">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">Edit Service Listing</h1>
                        <p className="text-indigo-100 text-lg max-w-2xl mb-6">
                            Update your service listing details and information.
                        </p>
                    </div>
                    {/* Decorative blobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-20 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl transform translate-y-1/2"></div>
                </div>
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={submit} className="space-y-8">
                        {/* Service Types Selection */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <span className="text-2xl">🛠️</span>
                                Select Service Types *
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Choose the services you offer. You can select multiple.</p>
                            {/* Selected Service Types as Tags */}
                            {selectedServiceTypes.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex flex-wrap gap-3">
                                        {selectedServiceTypes.map((serviceType) => {
                                            const service = serviceTypes.find(st => st.value === serviceType);
                                            return (
                                                <span
                                                    key={serviceType}
                                                    className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full text-sm font-bold shadow-md"
                                                >
                                                    <span>{service?.icon}</span>
                                                    <span>{service?.label}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeServiceType(serviceType)}
                                                        className="ml-1 text-white hover:text-red-200 font-bold text-lg"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Service Type Options */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {serviceTypes.map((service) => (
                                    <button
                                        key={service.value}
                                        type="button"
                                        onClick={() => addServiceType(service.value)}
                                        disabled={selectedServiceTypes.includes(service.value)}
                                        className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                                            selectedServiceTypes.includes(service.value)
                                                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 opacity-50 cursor-not-allowed"
                                                : "border-gray-200 dark:border-gray-600 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer bg-white dark:bg-gray-700"
                                        }`}
                                    >
                                        <div className="text-4xl mb-3">{service.icon}</div>
                                        <div className="font-bold text-gray-900 dark:text-white">{service.label}</div>
                                    </button>
                                ))}
                            </div>
                            {errors.service_types && (
                                <div className="mt-4 text-red-500 dark:text-red-400 text-sm font-medium flex items-center gap-1">
                                    <span>⚠️</span> {errors.service_types}
                                </div>
                            )}
                        </div>

                            {/* Locations Selection */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="text-2xl">📍</span>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Select Locations (Optional)</h2>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Add locations where you offer your services. You can add multiple locations. This is optional.</p>
                                
                                {/* Notice about Karachi only */}
                                <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 p-4 rounded-xl">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-yellow-700">
                                            <strong>Note:</strong> We are currently serving <strong>Karachi</strong> only. We will be going live in different cities soon!
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                                {/* Selected Locations as Tags */}
                                {selectedLocations.length > 0 && (
                                    <div className="mb-6">
                                        <div className="flex flex-wrap gap-3">
                                            {selectedLocations.map((location) => (
                                                <span
                                                    key={location.id}
                                                    className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full text-sm font-bold shadow-md"
                                                >
                                                    <span>📍</span>
                                                    <span>{location.area || location.display_text?.split(", ").pop() || location.display_text}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeLocation(location.id)}
                                                        className="ml-1 text-white hover:text-red-200 font-bold text-lg"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Location Search */}
                                <div className="relative" ref={locationRef}>
                                    <input
                                        type="text"
                                        value={locationQuery}
                                        onChange={(e) => setLocationQuery(e.target.value)}
                                        onFocus={() => {
                                            if (locationSuggestions.length > 0) {
                                                setShowLocationSuggestions(true);
                                            }
                                        }}
                                        className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 shadow-sm transition-all duration-300"
                                        placeholder="Search location (e.g., Karachi, Clifton or type area name)..."
                                    />
                                    {showLocationSuggestions && locationSuggestions.length > 0 && (
                                        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-auto">
                                            {locationSuggestions
                                                .filter(suggestion => !selectedLocations.some(loc => loc.id === (suggestion.id || suggestion.display_text)))
                                                .map((suggestion, index) => (
                                                    <div
                                                        key={index}
                                                        onClick={() => handleLocationSelect(suggestion)}
                                                        className="px-4 py-3 hover:bg-indigo-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700/50 last:border-b-0 text-gray-800 dark:text-gray-200"
                                                    >
                                                        {suggestion.display_text}
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        Type to search and select locations. Each location will be added as a tag.
                                    </p>
                                </div>
                                {errors.locations && (
                                    <div className="mt-4 text-red-500 dark:text-red-400 text-sm font-medium flex items-center gap-1">
                                        <span>⚠️</span> {errors.locations}
                                    </div>
                                )}
                        </div>

                            {/* Common Fields */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="text-2xl">📝</span>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Common Details</h2>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">These details will apply to your service listing.</p>
                                
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Work Type *</label>
                                        <select
                                            value={data.work_type}
                                            onChange={(e) => setData({ ...data, work_type: e.target.value })}
                                            className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 shadow-sm transition-all duration-300"
                                            required
                                        >
                                            <option value="">Select Type</option>
                                            <option value="full_time">Full Time</option>
                                            <option value="part_time">Part Time</option>
                                        </select>
                                        {errors.work_type && (
                                            <div className="mt-2 text-red-500 dark:text-red-400 text-sm font-medium flex items-center gap-1">
                                                <span>⚠️</span> {errors.work_type}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Monthly Rate (PKR)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={data.monthly_rate}
                                            onChange={(e) => setData({ ...data, monthly_rate: e.target.value })}
                                            className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 shadow-sm transition-all duration-300"
                                            placeholder="e.g., 50000"
                                        />
                                        {errors.monthly_rate && (
                                            <div className="mt-2 text-red-500 dark:text-red-400 text-sm font-medium flex items-center gap-1">
                                                <span>⚠️</span> {errors.monthly_rate}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Status *</label>
                                        <select
                                            value={data.status}
                                            onChange={(e) => setData({ ...data, status: e.target.value })}
                                            className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 shadow-sm transition-all duration-300"
                                            required
                                        >
                                            <option value="active">Active</option>
                                            <option value="paused">Paused</option>
                                            <option value="closed">Closed</option>
                                        </select>
                                        {errors.status && (
                                            <div className="mt-2 text-red-500 dark:text-red-400 text-sm font-medium flex items-center gap-1">
                                                <span>⚠️</span> {errors.status}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center pt-8">
                                        <input
                                            type="checkbox"
                                            checked={data.is_active}
                                            onChange={(e) => setData({ ...data, is_active: e.target.checked })}
                                            className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                                        />
                                        <label className="ml-3 block text-sm font-semibold text-gray-700 dark:text-gray-300">Active Listing</label>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Description</label>
                                        <textarea
                                            value={data.description}
                                            onChange={(e) => setData({ ...data, description: e.target.value })}
                                            rows={8}
                                            className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 shadow-sm transition-all duration-300"
                                            placeholder="Describe the services you offer, your experience, etc..."
                                        />
                                        {errors.description && (
                                            <div className="mt-2 text-red-500 dark:text-red-400 text-sm font-medium flex items-center gap-1">
                                                <span>⚠️</span> {errors.description}
                                            </div>
                                        )}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                                            <span className="text-2xl mr-2">📍</span>
                                            Exact Pin Address *
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                ref={pinAddressInputRef}
                                                type="text"
                                                value={data.pin_address}
                                                onChange={(e) => setData({ ...data, pin_address: e.target.value })}
                                                className="flex-1 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 shadow-sm transition-all duration-300"
                                                placeholder="Start typing address or click button to get current location"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={handleGetCurrentLocation}
                                                disabled={gettingLocation}
                                                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                                            >
                                                {gettingLocation ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        <span>Getting...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>📍</span>
                                                        <span>Get Current Location</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                            Enter the exact address where you provide services, or click the button to automatically detect your current location.
                                        </p>
                                        {errors.pin_address && (
                                            <div className="mt-2 text-red-500 dark:text-red-400 text-sm font-medium flex items-center gap-1">
                                                <span>⚠️</span> {errors.pin_address}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-indigo-500/30 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                Updating...
                                            </span>
                                        ) : (
                                            "Update Service Listing"
                                        )}
                                    </button>
                                    <Link
                                        to={route("service-listings.my-listings")}
                                        className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 font-bold text-lg text-center flex items-center justify-center border-2 border-gray-300 dark:border-gray-600"
                                    >
                                        Cancel
                                    </Link>
                                </div>
                                {errors.submit && (
                                    <div className="mt-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 rounded-xl">
                                        <p className="text-sm text-red-800 dark:text-red-300 font-medium flex items-center gap-2">
                                            <span>⚠️</span> {errors.submit[0]}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
        </DashboardLayout>
    );
}

