import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import PublicLayout from "@/Layouts/PublicLayout";
import api from "@/services/api";
import { serviceListingsService } from "@/services/serviceListings";
import { route } from "@/utils/routes";

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

    const serviceTypes = [
        { value: "maid", label: "Maid", icon: "🧹" },
        { value: "cook", label: "Cook", icon: "👨‍🍳" },
        { value: "babysitter", label: "Babysitter", icon: "👶" },
        { value: "caregiver", label: "Caregiver", icon: "👵" },
        { value: "cleaner", label: "Cleaner", icon: "✨" },
        { value: "all_rounder", label: "All Rounder", icon: "🌟" },
    ];

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
        const apiData = {
            service_types: selectedServiceTypes,
            locations: selectedLocations.map(loc => ({
                city: loc.city_name,
                area: loc.area,
            })),
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
        <PublicLayout>
            
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">Create Service Listing</h1>
                    <p className="text-xl text-white/90">Add services and locations you offer</p>
                    <div className="mt-4 bg-white/20 rounded-lg p-4 max-w-2xl">
                        <p className="text-sm">
                            💡 <strong>Tip:</strong> Select multiple service types and locations. One service listing will be created with all selected services and locations.
                        </p>
                    </div>
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
                            <p className="text-sm text-gray-600 mb-6">These details will apply to all your service listings.</p>
                            
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Work Type *</label>
                                    <select
                                        value={commonFields.work_type}
                                        onChange={(e) => setCommonFields({...commonFields, work_type: e.target.value})}
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
                                        value={commonFields.monthly_rate}
                                        onChange={(e) => setCommonFields({...commonFields, monthly_rate: e.target.value})}
                                        className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="e.g., 500"
                                    />
                                    {errors.monthly_rate && <div className="text-red-500 text-sm mt-1">{errors.monthly_rate}</div>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                    <textarea
                                        value={commonFields.description}
                                        onChange={(e) => setCommonFields({...commonFields, description: e.target.value})}
                                        rows={6}
                                        className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="Describe the services you offer, your experience, skills, etc..."
                                    />
                                    {errors.description && <div className="text-red-500 text-sm mt-1">{errors.description}</div>}
                                </div>
                            </div>

                            {/* Preview */}
                            {selectedServiceTypes.length > 0 && selectedLocations.length > 0 && (
                                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-sm font-semibold text-blue-900 mb-2">
                                        Your service listing will include:
                                    </p>
                                    <div className="text-xs text-blue-700 space-y-2">
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
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300 font-semibold disabled:opacity-50"
                                >
                                    {processing 
                                        ? "Creating..." 
                                        : "Create Service Listing"
                                    }
                                </button>
                                <Link
                                    to={route("service-listings.my-listings")}
                                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition duration-300 font-semibold text-center flex items-center justify-center"
                                >
                                    View My Listings
                                </Link>
                            </div>
                            {errors.submit && (
                                <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                                    <p className="text-sm text-red-800">{errors.submit[0]}</p>
                                </div>
                            )}
                            <div className="mt-4 text-center">
                                <p className="text-sm text-gray-600">
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
        </PublicLayout>
    );
}
