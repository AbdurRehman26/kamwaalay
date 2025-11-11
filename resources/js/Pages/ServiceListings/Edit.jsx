import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import PublicLayout from "@/Layouts/PublicLayout";
import api from "@/services/api";
import { serviceListingsService } from "@/services/serviceListings";
import { route } from "@/utils/routes";

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
                            city_name: listingData.city || '',
                            area: listingData.area || '',
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

    const serviceTypes = [
        { value: "maid", label: "Maid", icon: "🧹" },
        { value: "cook", label: "Cook", icon: "👨‍🍳" },
        { value: "babysitter", label: "Babysitter", icon: "👶" },
        { value: "caregiver", label: "Caregiver", icon: "👵" },
        { value: "cleaner", label: "Cleaner", icon: "✨" },
        { value: "all_rounder", label: "All Rounder", icon: "🌟" },
    ];

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
                area: location.area || '',
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
                
                <div className="container mx-auto px-4 py-12 text-center">
                    <p className="text-gray-600">Loading listing details...</p>
                </div>
            </PublicLayout>
        );
    }

    if (error || !listing) {
        return (
            <PublicLayout>
                
                <div className="container mx-auto px-4 py-12 text-center">
                    <p className="text-red-600">{error || "Listing not found"}</p>
                    <Link
                        to={route("service-listings.my-listings")}
                        className="mt-4 inline-block bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition duration-300 font-semibold"
                    >
                        Back to My Listings
                    </Link>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">Edit Service Listing</h1>
                </div>
            </div>
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={submit} className="space-y-8">
                        {/* Service Types Selection */}
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Service Types *</h2>
                            <p className="text-sm text-gray-600 mb-6">Choose the services you offer. You can select multiple.</p>
                            {/* Selected Service Types as Tags */}
                            {selectedServiceTypes.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex flex-wrap gap-2">
                                        {selectedServiceTypes.map((serviceType) => {
                                            const service = serviceTypes.find(st => st.value === serviceType);
                                            return (
                                                <span
                                                    key={serviceType}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold"
                                                >
                                                    <span>{service?.icon}</span>
                                                    <span>{service?.label}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeServiceType(serviceType)}
                                                        className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
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
                                        className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                                            selectedServiceTypes.includes(service.value)
                                                ? "border-blue-500 bg-blue-50 opacity-50 cursor-not-allowed"
                                                : "border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer"
                                        }`}
                                    >
                                        <div className="text-3xl mb-2">{service.icon}</div>
                                        <div className="font-semibold text-gray-900">{service.label}</div>
                                    </button>
                                ))}
                            </div>
                            {errors.service_types && <div className="text-red-500 text-sm mt-2">{errors.service_types}</div>}
                        </div>

                        {/* Locations Selection */}
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Locations *</h2>
                            <p className="text-sm text-gray-600 mb-6">Add locations where you offer your services. You can add multiple locations.</p>
                            
                            {/* Notice about Karachi only */}
                            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
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
                                    <div className="flex flex-wrap gap-2">
                                        {selectedLocations.map((location) => (
                                            <span
                                                key={location.id}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold"
                                            >
                                                <span>📍</span>
                                                <span>{location.display_text}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeLocation(location.id)}
                                                    className="ml-1 text-green-600 hover:text-green-800 font-bold"
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
                                    className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 px-4 py-3"
                                    placeholder="Search location (e.g., Karachi, Clifton or type area name)..."
                                />
                                {showLocationSuggestions && locationSuggestions.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                                        {locationSuggestions
                                            .filter(suggestion => !selectedLocations.some(loc => loc.id === (suggestion.id || suggestion.display_text)))
                                            .map((suggestion, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => handleLocationSelect(suggestion)}
                                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                >
                                                    {suggestion.display_text}
                                                </div>
                                            ))}
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 mt-2">
                                    Type to search and select locations. Each location will be added as a tag.
                                </p>
                            </div>
                            {errors.locations && <div className="text-red-500 text-sm mt-2">{errors.locations}</div>}
                        </div>

                        {/* Common Fields */}
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Common Details</h2>
                            <p className="text-sm text-gray-600 mb-6">These details will apply to your service listing.</p>
                            
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Work Type *</label>
                                    <select
                                        value={data.work_type}
                                        onChange={(e) => setData({ ...data, work_type: e.target.value })}
                                        className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select Type</option>
                                        <option value="full_time">Full Time</option>
                                        <option value="part_time">Part Time</option>
                                    </select>
                                    {errors.work_type && <div className="text-red-500 text-sm mt-1">{errors.work_type}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Rate (PKR)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.monthly_rate}
                                        onChange={(e) => setData({ ...data, monthly_rate: e.target.value })}
                                        className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="e.g., 500"
                                    />
                                    {errors.monthly_rate && <div className="text-red-500 text-sm mt-1">{errors.monthly_rate}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => setData({ ...data, status: e.target.value })}
                                        className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="active">Active</option>
                                        <option value="paused">Paused</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                    {errors.status && <div className="text-red-500 text-sm mt-1">{errors.status}</div>}
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData({ ...data, is_active: e.target.checked })}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label className="ml-2 block text-sm text-gray-700">Active Listing</label>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData({ ...data, description: e.target.value })}
                                        rows={6}
                                        className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="Describe the services you offer, your experience, skills, etc..."
                                    />
                                    {errors.description && <div className="text-red-500 text-sm mt-1">{errors.description}</div>}
                                </div>
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="bg-white rounded-lg shadow-md p-8">

                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300 font-semibold disabled:opacity-50"
                                >
                                    {processing ? "Updating..." : "Update Service Listing"}
                                </button>
                                <Link
                                    to={route("service-listings.my-listings")}
                                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition duration-300 font-semibold text-center flex items-center justify-center"
                                >
                                    Cancel
                                </Link>
                            </div>
                            {errors.submit && (
                                <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                                    <p className="text-sm text-red-800">{errors.submit[0]}</p>
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </PublicLayout>
    );
}

