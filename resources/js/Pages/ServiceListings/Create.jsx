import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/Layouts/DashboardLayout";
import api from "@/services/api";
import { serviceListingsService } from "@/services/serviceListings";
import { route } from "@/utils/routes";
import { useServiceTypes } from "@/hooks/useServiceTypes";

export default function ServiceListingCreate() {
    const navigate = useNavigate();
    const [selectedServiceTypes, setSelectedServiceTypes] = useState([]);
    const [selectedLocations, setSelectedLocations] = useState([]);
    const [locationQuery, setLocationQuery] = useState("");
    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
    const locationRef = useRef(null);
    const searchTimeoutRef = useRef(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    // Common fields for all listings
    const [commonFields, setCommonFields] = useState({
        work_type: "",
        monthly_rate: "",
        description: "",
    });

    // Fetch service types from API
    const { serviceTypes } = useServiceTypes();

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
        // Check if location already exists
        const exists = selectedLocations.some(loc => loc.id === location.id);
        if (!exists) {
            setSelectedLocations([...selectedLocations, {
                id: location.id || location.display_text,
                display_text: location.display_text,
                city_name: location.city_name,
                area: location.area || "",
            }]);
        }
        setLocationQuery("");
        setShowLocationSuggestions(false);
    };

    const removeServiceType = (serviceType) => {
        setSelectedServiceTypes(selectedServiceTypes.filter(st => st !== serviceType));
    };

    const removeLocation = (locationId) => {
        setSelectedLocations(selectedLocations.filter(loc => loc.id !== locationId));
    };

    const addServiceType = (serviceType) => {
        if (!selectedServiceTypes.includes(serviceType)) {
            setSelectedServiceTypes([...selectedServiceTypes, serviceType]);
        }
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

    const submit = (e) => {
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

        if (!commonFields.work_type) {
            setErrors({ work_type: "Work type is required." });
            setProcessing(false);
            return;
        }

        // Prepare data: Create array of listings for validation (each combination)
        // This format helps with validation but backend will create ONE listing
        const listingsData = [];
        selectedServiceTypes.forEach(serviceType => {
            selectedLocations.forEach(location => {
                listingsData.push({
                    service_type: serviceType,
                    work_type: commonFields.work_type,
                    city: location.city_name,
                    area: location.area,
                    monthly_rate: commonFields.monthly_rate || null,
                    description: commonFields.description || null,
                });
            });
        });

        // Prepare data for API - backend expects service_types and locations arrays
        // Filter out locations without valid IDs (e.g., cities without location records)
        const validLocationIds = selectedLocations
            .map(loc => {
                // If id is a number or numeric string, use it; otherwise skip
                const id = typeof loc.id === "number" ? loc.id : parseInt(loc.id);
                return isNaN(id) ? null : id;
            })
            .filter(id => id !== null);

        if (validLocationIds.length === 0) {
            setErrors({ locations: "Please select valid locations with location IDs." });
            setProcessing(false);
            return;
        }

        const apiData = {
            service_types: selectedServiceTypes,
            locations: validLocationIds,
            work_type: commonFields.work_type,
            monthly_rate: commonFields.monthly_rate || null,
            description: commonFields.description || null,
        };

        serviceListingsService.createListing(apiData)
            .then((response) => {
                setProcessing(false);
                // Redirect to my listings
                navigate(route("service-listings.my-listings"));
            })
            .catch((error) => {
                if (error.response?.data?.errors) {
                    setErrors(error.response.data.errors);
                } else {
                    setErrors({ submit: [error.response?.data?.message || "Failed to create listing"] });
                }
                setProcessing(false);
            });
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-10 relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none">
                    <div className="relative z-10">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">Create Service Listing</h1>
                        <p className="text-indigo-100 text-lg max-w-2xl mb-6">
                            Add services and locations you offer to connect with customers.
                        </p>
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 max-w-2xl border border-white/30">
                            <p className="text-sm flex items-start gap-2">
                                <span className="text-xl flex-shrink-0">💡</span>
                                <span>
                                    <strong>Tip:</strong> Select multiple service types and locations. One service listing will be created with all selected services and locations.
                                </span>
                            </p>
                        </div>
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
                                    <div className="flex flex-wrap gap-2">
                                        {selectedServiceTypes.map((serviceType) => {
                                            const service = serviceTypes.find(st => st.value === serviceType);
                                            return (
                                                <span
                                                    key={serviceType}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full text-sm font-bold"
                                                >
                                                    <span>{service?.icon}</span>
                                                    <span>{service?.label}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeServiceType(serviceType)}
                                                        className="ml-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 font-bold"
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
                                        className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${selectedServiceTypes.includes(service.value)
                                                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-600 opacity-50 cursor-not-allowed"
                                                : "border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 cursor-pointer hover:shadow-md"
                                            }`}
                                    >
                                        <div className="text-3xl mb-2">{service.icon}</div>
                                        <div className="font-bold text-gray-900 dark:text-white">{service.label}</div>
                                    </button>
                                ))}
                            </div>
                            {errors.service_types && <div className="text-red-600 dark:text-red-400 text-sm mt-2 font-semibold">{errors.service_types}</div>}
                        </div>

                        {/* Locations Selection */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <span className="text-2xl">📍</span>
                                Select Locations *
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Add locations where you offer your services. You can add multiple locations.</p>

                            {/* Notice about Karachi only */}
                            <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 p-4 rounded-lg">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
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
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-full text-sm font-bold"
                                            >
                                                <span>📍</span>
                                                <span>{location.display_text}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeLocation(location.id)}
                                                    className="ml-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 font-bold"
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
                                    className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 px-4 py-3 transition-all"
                                    placeholder="Search location (e.g., Karachi, Clifton or type area name)..."
                                />
                                {showLocationSuggestions && locationSuggestions.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-xl max-h-60 overflow-auto">
                                        {locationSuggestions
                                            .filter(suggestion => !selectedLocations.some(loc => loc.id === (suggestion.id || suggestion.display_text)))
                                            .map((suggestion, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => handleLocationSelect(suggestion)}
                                                    className="px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 text-gray-900 dark:text-white"
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
                            {errors.locations && <div className="text-red-600 dark:text-red-400 text-sm mt-2 font-semibold">{errors.locations}</div>}
                        </div>

                        {/* Common Fields */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <span className="text-2xl">📝</span>
                                Common Details
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">These details will apply to all your service listings.</p>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Work Type *</label>
                                    <select
                                        value={commonFields.work_type}
                                        onChange={(e) => setCommonFields({ ...commonFields, work_type: e.target.value })}
                                        className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
                                        required
                                    >
                                        <option value="">Select Type</option>
                                        <option value="full_time">Full Time</option>
                                        <option value="part_time">Part Time</option>
                                    </select>
                                    {errors.work_type && <div className="text-red-600 dark:text-red-400 text-sm mt-1 font-semibold">{errors.work_type}</div>}
                                </div>


                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Monthly Rate (PKR)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={commonFields.monthly_rate}
                                        onChange={(e) => setCommonFields({ ...commonFields, monthly_rate: e.target.value })}
                                        className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
                                        placeholder="e.g., 500"
                                    />
                                    {errors.monthly_rate && <div className="text-red-600 dark:text-red-400 text-sm mt-1 font-semibold">{errors.monthly_rate}</div>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description</label>
                                    <textarea
                                        value={commonFields.description}
                                        onChange={(e) => setCommonFields({ ...commonFields, description: e.target.value })}
                                        rows={6}
                                        className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
                                        placeholder="Describe the services you offer, your experience, skills, etc..."
                                    />
                                    {errors.description && <div className="text-red-600 dark:text-red-400 text-sm mt-1 font-semibold">{errors.description}</div>}
                                </div>
                            </div>

                            {/* Preview */}
                            {selectedServiceTypes.length > 0 && selectedLocations.length > 0 && (
                                <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-800">
                                    <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100 mb-2">
                                        Your service listing will include:
                                    </p>
                                    <div className="text-xs text-indigo-700 dark:text-indigo-300 space-y-2">
                                        <div>
                                            <span className="font-semibold">Service Types:</span> {selectedServiceTypes.map((serviceType) => {
                                                const service = serviceTypes.find(st => st.value === serviceType);
                                                return service?.label;
                                            }).join(", ")}
                                        </div>
                                        <div>
                                            <span className="font-semibold">Locations:</span> {selectedLocations.map(loc => loc.display_text).join(", ")}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Submit Buttons */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processing
                                        ? "Creating..."
                                        : "Create Service Listing"
                                    }
                                </button>
                                <Link
                                    to={route("service-listings.my-listings")}
                                    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 font-bold text-center flex items-center justify-center"
                                >
                                    View My Listings
                                </Link>
                            </div>
                            {errors.submit && (
                                <div className="mt-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-600 p-4 rounded-lg">
                                    <p className="text-sm text-red-800 dark:text-red-300 font-semibold">{errors.submit[0]}</p>
                                </div>
                            )}
                            <div className="mt-4 text-center">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {selectedServiceTypes.length > 0 && selectedLocations.length > 0
                                        ? `One service listing will be created with ${selectedServiceTypes.length} service type(s) and ${selectedLocations.length} location(s).`
                                        : "Select at least one service type and one location to create a listing."
                                    }
                                </p>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
