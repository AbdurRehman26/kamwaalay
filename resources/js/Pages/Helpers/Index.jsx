import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import PublicLayout from "@/Layouts/PublicLayout";
import axios from "axios";
import { helpersService } from "@/services/helpers";
import { bookingsService } from "@/services/bookings";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";

export default function HelpersIndex({ helperId: initialHelperId, filters: initialFilters }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [helpers, setHelpers] = useState({ data: [], links: [], meta: {} });
    const [filters, setFilters] = useState(initialFilters || {});
    const [loading, setLoading] = useState(true);
    const [serviceType, setServiceType] = useState(filters?.service_type || "");
    const [locationId, setLocationId] = useState(filters?.location_id || "");
    const [locationDisplay, setLocationDisplay] = useState(filters?.location_display || "");
    const [sortBy, setSortBy] = useState(filters?.sort_by || "rating");
    const [userType, setUserType] = useState(filters?.user_type || "all");
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedArea, setSelectedArea] = useState("");
    const searchTimeoutRef = useRef(null);
    const suggestionsRef = useRef(null);
    const locationFilterRef = useRef(null);
    const [locationFilterQuery, setLocationFilterQuery] = useState("");
    const [locationFilterSuggestions, setLocationFilterSuggestions] = useState([]);
    const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const [formData, setFormData] = useState({
        service_type: "",
        work_type: "",
        city: "Karachi",
        area: "",
        start_date: "",
        start_time: "",
        name: "",
        phone: "",
        email: "",
        address: "",
        special_requirements: "",
        assigned_user_id: null,
    });
    const [processing, setProcessing] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    const serviceTypes = [
        { value: "", label: "All Services" },
        { value: "maid", label: "Maid" },
        { value: "cook", label: "Cook" },
        { value: "babysitter", label: "Babysitter" },
        { value: "caregiver", label: "Caregiver" },
        { value: "cleaner", label: "Cleaner" },
        { value: "all_rounder", label: "All Rounder" },
    ];

    // Fetch location suggestions for booking form
    useEffect(() => {
        if (searchQuery.length >= 2) {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            searchTimeoutRef.current = setTimeout(() => {
                axios
                    .get("/api/karachi-locations/search", {
                        params: { q: searchQuery },
                    })
                    .then((response) => {
                        setSuggestions(response.data);
                        setShowSuggestions(true);
                    })
                    .catch((error) => {
                        console.error("Error fetching locations:", error);
                        setSuggestions([]);
                    });
            }, 300);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery]);

    // Fetch location suggestions for filter
    useEffect(() => {
        if (locationFilterQuery.length >= 2) {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            searchTimeoutRef.current = setTimeout(() => {
                axios
                    .get("/api/locations/search", {
                        params: { q: locationFilterQuery },
                    })
                    .then((response) => {
                        setLocationFilterSuggestions(response.data);
                        setShowLocationSuggestions(true);
                    })
                    .catch((error) => {
                        console.error("Error fetching locations:", error);
                        setLocationFilterSuggestions([]);
                    });
            }, 300);
        } else {
            setLocationFilterSuggestions([]);
            setShowLocationSuggestions(false);
        }
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [locationFilterQuery]);

    // Handle area selection
    const handleAreaSelect = (area) => {
        setSelectedArea(area);
        setSearchQuery(area);
        setFormData(prev => ({ ...prev, area }));
        setShowSuggestions(false);
    };

    // Handle outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
            if (locationFilterRef.current && !locationFilterRef.current.contains(event.target)) {
                setShowLocationSuggestions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLocationSelect = (location) => {
        setLocationId(location.id || "");
        setLocationDisplay(location.display_text);
        setLocationFilterQuery(location.display_text);
        setShowLocationSuggestions(false);
    };

    // Fetch helpers from API
    useEffect(() => {
        const params = {
            service_type: serviceType || undefined,
            location_id: locationId || undefined,
            sort_by: sortBy,
            user_type: userType,
            page: currentPage,
        };

        // Remove undefined values
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

        setLoading(true);
        helpersService.getHelpers(params)
            .then((data) => {
                // Handle pagination response structure
                const helpersData = data.helpers || {};
                // Ensure links is always an array
                const helpersWithArrayLinks = {
                    ...helpersData,
                    data: helpersData.data || [],
                    links: Array.isArray(helpersData.links) ? helpersData.links : [],
                    meta: helpersData.meta || {},
                    // Also support direct properties (Laravel pagination structure)
                    total: helpersData.total || helpersData.meta?.total,
                    from: helpersData.from || helpersData.meta?.from,
                    to: helpersData.to || helpersData.meta?.to,
                    current_page: helpersData.current_page || helpersData.meta?.current_page,
                    last_page: helpersData.last_page || helpersData.meta?.last_page,
                };
                setHelpers(helpersWithArrayLinks);
                setFilters(data.filters || {});
                // Debug: Log pagination data
                console.log('Helpers pagination data:', {
                    links: helpersWithArrayLinks.links,
                    linksLength: helpersWithArrayLinks.links?.length,
                    meta: helpersWithArrayLinks.meta,
                    total: helpersWithArrayLinks.total,
                    last_page: helpersWithArrayLinks.last_page,
                });
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching helpers:", error);
                setLoading(false);
            });
    }, [serviceType, locationId, sortBy, userType, currentPage]);

    const handleFilter = () => {
        // Reset to first page when filters change
        setCurrentPage(1);
        // Just update URL without navigation
        const params = new URLSearchParams();
        if (serviceType) params.append("service_type", serviceType);
        if (locationId) params.append("location_id", locationId);
        if (sortBy) params.append("sort_by", sortBy);
        if (userType) params.append("user_type", userType);
        window.history.pushState({}, "", `${route("helpers.index")}?${params.toString()}`);
    };

    const handlePageChange = (url) => {
        if (!url) return;
        
        // Extract page number from URL
        const urlObj = new URL(url, window.location.origin);
        const page = urlObj.searchParams.get('page') || 1;
        setCurrentPage(parseInt(page));
        
        // Scroll to top of results
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        
        // Check if user is authenticated
        if (!user) {
            navigate(route("login"));
            return;
        }
        
        setProcessing(true);
        setFormErrors({});

        try {
            await bookingsService.createBooking(formData);
            // Reset form
            setFormData({
                service_type: "",
                work_type: "",
                city: "Karachi",
                area: "",
                start_date: "",
                start_time: "",
                name: "",
                phone: "",
                email: "",
                address: "",
                special_requirements: "",
                assigned_user_id: null,
            });
            setShowBookingForm(false);
            setSearchQuery("");
            setSelectedArea("");
        } catch (error) {
            if (error.response?.data?.errors) {
                setFormErrors(error.response.data.errors);
            } else {
                setFormErrors({ error: [error.response?.data?.message || "Failed to create booking"] });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <PublicLayout>

            <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-orange-500 text-white py-16">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Find Your Perfect Helper</h1>
                    <p className="text-xl text-white/90">Browse through verified domestic helpers</p>
                </div>
            </div>

            {/* Notice about going live in different cities */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                <strong>Note:</strong> We are currently serving Karachi only. We will be going live in different cities soon!
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Filter Helpers</h2>
                        <button
                            onClick={() => {
                                if (!user) {
                                    // Redirect to login if not authenticated
                                    navigate(route("login"));
                                    return;
                                }
                                setShowBookingForm(!showBookingForm);
                            }}
                            className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
                        >
                            {showBookingForm ? "Cancel Booking" : "Post Service Request"}
                        </button>
                    </div>

                    <div className="grid md:grid-cols-5 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Type</label>
                            <select
                                value={userType}
                                onChange={(e) => setUserType(e.target.value)}
                                className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500 py-3 px-4 shadow-sm"
                            >
                                <option value="all">All</option>
                                <option value="helper">Helpers Only</option>
                                <option value="business">Businesses Only</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Service Type</label>
                            <select
                                value={serviceType}
                                onChange={(e) => setServiceType(e.target.value)}
                                className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500 py-3 px-4 shadow-sm"
                            >
                                {serviceTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="relative" ref={locationFilterRef}>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Location</label>
                            <input
                                type="text"
                                value={locationFilterQuery || locationDisplay}
                                onChange={(e) => {
                                    setLocationFilterQuery(e.target.value);
                                    if (!e.target.value) {
                                        setLocationId("");
                                        setLocationDisplay("");
                                    }
                                }}
                                onFocus={() => {
                                    if (locationFilterSuggestions.length > 0) {
                                        setShowLocationSuggestions(true);
                                    }
                                }}
                                className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500 py-3 px-4 shadow-sm"
                                placeholder="Search location..."
                            />
                            {showLocationSuggestions && locationFilterSuggestions.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                                    {locationFilterSuggestions.map((suggestion, index) => (
                                        <div
                                            key={index}
                                            onClick={() => handleLocationSelect(suggestion)}
                                            className="px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                        >
                                            {suggestion.display_text}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500 py-3 px-4 shadow-sm"
                            >
                                <option value="rating">Rating</option>
                                <option value="experience">Experience</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={handleFilter}
                                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Booking Form */}
                {showBookingForm && user && (
                    <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900">Post Service Request</h2>
                        <form onSubmit={handleBookingSubmit}>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Type *</label>
                                    <select
                                        value={formData.service_type}
                                        onChange={(e) => setFormData(prev => ({ ...prev, service_type: e.target.value }))}
                                        className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                        required
                                    >
                                        <option value="">Select Service</option>
                                        {serviceTypes.filter(t => t.value !== "").map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                    {formErrors.service_type && <div className="text-red-500 text-sm mt-1">{formErrors.service_type}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Work Type *</label>
                                    <select
                                        value={formData.work_type}
                                        onChange={(e) => setFormData(prev => ({ ...prev, work_type: e.target.value }))}
                                        className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                        required
                                    >
                                        <option value="">Select Type</option>
                                        <option value="full_time">Full Time</option>
                                        <option value="part_time">Part Time</option>
                                    </select>
                                    {formErrors.work_type && <div className="text-red-500 text-sm mt-1">{formErrors.work_type}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        disabled
                                        className="w-full border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Currently serving Karachi only</p>
                                    {formErrors.city && <div className="text-red-500 text-sm mt-1">{formErrors.city}</div>}
                                </div>

                                <div className="relative" ref={suggestionsRef}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Area *</label>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setFormData(prev => ({ ...prev, area: e.target.value }));
                                        }}
                                        onFocus={() => {
                                            if (suggestions.length > 0) {
                                                setShowSuggestions(true);
                                            }
                                        }}
                                        className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                        placeholder="Type to search area..."
                                        required
                                    />
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                                            {suggestions.map((suggestion, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => handleAreaSelect(suggestion)}
                                                    className="px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                >
                                                    {suggestion}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {formErrors.area && <div className="text-red-500 text-sm mt-1">{formErrors.area}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                                        className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                    />
                                    {formErrors.start_date && <div className="text-red-500 text-sm mt-1">{formErrors.start_date}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                                    <input
                                        type="time"
                                        value={formData.start_time}
                                        onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                                        className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                    />
                                    {formErrors.start_time && <div className="text-red-500 text-sm mt-1">{formErrors.start_time}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                        required
                                    />
                                    {formErrors.name && <div className="text-red-500 text-sm mt-1">{formErrors.name}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                        required
                                    />
                                    {formErrors.phone && <div className="text-red-500 text-sm mt-1">{formErrors.phone}</div>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                        required
                                    />
                                    {formErrors.email && <div className="text-red-500 text-sm mt-1">{formErrors.email}</div>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                        rows={3}
                                        className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                    />
                                    {formErrors.address && <div className="text-red-500 text-sm mt-1">{formErrors.address}</div>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Special Requirements</label>
                                    <textarea
                                        value={formData.special_requirements}
                                        onChange={(e) => setFormData(prev => ({ ...prev, special_requirements: e.target.value }))}
                                        rows={4}
                                        className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                        placeholder="Any special requirements or preferences..."
                                    />
                                    {formErrors.special_requirements && <div className="text-red-500 text-sm mt-1">{formErrors.special_requirements}</div>}
                                </div>
                            </div>

                            <div className="mt-8 flex gap-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
                                >
                                    {processing ? "Submitting..." : "Submit Booking"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowBookingForm(false);
                                        setFormData({
                                            service_type: "",
                                            work_type: "",
                                            city: "Karachi",
                                            area: "",
                                            start_date: "",
                                            start_time: "",
                                            name: "",
                                            phone: "",
                                            email: "",
                                            address: "",
                                            special_requirements: "",
                                            assigned_user_id: null,
                                        });
                                        setSearchQuery("");
                                        setSelectedArea("");
                                    }}
                                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition duration-300 font-semibold"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Helpers Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600">Loading helpers...</p>
                    </div>
                ) : helpers.data && helpers.data.length > 0 ? (
                    <>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {helpers.data.map((helper) => {
                                const isBusiness = helper.role === "business";
                                // Ensure helper.id exists before creating route
                                if (!helper.id) {
                                    console.warn("Helper missing id:", helper);
                                    return null;
                                }
                                const profileRoute = isBusiness ? route("businesses.show", helper.id) : route("helpers.show", helper.id);

                                return (
                                    <Link
                                        key={helper.id}
                                        to={profileRoute}
                                        className={`group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 ${isBusiness ? "border-2 border-primary-200" : ""}`}
                                    >
                                        <div className={`h-56 flex items-center justify-center overflow-hidden ${isBusiness ? "bg-gradient-to-br from-primary-400 to-primary-500" : "bg-gradient-to-br from-primary-400 to-primary-500"}`}>
                                            {isBusiness ? (
                                                <div className="text-7xl text-white">🏢</div>
                                            ) : helper.photo ? (
                                                <img src={`/storage/${helper.photo}`} alt={helper.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                            ) : (
                                                <div className="text-7xl text-white">👤</div>
                                            )}
                                        </div>
                                        <div className="p-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{helper.name}</h3>
                                                {isBusiness && (
                                                    <span className="bg-primary-100 text-primary-800 text-xs px-3 py-1 rounded-full font-semibold">🏢 Business</span>
                                                )}
                                            </div>
                                            {!isBusiness && helper.service_listings && helper.service_listings.length > 0 && helper.service_listings[0].service_types && helper.service_listings[0].service_types.length > 0 && (
                                                <p className="text-gray-600 mb-3 capitalize">{helper.service_listings?.[0]?.service_types?.[0]?.service_type?.replace("_", " ") || "Service"}</p>
                                            )}
                                            {isBusiness && helper.bio && (
                                                <p className="text-gray-600 mb-3 text-sm line-clamp-2">{helper.bio}</p>
                                            )}
                                            {!isBusiness && (
                                                <div className="flex items-center mb-3">
                                                    <span className="text-yellow-500 text-xl mr-2">⭐</span>
                                                    <span className="font-semibold text-lg">{helper.rating || 0}</span>
                                                    <span className="text-gray-500 ml-2 text-sm">({helper.total_reviews || 0})</span>
                                                </div>
                                            )}
                                            <p className="text-sm text-gray-500 mb-2">{helper.city || "N/A"}, {helper.area || "N/A"}</p>
                                            {!isBusiness && helper.experience_years > 0 && (
                                                <p className="text-sm text-gray-600 mb-3">{helper.experience_years} years experience</p>
                                            )}
                                            {isBusiness && helper.service_listings && helper.service_listings.length > 0 && (
                                                <div className="mb-3">
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        📋 {helper.service_listings.length} Service{helper.service_listings.length !== 1 ? "s" : ""}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {helper.service_listings.slice(0, 3).map((listing, idx) => (
                                                            listing.service_types && listing.service_types.length > 0 ? (
                                                                listing.service_types.slice(0, 1).map((st, stIdx) => (
                                                                    <span key={`${idx}-${stIdx}`} className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full font-semibold capitalize">
                                                                        {st?.service_type?.replace("_", " ") || "Service"}
                                                                    </span>
                                                                ))
                                                            ) : null
                                                        ))}
                                                        {helper.service_listings.length > 3 && (
                                                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-semibold">
                                                                +{helper.service_listings.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {!isBusiness && helper.verification_status === "verified" && (
                                                <span className="inline-block mt-2 bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-semibold">✓ Verified</span>
                                            )}
                                            {isBusiness && (
                                                <span className="inline-block mt-2 bg-primary-100 text-primary-800 text-xs px-3 py-1 rounded-full font-semibold">🏢 Agency</span>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {helpers.links && Array.isArray(helpers.links) && helpers.links.length > 0 && (
                            <div className="mt-12">
                                {/* Results Info */}
                                {helpers.meta && (helpers.meta.total !== undefined || helpers.total !== undefined) && (
                                    <div className="text-center mb-6 text-gray-600">
                                        <p className="text-sm">
                                            Showing {helpers.meta?.from || helpers.from || 0} to {helpers.meta?.to || helpers.to || 0} of {helpers.meta?.total || helpers.total || 0} results
                                        </p>
                                    </div>
                                )}
                                <div className="flex justify-center">
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {helpers.links.map((link, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handlePageChange(link.url)}
                                                disabled={!link.url || link.active}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                                                    link.active
                                                        ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg cursor-default"
                                                        : "bg-white text-gray-700 hover:bg-gray-100 shadow-md"
                                                } ${!link.url ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-xl">
                        <div className="text-6xl mb-4">🔍</div>
                        <p className="text-gray-600 text-xl mb-6">No helpers found</p>
                        <p className="text-gray-500 mb-8">Try adjusting your filters to find helpers</p>
                        <button
                            onClick={() => {
                                setServiceType("");
                                setLocationId("");
                                setLocationDisplay("");
                                setLocationFilterQuery("");
                                setUserType("all");
                                setSortBy("rating");
                                setCurrentPage(1);
                                handleFilter();
                            }}
                            className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg font-semibold"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
