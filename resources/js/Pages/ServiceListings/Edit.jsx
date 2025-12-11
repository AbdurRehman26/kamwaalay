import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import PublicLayout from "@/Layouts/PublicLayout";
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
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [data, setData] = useState({
        work_type: "",
        monthly_rate: "",
        description: "",
        status: "active",
        is_active: true,
    });

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

        if (selectedLocations.length === 0) {
            setErrors({ locations: "Please select at least one location." });
            setProcessing(false);
            return;
        }

        // Prepare data for API - locations should be array of IDs
        const apiData = {
            service_types: selectedServiceTypes,
            locations: selectedLocations.map(loc => loc.id),
            work_type: data.work_type,
            monthly_rate: data.monthly_rate || null,
            description: data.description || null,
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
            <PublicLayout>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading listing details...</p>
                    </div>
                </div>
            </PublicLayout>
        );
    }

    if (error || !listing) {
        return (
            <PublicLayout>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
                    <div className="max-w-2xl mx-auto px-6 lg:px-8">
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
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 text-white overflow-hidden py-16 md:py-24">
                {/* Abstract Background Shapes */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Edit Service Listing</h1>
                    <p className="text-xl text-indigo-100/90 max-w-2xl mx-auto leading-relaxed">
                        Update your service listing details and information.
                    </p>
                </div>
            </div>

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <form onSubmit={submit} className="space-y-8">
                            {/* Service Types Selection */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 relative z-20 -mt-16">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="text-2xl">🛠️</span>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Select Service Types *</h2>
                                </div>
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
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Select Locations *</h2>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Add locations where you offer your services. You can add multiple locations.</p>
                                
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
                                            placeholder="Describe the services you offer, your experience, skills, etc..."
                                        />
                                        {errors.description && (
                                            <div className="mt-2 text-red-500 dark:text-red-400 text-sm font-medium flex items-center gap-1">
                                                <span>⚠️</span> {errors.description}
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
            </div>
        </PublicLayout>
    );
}

