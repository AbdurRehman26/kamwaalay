import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import PublicLayout from "@/Layouts/PublicLayout";
import axios from "axios";
import { bookingsService } from "@/services/bookings";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";

export default function ServiceRequestsBrowse() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState({ data: [], links: [], meta: {} });
    const [filters, setFilters] = useState({});
    const [loading, setLoading] = useState(true);
    const [serviceType, setServiceType] = useState("");
    const [workType, setWorkType] = useState("");
    const [locationId, setLocationId] = useState("");
    const [locationDisplay, setLocationDisplay] = useState("");
    const [locationFilterQuery, setLocationFilterQuery] = useState("");
    const [locationFilterSuggestions, setLocationFilterSuggestions] = useState([]);
    const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
    const locationFilterRef = useRef(null);
    const searchTimeoutRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);

    const serviceTypes = [
        { value: "", label: "All Services" },
        { value: "maid", label: "Maid" },
        { value: "cook", label: "Cook" },
        { value: "babysitter", label: "Babysitter" },
        { value: "caregiver", label: "Caregiver" },
        { value: "cleaner", label: "Cleaner" },
        { value: "all_rounder", label: "All Rounder" },
    ];

    const workTypes = [
        { value: "", label: "All Types" },
        { value: "full_time", label: "Full Time" },
        { value: "part_time", label: "Part Time" },
    ];

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

    // Handle outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
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

    // Fetch bookings from API
    useEffect(() => {
        const params = {
            service_type: serviceType || undefined,
            work_type: workType || undefined,
            location_id: locationId || undefined,
            page: currentPage,
        };

        // Remove undefined values
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

        setLoading(true);
        bookingsService.browseBookings(params)
            .then((data) => {
                // Handle pagination response structure
                const bookingsData = data.job_posts || data.bookings || {};
                // Ensure links is always an array
                const bookingsWithArrayLinks = {
                    ...bookingsData,
                    data: bookingsData.data || [],
                    links: Array.isArray(bookingsData.links) ? bookingsData.links : [],
                    meta: bookingsData.meta || {},
                    // Also support direct properties (Laravel pagination structure)
                    total: bookingsData.total || bookingsData.meta?.total,
                    from: bookingsData.from || bookingsData.meta?.from,
                    to: bookingsData.to || bookingsData.meta?.to,
                    current_page: bookingsData.current_page || bookingsData.meta?.current_page,
                    last_page: bookingsData.last_page || bookingsData.meta?.last_page,
                };
                setBookings(bookingsWithArrayLinks);
                setFilters(data.filters || {});
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching bookings:", error);
                setLoading(false);
            });
    }, [serviceType, workType, locationId, currentPage]);

    const handleFilter = () => {
        // Reset to first page when filters change
        setCurrentPage(1);
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

    const getStatusColor = (status) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "confirmed":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <PublicLayout>

            <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-orange-500 text-white py-16">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Search Jobs</h1>
                    <p className="text-xl text-white/90">Browse job opportunities posted by customers looking to hire helpers or businesses</p>
                </div>
            </div>

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
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">Filter Requests</h2>
                    <div className="grid md:grid-cols-5 gap-6">
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Work Type</label>
                            <select
                                value={workType}
                                onChange={(e) => setWorkType(e.target.value)}
                                className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500 py-3 px-4 shadow-sm"
                            >
                                {workTypes.map((type) => (
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
                        <div className="flex items-end">
                            <button
                                onClick={handleFilter}
                                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
                            >
                                Apply Filters
                            </button>
                        </div>
                        {(serviceType || workType || locationId) && (
                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        setServiceType("");
                                        setWorkType("");
                                        setLocationId("");
                                        setLocationDisplay("");
                                        setLocationFilterQuery("");
                                        setCurrentPage(1);
                                        handleFilter();
                                    }}
                                    className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-all duration-300 font-semibold"
                                >
                                    Clear
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Search Jobs Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600">Loading service requests...</p>
                    </div>
                ) : bookings.data && bookings.data.length > 0 ? (
                    <>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {bookings.data.map((booking) => {
                                const hasApplied = user && booking.job_applications &&
                                    booking.job_applications.some(app => app.user_id === user.id);
                                const isHelper = user && (user.role === "helper" || user.role === "business");

                                return (
                                    <div key={booking.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col">
                                        <div className="p-6 flex flex-col flex-grow">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="bg-primary-100 text-primary-800 text-xs px-3 py-1 rounded-full font-semibold capitalize">
                                                    {booking.service_type?.replace("_", " ") || "N/A"}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                                                    {booking.status?.replace("_", " ") || "N/A"}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold mb-2 text-gray-900">
                                                {booking.service_type_label || booking.service_type?.replace("_", " ") || "Service"} Service
                                            </h3>
                                            <p className="text-gray-600 mb-3 capitalize text-sm">
                                                {booking.work_type?.replace("_", " ") || "N/A"} • {booking.city || "N/A"}, {booking.area || "N/A"}
                                            </p>
                                            {booking.start_date && (
                                                <p className="text-gray-500 text-sm mb-2">
                                                    📅 Start Date: {new Date(booking.start_date).toLocaleDateString()}
                                                </p>
                                            )}
                                            {booking.special_requirements && (
                                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                                    💬 {booking.special_requirements}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                                                <span>👤 Posted by: {booking.user?.name || "Customer"}</span>
                                            </div>
                                            {booking.job_applications && booking.job_applications.length > 0 && (
                                                <p className="text-sm text-primary-600 mb-3">
                                                    📋 {booking.job_applications.length} application{booking.job_applications.length !== 1 ? "s" : ""} received
                                                </p>
                                            )}
                                            <div className="mt-auto">
                                                {isHelper ? (
                                                    hasApplied ? (
                                                        <Link
                                                            to={route("job-applications.my-applications")}
                                                            className="block w-full text-center bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold cursor-not-allowed"
                                                        >
                                                            Already Applied
                                                        </Link>
                                                    ) : (
                                                        <Link
                                                            to={route("job-applications.create", booking.id)}
                                                            className="block w-full text-center bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg font-semibold"
                                                        >
                                                            Apply Now
                                                        </Link>
                                                    )
                                                ) : (
                                                    <Link
                                                        to={route("service-requests.show", booking.id)}
                                                        className="block w-full text-center bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg font-semibold"
                                                    >
                                                        View Details
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {bookings.links && Array.isArray(bookings.links) && bookings.links.length > 0 && (
                            <div className="mt-12">
                                {/* Results Info */}
                                {bookings.meta && (bookings.meta.total !== undefined || bookings.total !== undefined) && (
                                    <div className="text-center mb-6 text-gray-600">
                                        <p className="text-sm">
                                            Showing {bookings.meta?.from || bookings.from || 0} to {bookings.meta?.to || bookings.to || 0} of {bookings.meta?.total || bookings.total || 0} results
                                        </p>
                                    </div>
                                )}
                                <div className="flex justify-center">
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {bookings.links.map((link, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handlePageChange(link.url)}
                                                disabled={!link.url || link.active}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${link.active
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
                        <p className="text-gray-600 text-xl mb-6">No jobs found</p>
                        <p className="text-gray-500 mb-8">Try adjusting your filters or check back later</p>
                        {user && (user.role === "user") && (
                            <Link
                                to={route("bookings.create")}
                                className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg font-semibold inline-block"
                            >
                                Create Job Posting
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}

