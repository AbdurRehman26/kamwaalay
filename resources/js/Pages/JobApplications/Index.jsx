import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "@/Layouts/PublicLayout";
import api from "@/services/api";
import { jobApplicationsService } from "@/services/jobApplications";
import { route } from "@/utils/routes";

export default function JobApplicationsIndex() {
    const [bookings, setBookings] = useState({ data: [], links: [], meta: {} });
    const [filters, setFilters] = useState({});
    const [loading, setLoading] = useState(true);
    const [serviceType, setServiceType] = useState("");
    const [locationId, setLocationId] = useState("");
    const [locationDisplay, setLocationDisplay] = useState("");
    const [locationFilterQuery, setLocationFilterQuery] = useState("");
    const [locationFilterSuggestions, setLocationFilterSuggestions] = useState([]);
    const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
    const locationFilterRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    const serviceTypes = [
        { value: "", label: "All Services" },
        { value: "maid", label: "Maid" },
        { value: "cook", label: "Cook" },
        { value: "babysitter", label: "Babysitter" },
        { value: "caregiver", label: "Caregiver" },
        { value: "cleaner", label: "Cleaner" },
        { value: "all_rounder", label: "All Rounder" },
    ];

    // Fetch location suggestions for filter
    useEffect(() => {
        if (locationFilterQuery.length >= 2) {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            searchTimeoutRef.current = setTimeout(() => {
                api
                    .get("/locations/search", {
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
            location_id: locationId || undefined,
        };
        
        // Remove undefined values
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
        
        setLoading(true);
        jobApplicationsService.getApplications(params)
            .then((data) => {
                setBookings(data.bookings || { data: [], links: [], meta: {} });
                setFilters(data.filters || {});
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching bookings:", error);
                setLoading(false);
            });
    }, [serviceType, locationId]);

    const handleFilter = () => {
        // Filters are applied via useEffect above
    };

    return (
        <PublicLayout>
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
                <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-600 text-white py-10 shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h1 className="text-3xl font-bold mb-2">Browse Service Requests</h1>
                        <p className="text-base text-white/90">Find service requests from users and apply</p>
                    </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                        <p className="text-xs text-yellow-700">
                            <strong>Note:</strong> We are currently serving Karachi only.
                        </p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
                        <h2 className="text-lg font-bold mb-4 text-gray-900">Filter Requests</h2>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-2">Service Type</label>
                                <select
                                    value={serviceType}
                                    onChange={(e) => setServiceType(e.target.value)}
                                    className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500 py-2 px-3 shadow-sm text-sm"
                                >
                                    {serviceTypes.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="relative" ref={locationFilterRef}>
                                <label className="block text-xs font-medium text-gray-700 mb-2">Location</label>
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
                                    className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500 py-2 px-3 shadow-sm text-sm"
                                    placeholder="Search location..."
                                />
                                {showLocationSuggestions && locationFilterSuggestions.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                                        {locationFilterSuggestions.map((suggestion, index) => (
                                            <div
                                                key={index}
                                                onClick={() => handleLocationSelect(suggestion)}
                                                className="px-3 py-2 hover:bg-primary-50 cursor-pointer border-b border-gray-100 last:border-b-0 text-sm"
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
                                    className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2.5 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-md hover:shadow-lg font-semibold text-sm"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bookings Grid */}
                    {loading ? (
                        <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-100">
                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mb-3"></div>
                            <p className="text-gray-600 text-sm">Loading job requests...</p>
                        </div>
                    ) : bookings.data && bookings.data.length > 0 ? (
                        <>
                            <div className="mb-4">
                                <p className="text-sm text-gray-600">
                                    Found {bookings.meta?.total || bookings.data.length} {bookings.meta?.total === 1 ? 'request' : 'requests'}
                                </p>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {bookings.data.map((booking) => (
                                    <div key={booking.id} className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 flex flex-col">
                                        <div className="p-5 flex flex-col flex-grow">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="bg-primary-100 text-primary-800 text-xs px-2.5 py-1 rounded-full font-semibold capitalize">
                                                    {booking.service_type?.replace("_", " ") || "N/A"}
                                                </span>
                                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-1 rounded-full font-semibold">
                                                    {booking.status || "N/A"}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold mb-2 text-gray-900">{booking.user?.name}</h3>
                                            <div className="space-y-1.5 mb-3">
                                                <p className="text-gray-600 capitalize text-xs flex items-center gap-1">
                                                    <span className="text-primary-600">📍</span>
                                                    {booking.work_type?.replace("_", " ") || "N/A"} • {booking.city || "N/A"}, {booking.area || "N/A"}
                                                </p>
                                                {booking.start_date && (
                                                    <p className="text-gray-500 text-xs flex items-center gap-1">
                                                        <span>📅</span>
                                                        Start: {booking.start_date}
                                                    </p>
                                                )}
                                            </div>
                                            {booking.special_requirements && (
                                                <div className="mb-3 p-2.5 bg-gray-50 rounded-lg border-l-4 border-primary-500">
                                                    <p className="text-gray-700 text-xs line-clamp-2">
                                                        {booking.special_requirements}
                                                    </p>
                                                </div>
                                            )}
                                            <div className="mt-auto pt-4">
                                                <Link
                                                    to={route("job-applications.create", booking.id)}
                                                    className="block w-full text-center bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2.5 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-md hover:shadow-lg font-semibold text-sm"
                                                >
                                                    Apply Now
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {bookings.links && bookings.links.length > 3 && (
                                <div className="mt-8 flex justify-center">
                                    <div className="flex space-x-2 bg-white p-3 rounded-xl shadow-md border border-gray-100">
                                        {bookings.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                to={link.url || "#"}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all duration-300 ${
                                                    link.active
                                                        ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md transform scale-105"
                                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-sm"
                                                } ${!link.url && "cursor-not-allowed opacity-50 pointer-events-none"}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-100">
                            <div className="text-5xl mb-4">🔍</div>
                            <p className="text-gray-700 font-medium mb-1 text-base">No service requests found</p>
                            <p className="text-gray-600 text-sm mb-4">Try adjusting your filters</p>
                        </div>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}

