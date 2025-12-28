import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import PublicLayout from "@/Layouts/PublicLayout";
import axios from "axios";
import { helpersService } from "@/services/helpers";
import { jobPostsService } from "@/services/jobPosts";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";
import ChatPopup from "@/Components/ChatPopup";
import { useServiceTypes } from "@/hooks/useServiceTypes";

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
    const [cityId, setCityId] = useState(filters?.city_id || "");
    const [cities, setCities] = useState([]);

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
    const [chatOpen, setChatOpen] = useState(false);
    const [selectedHelper, setSelectedHelper] = useState(null);

    // Format phone number for WhatsApp
    const formatPhoneForWhatsApp = (phone) => {
        if (!phone) return "";
        const trimmed = phone.trim();
        if (trimmed.startsWith("+92") || trimmed.startsWith("+ 92")) {
            return trimmed.replace(/\D/g, "");
        }
        let cleaned = phone.replace(/\D/g, "");
        if (cleaned.startsWith("0")) {
            cleaned = "92" + cleaned.substring(1);
        } else if (!cleaned.startsWith("92")) {
            cleaned = "92" + cleaned;
        }
        return cleaned;
    };

    // Get city name for display
    const getCityName = (helper) => {
        let cityName = "";

        // Check helper.city first (new field)
        if (helper.city) {
            // detailed city object or string content
            cityName = typeof helper.city === "object" ? helper.city.name : helper.city;
        }
        // Fallback: Get city from service_listings location_details
        else if (helper.service_listings && helper.service_listings.length > 0) {
            const firstListing = helper.service_listings[0];
            if (firstListing.location_details && firstListing.location_details.length > 0) {
                cityName = firstListing.location_details[0].city_name;
            }
        }

        return cityName || null;
    };

    // Fetch service types from API
    const { serviceTypes: fetchedServiceTypes } = useServiceTypes();
    const serviceTypes = [
        { value: "", label: "All Services" },
        ...fetchedServiceTypes,
    ];

    // Fetch cities on mount
    useEffect(() => {
        axios.get("/api/cities")
            .then((response) => {
                setCities(response.data.cities || response.data || []);
            })
            .catch((error) => {
                console.error("Error fetching cities:", error);
            });
    }, []);

    // Read URL params on mount to persist filters
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const urlCityId = urlParams.get("city_id");
        const urlServiceType = urlParams.get("service_type");
        const urlLatitude = urlParams.get("latitude");
        const urlLongitude = urlParams.get("longitude");
        const urlSortBy = urlParams.get("sort_by");
        const urlUserType = urlParams.get("user_type");

        if (urlCityId) setCityId(urlCityId);
        if (urlServiceType) setServiceType(urlServiceType);
        if (urlLatitude && urlLongitude) {
            setLatitude(urlLatitude);
            setLongitude(urlLongitude);
            setLocationDisplay("Near Me");
            setLocationFilterQuery("Near Me");
        }
        if (urlSortBy) setSortBy(urlSortBy);
        if (urlUserType) setUserType(urlUserType);
    }, []);

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
        // Skip if the query is "Near Me" - that's handled by geolocation
        if (locationFilterQuery === "Near Me") {
            setLocationFilterSuggestions([]);
            setShowLocationSuggestions(false);
            return;
        }
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

    const [latitude, setLatitude] = useState(filters?.latitude || "");
    const [longitude, setLongitude] = useState(filters?.longitude || "");

    const handleNearMe = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setLatitude(latitude);
                    setLongitude(longitude);
                    setLocationId("");
                    setLocationDisplay("Near Me");
                    setLocationFilterQuery("Near Me");

                    // Directly trigger filter
                    const params = {
                        service_type: serviceType || undefined,
                        latitude: latitude,
                        longitude: longitude,
                        sort_by: sortBy,
                        user_type: userType,
                        page: 1,
                    };

                    // Update URL
                    const urlParams = new URLSearchParams();
                    if (serviceType) urlParams.append("service_type", serviceType);
                    urlParams.append("latitude", latitude);
                    urlParams.append("longitude", longitude);
                    if (sortBy) urlParams.append("sort_by", sortBy);
                    if (userType) urlParams.append("user_type", userType);
                    window.history.pushState({}, "", `${route("helpers.index")}?${urlParams.toString()}`);

                    // Trigger fetch (via useEffect dependency, or setFilters manually if useEffect depends on props/url only? 
                    // Actually useEffect depends on states, so setting states above will trigger it)
                },
                (error) => {
                    console.error("Error getting location:", error);
                    alert("Unable to retrieve your location. Please ensure location services are enabled.");
                }
            );
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    };

    // Handle location selection - reset near me coords
    const handleLocationSelect = (location) => {
        setLocationId(location.id || "");
        setLocationDisplay(location.display_text);
        setLocationFilterQuery(location.display_text);
        setLatitude("");
        setLongitude("");
        setShowLocationSuggestions(false);
    };

    // Fetch helpers from API
    useEffect(() => {
        const params = {
            service_type: serviceType || undefined,
            location_id: locationId || undefined,
            city_id: cityId || undefined,
            latitude: latitude || undefined,
            longitude: longitude || undefined,
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
                console.log("Helpers pagination data:", {
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
    }, [serviceType, locationId, cityId, latitude, longitude, sortBy, userType, currentPage]);

    const handleFilter = () => {
        // Reset to first page when filters change
        setCurrentPage(1);
        // Just update URL without navigation
        const params = new URLSearchParams();
        if (serviceType) params.append("service_type", serviceType);
        if (cityId) params.append("city_id", cityId);

        // Prioritize location_id if selected, or lat/lng if near me
        if (locationId) {
            params.append("location_id", locationId);
        } else if (latitude && longitude) {
            params.append("latitude", latitude);
            params.append("longitude", longitude);
        }

        if (sortBy) params.append("sort_by", sortBy);
        if (userType) params.append("user_type", userType);
        window.history.pushState({}, "", `${route("helpers.index")}?${params.toString()}`);
    };

    const handlePageChange = (url) => {
        if (!url) return;

        // Extract page number from URL
        const urlObj = new URL(url, window.location.origin);
        const page = urlObj.searchParams.get("page") || 1;
        setCurrentPage(parseInt(page));

        // Scroll to top of results
        window.scrollTo({ top: 0, behavior: "smooth" });
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
            await jobPostsService.createBooking(formData);
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

            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 text-white overflow-hidden">
                {/* Abstract Background Shapes */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                    <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-2000"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 relative z-10 w-full">
                    <div className="max-w-3xl">
                        <h2 className="text-indigo-300 dark:text-indigo-400 font-bold tracking-wide uppercase text-sm mb-3">Browse Helpers</h2>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">Find Your Perfect Helper</h1>
                        <p className="text-xl text-indigo-100/90 dark:text-indigo-200/90 leading-relaxed">
                            Browse through verified domestic helpers ready to help you today.
                        </p>
                    </div>
                </div>
            </section>



            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Filter Helpers</h2>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Type</label>
                            <select
                                value={userType}
                                onChange={(e) => {
                                    const newUserType = e.target.value;
                                    setUserType(newUserType);
                                    // Update URL immediately
                                    const urlParams = new URLSearchParams(window.location.search);
                                    if (newUserType && newUserType !== "all") {
                                        urlParams.set("user_type", newUserType);
                                    } else {
                                        urlParams.delete("user_type");
                                    }
                                    window.history.pushState({}, "", `${route("helpers.index")}${urlParams.toString() ? "?" + urlParams.toString() : ""}`);
                                }}
                                className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-primary-500 py-3 px-4 shadow-sm"
                            >
                                <option value="all">All</option>
                                <option value="helper">Helpers Only</option>
                                <option value="business">Businesses Only</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Service Type</label>
                            <select
                                value={serviceType}
                                onChange={(e) => {
                                    const newServiceType = e.target.value;
                                    setServiceType(newServiceType);
                                    // Update URL immediately
                                    const urlParams = new URLSearchParams(window.location.search);
                                    if (newServiceType) {
                                        urlParams.set("service_type", newServiceType);
                                    } else {
                                        urlParams.delete("service_type");
                                    }
                                    window.history.pushState({}, "", `${route("helpers.index")}${urlParams.toString() ? "?" + urlParams.toString() : ""}`);
                                }}
                                className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-primary-500 py-3 px-4 shadow-sm"
                            >
                                {serviceTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">City</label>
                            <select
                                value={cityId}
                                onChange={(e) => {
                                    const newCityId = e.target.value;
                                    setCityId(newCityId);
                                    // Update URL immediately
                                    const urlParams = new URLSearchParams(window.location.search);
                                    if (newCityId) {
                                        urlParams.set("city_id", newCityId);
                                    } else {
                                        urlParams.delete("city_id");
                                    }
                                    window.history.pushState({}, "", `${route("helpers.index")}${urlParams.toString() ? "?" + urlParams.toString() : ""}`);
                                }}
                                className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-primary-500 py-3 px-4 shadow-sm"
                            >
                                <option value="">All Cities</option>
                                {cities.map((city) => (
                                    <option key={city.id} value={city.id}>
                                        {city.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {/* Near Me & Clear Filters - rightmost column, each button half width */}
                        <div className="flex items-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    // Toggle behavior: if already using near me, clear it
                                    if (latitude && longitude && locationDisplay === "Near Me") {
                                        setLatitude("");
                                        setLongitude("");
                                        setLocationDisplay("");
                                        setLocationFilterQuery("");
                                        // Update URL to remove lat/lng
                                        const urlParams = new URLSearchParams(window.location.search);
                                        urlParams.delete("latitude");
                                        urlParams.delete("longitude");
                                        window.history.pushState({}, "", `${route("helpers.index")}${urlParams.toString() ? "?" + urlParams.toString() : ""}`);
                                    } else {
                                        handleNearMe();
                                    }
                                }}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-lg font-medium transition-colors ${latitude && longitude && locationDisplay === "Near Me"
                                    ? "bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700"
                                    : "bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-600"
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                </svg>
                                <span>Near Me</span>
                            </button>
                            {(cityId || serviceType || (latitude && longitude)) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        // Clear all filters
                                        setCityId("");
                                        setServiceType("");
                                        setLatitude("");
                                        setLongitude("");
                                        setLocationDisplay("");
                                        setLocationFilterQuery("");
                                        setCurrentPage(1);
                                        // Clear URL
                                        window.history.pushState({}, "", route("helpers.index"));
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 font-medium transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    <span>Clear</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Booking Form */}
                {showBookingForm && user && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-12">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Create Job Posting</h2>
                        <form onSubmit={handleBookingSubmit}>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service Type *</label>
                                    <select
                                        value={formData.service_type}
                                        onChange={(e) => setFormData(prev => ({ ...prev, service_type: e.target.value }))}
                                        className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-primary-500"
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
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Work Type *</label>
                                    <select
                                        value={formData.work_type}
                                        onChange={(e) => setFormData(prev => ({ ...prev, work_type: e.target.value }))}
                                        className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                        required
                                    >
                                        <option value="">Select Type</option>
                                        <option value="full_time">Full Time</option>
                                        <option value="part_time">Part Time</option>
                                    </select>
                                    {formErrors.work_type && <div className="text-red-500 text-sm mt-1">{formErrors.work_type}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City *</label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        disabled
                                        className="w-full border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-gray-300 cursor-not-allowed"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Currently serving Karachi only</p>
                                    {formErrors.city && <div className="text-red-500 text-sm mt-1">{formErrors.city}</div>}
                                </div>

                                <div className="relative" ref={suggestionsRef}>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Area *</label>
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
                                        className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                        placeholder="Type to search area..."
                                        required
                                    />
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                                            {suggestions.map((suggestion, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => handleAreaSelect(suggestion)}
                                                    className="px-4 py-2 hover:bg-primary-50 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0 text-gray-900 dark:text-gray-200"
                                                >
                                                    {suggestion}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {formErrors.area && <div className="text-red-500 text-sm mt-1">{formErrors.area}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                                        className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                    />
                                    {formErrors.start_date && <div className="text-red-500 dark:text-red-400 text-sm mt-1">{formErrors.start_date}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Time</label>
                                    <input
                                        type="time"
                                        value={formData.start_time}
                                        onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                                        className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                    />
                                    {formErrors.start_time && <div className="text-red-500 dark:text-red-400 text-sm mt-1">{formErrors.start_time}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                        required
                                    />
                                    {formErrors.name && <div className="text-red-500 dark:text-red-400 text-sm mt-1">{formErrors.name}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone *</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                        required
                                    />
                                    {formErrors.phone && <div className="text-red-500 dark:text-red-400 text-sm mt-1">{formErrors.phone}</div>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                        required
                                    />
                                    {formErrors.email && <div className="text-red-500 dark:text-red-400 text-sm mt-1">{formErrors.email}</div>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                        rows={3}
                                        className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                    />
                                    {formErrors.address && <div className="text-red-500 dark:text-red-400 text-sm mt-1">{formErrors.address}</div>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Special Requirements</label>
                                    <textarea
                                        value={formData.special_requirements}
                                        onChange={(e) => setFormData(prev => ({ ...prev, special_requirements: e.target.value }))}
                                        rows={4}
                                        className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                        placeholder="Any special requirements or preferences..."
                                    />
                                    {formErrors.special_requirements && <div className="text-red-500 dark:text-red-400 text-sm mt-1">{formErrors.special_requirements}</div>}
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
                                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-300 font-semibold"
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
                        <p className="text-gray-600 dark:text-gray-400">Loading helpers...</p>
                    </div>
                ) : helpers.data && helpers.data.length > 0 ? (
                    <>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {helpers.data.map((helper) => {
                                const isBusiness = helper.role === "business";
                                if (!helper.id) {
                                    console.warn("Helper missing id:", helper);
                                    return null;
                                }
                                const profileRoute = isBusiness ? route("businesses.show", helper.id) : route("helpers.show", helper.id);

                                // Get all unique service types from service listings
                                let allServiceTypes = [];
                                if (isBusiness && helper.helpers) {
                                    // Aggregate services from all workers
                                    allServiceTypes = helper.helpers.flatMap(worker =>
                                        worker.service_listings?.flatMap(listing =>
                                            listing.service_types?.map(st => {
                                                const serviceType = typeof st === "string" ? st : st?.service_type;
                                                return serviceType?.replace(/_/g, " ") || null;
                                            }) || []
                                        ) || []
                                    ).filter(Boolean);
                                } else {
                                    // Helper's own services
                                    allServiceTypes = helper.service_listings?.flatMap(listing =>
                                        listing.service_types?.map(st => {
                                            const serviceType = typeof st === "string" ? st : st?.service_type;
                                            return serviceType?.replace(/_/g, " ") || null;
                                        }) || []
                                    ).filter(Boolean) || [];
                                }
                                const uniqueServiceTypes = [...new Set(allServiceTypes)];
                                const primaryServiceType = uniqueServiceTypes[0] || "Helper";

                                // Get all unique locations from service listings
                                const allLocations = helper.service_listings?.flatMap(listing =>
                                    listing.location_details || []
                                ).filter(Boolean) || [];
                                // Create unique locations based on display_text
                                const uniqueLocations = Array.from(
                                    new Map(allLocations.map(loc => [loc.display_text, loc])).values()
                                );
                                const primaryLocation = uniqueLocations[0];

                                return (
                                    <div
                                        key={helper.id}
                                        onClick={() => navigate(profileRoute)}
                                        className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                                    >
                                        <div className="h-40 relative bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                            {isBusiness ? (
                                                <div className="w-full h-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20">
                                                    <span className="text-6xl text-indigo-300 dark:text-indigo-600">🏢</span>
                                                </div>
                                            ) : helper.photo ? (
                                                <img
                                                    src={`/storage/${helper.photo}`}
                                                    alt={helper.name}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20">
                                                    <span className="text-6xl text-indigo-300 dark:text-indigo-600">👤</span>
                                                </div>
                                            )}
                                            {/* Rating Badge */}
                                            {helper.rating && parseFloat(helper.rating) > 0 && (
                                                <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                                    <span className="text-yellow-500 text-sm">⭐</span>
                                                    <span className="font-bold text-gray-900 dark:text-white text-sm">{parseFloat(helper.rating).toFixed(1)}</span>
                                                </div>
                                            )}
                                            {/* Verification Badge */}
                                            {!isBusiness && helper.verification_status === "verified" && (
                                                <div className="absolute top-4 left-4 bg-green-500 text-white rounded-full px-2 py-1 flex items-center gap-1 shadow-sm">
                                                    <span className="text-xs">✓</span>
                                                    <span className="text-xs font-semibold">Verified</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-5 relative">

                                            <div className="mb-4">
                                                <h3 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {helper.name}
                                                </h3>
                                                {helper.business && (
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                                                            Agency
                                                        </span>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            By <span className="font-medium text-gray-900 dark:text-white">{helper.business.name}</span>
                                                        </p>
                                                    </div>
                                                )}
                                                {isBusiness && helper.helpers && (
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                                                            {helper.helpers.length} Workers
                                                        </span>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            Registered
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Services */}
                                            {uniqueServiceTypes.length > 0 && (
                                                <div className="mb-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {uniqueServiceTypes.slice(0, 2).map((type, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold uppercase tracking-wide"
                                                            >
                                                                {type}
                                                            </span>
                                                        ))}
                                                        {uniqueServiceTypes.length > 2 && (
                                                            <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-semibold">
                                                                +{uniqueServiceTypes.length - 2} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {/* Locations */}
                                            {(helper.city || helper.address || uniqueLocations.length > 0) ? (
                                                <div className="mb-6">
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-gray-500 dark:text-gray-400 mt-0.5">📍</span>
                                                        <div className="flex flex-wrap gap-1.5 flex-1">
                                                            {/* Display direct address if available */}
                                                            {(helper.address) ? (
                                                                <span
                                                                    className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-md"
                                                                >
                                                                    {helper.address}
                                                                </span>
                                                            ) : (
                                                                // Fallback to service listing locations
                                                                <>
                                                                    {uniqueLocations.slice(0, 2).map((location, idx) => (
                                                                        <span
                                                                            key={idx}
                                                                            className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-md"
                                                                            title={location.area || location.display_text}
                                                                        >
                                                                            {location.area || location.display_text}
                                                                        </span>
                                                                    ))}
                                                                    {uniqueLocations.length > 2 && (
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-md">
                                                                            +{uniqueLocations.length - 2} more
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-2 text-sm">
                                                    <span>📍</span> Location not specified
                                                </p>
                                            )}

                                            {/* Helper Details Grid */}
                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                {/* Left Column: Personal Info */}
                                                <div className="space-y-2">
                                                    {/* Age */}
                                                    {helper.age && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="text-gray-500 dark:text-gray-400 w-5 text-center">🎂</span>
                                                            <span className="text-gray-700 dark:text-gray-300 text-xs">{helper.age} years</span>
                                                        </div>
                                                    )}

                                                    {/* Gender */}
                                                    {helper.gender && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="text-gray-500 dark:text-gray-400 w-5 text-center">👤</span>
                                                            <span className="text-gray-700 dark:text-gray-300 capitalize text-xs">{helper.gender}</span>
                                                        </div>
                                                    )}

                                                    {/* Religion */}
                                                    {helper.religion && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="text-gray-500 dark:text-gray-400 w-5 text-center">🕌</span>
                                                            <span className="text-gray-700 dark:text-gray-300 capitalize text-xs">
                                                                {typeof helper.religion === "object"
                                                                    ? helper.religion.label
                                                                    : helper.religion.replace(/_/g, " ")}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right Column: Capabilities */}
                                                <div className="space-y-3">
                                                    {/* Languages */}
                                                    {helper.languages && helper.languages.length > 0 && (
                                                        <div>
                                                            <div className="flex items-center gap-1 mb-1.5">
                                                                <span className="text-gray-500 dark:text-gray-400 text-xs">💬 Languages</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {helper.languages.slice(0, 2).map((lang, idx) => (
                                                                    <span
                                                                        key={idx}
                                                                        className="text-[10px] text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-600"
                                                                    >
                                                                        {lang.name || lang}
                                                                    </span>
                                                                ))}
                                                                {helper.languages.length > 2 && (
                                                                    <span className="text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">+{helper.languages.length - 2}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Skills */}
                                                    {helper.skills && (
                                                        <div>
                                                            <div className="flex items-center gap-1 mb-1.5">
                                                                <span className="text-gray-500 dark:text-gray-400 text-xs">⚡ Skills</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {helper.skills.split(",").slice(0, 2).map((skill, idx) => (
                                                                    <span
                                                                        key={idx}
                                                                        className="text-[10px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800"
                                                                    >
                                                                        {skill.trim()}
                                                                    </span>
                                                                ))}
                                                                {helper.skills.split(",").length > 2 && (
                                                                    <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">+{helper.skills.split(",").length - 2}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Contact Options */}
                                            <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                                                {user ? (
                                                    helper.phone ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            {/* Call Button */}
                                                            <a
                                                                href={`tel:${helper.phone}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                                                title="Call"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                                </svg>
                                                            </a>

                                                            {/* WhatsApp Button */}
                                                            <a
                                                                href={`https://wa.me/${formatPhoneForWhatsApp(helper.phone)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="flex items-center justify-center w-10 h-10 bg-[#25D366] text-white rounded-lg hover:bg-[#20BA5A] transition-all duration-200 shadow-sm hover:shadow-md"
                                                                title="WhatsApp"
                                                            >
                                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                                </svg>
                                                            </a>

                                                            {/* Message Button */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setSelectedHelper(helper);
                                                                    setChatOpen(true);
                                                                }}
                                                                className="flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                                                title="Send Message"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    ) : null
                                                ) : (
                                                    <div className="text-center">
                                                        <Link
                                                            to={route("login")}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-sm font-medium transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                            Login to contact
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {helpers.links && Array.isArray(helpers.links) && helpers.links.length > 0 && (
                            <div className="mt-12">
                                {/* Results Info */}
                                {helpers.meta && (helpers.meta.total !== undefined || helpers.total !== undefined) && (
                                    <div className="text-center mb-6 text-gray-600 dark:text-gray-400">
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
                                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${link.active
                                                    ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg cursor-default"
                                                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-md"
                                                    } ${!link.url ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
                        <div className="text-6xl mb-4">🔍</div>
                        <p className="text-gray-600 dark:text-gray-300 text-xl mb-6">No helpers found</p>
                        <p className="text-gray-500 dark:text-gray-400 mb-8">Try adjusting your filters to find helpers</p>
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

            {/* Chat Popup */}
            {selectedHelper && (
                <ChatPopup
                    recipientId={selectedHelper.id}
                    recipientName={selectedHelper.name}
                    recipientPhoto={selectedHelper.photo}
                    isOpen={chatOpen}
                    onClose={() => {
                        setChatOpen(false);
                        setSelectedHelper(null);
                    }}
                />
            )}
        </PublicLayout>
    );
}
