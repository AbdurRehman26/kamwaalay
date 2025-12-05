import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import PublicLayout from "@/Layouts/PublicLayout";
import api from "@/services/api";
import { jobApplicationsService } from "@/services/jobApplications";
import { route } from "@/utils/routes";
import { useAuth } from "@/contexts/AuthContext";

export default function JobApplicationsIndex() {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
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
                setBookings(data.job_posts || data.bookings || { data: [], links: [], meta: {} });
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
            
            <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-orange-500 text-white py-16">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Browse Service Requests</h1>
                    <p className="text-xl text-white/90">Find service requests from users and apply</p>
                </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
                    <p className="text-sm text-yellow-700">
                        <strong>Note:</strong> We are currently serving Karachi only.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900">Filter Requests</h2>
                    <div className="grid md:grid-cols-3 gap-6">
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

                {/* Bookings Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600">Loading job requests...</p>
                    </div>
                ) : bookings.data && bookings.data.length > 0 ? (
                    <>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {bookings.data.map((job) => {
                                if (!job.id) {
                                    return null;
                                }

                                const workTypeLabels = {
                                    "full_time": "Full Time",
                                    "part_time": "Part Time"
                                };

                                const statusColors = {
                                    "pending": "bg-yellow-100 text-yellow-800",
                                    "confirmed": "bg-green-100 text-green-800",
                                    "in_progress": "bg-blue-100 text-blue-800",
                                    "completed": "bg-gray-100 text-gray-800",
                                    "cancelled": "bg-red-100 text-red-800"
                                };

                                const handleCardClick = (e) => {
                                    // If guest, redirect to login
                                    if (!isAuthenticated) {
                                        e.preventDefault();
                                        navigate(route("login"));
                                        return;
                                    }
                                    // If already applied, go to application detail
                                    if (job.has_applied && job.application_id) {
                                        navigate(route("job-applications.show", job.application_id));
                                        return;
                                    }
                                    // Otherwise, go to apply page
                                    navigate(route("job-applications.create", job.id));
                                };

                                return (
                                    <div
                                        key={job.id}
                                        onClick={handleCardClick}
                                        className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 hover:border-primary-300 cursor-pointer"
                                    >
                                        {/* Header with gradient */}
                                        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
                                            <div className="flex items-center justify-between">
                                                <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full font-semibold capitalize backdrop-blur-sm">
                                                    {job.service_type?.replace("_", " ") || "Service Request"}
                                                </span>
                                                <span className={`text-xs px-3 py-1 rounded-full font-semibold capitalize ${statusColors[job.status] || "bg-gray-100 text-gray-800"}`}>
                                                    {job.status || "Pending"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Already Applied Badge */}
                                        {isAuthenticated && job.has_applied && (
                                            <div className="bg-green-50 border-l-4 border-green-500 px-6 py-3">
                                                <div className="flex items-center">
                                                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="text-sm font-semibold text-green-800">You have already applied for this job</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="p-6">
                                            {/* Customer Info */}
                                            <div className="flex items-center mb-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
                                                    {job.user?.name?.charAt(0)?.toUpperCase() || job.name?.charAt(0)?.toUpperCase() || "C"}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900">{job.user?.name || job.name || "Customer"}</h3>
                                                    {job.created_at && (
                                                        <p className="text-xs text-gray-500">
                                                            Posted {new Date(job.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Work Type */}
                                            {job.work_type && (
                                                <div className="mb-4">
                                                    <span className="inline-flex items-center bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-lg font-medium">
                                                        <span className="mr-2">💼</span>
                                                        {workTypeLabels[job.work_type] || job.work_type}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Location */}
                                            {(job.city || job.area) && (
                                                <div className="flex items-start mb-4">
                                                    <span className="text-gray-400 mr-2 mt-0.5">📍</span>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {job.city || "N/A"}
                                                            {job.area && `, ${job.area}`}
                                                        </p>
                                                        {job.address && (
                                                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{job.address}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Date & Time */}
                                            <div className="space-y-2 mb-4">
                                                {job.start_date && (
                                                    <div className="flex items-center text-sm text-gray-700">
                                                        <span className="text-gray-400 mr-2">📅</span>
                                                        <span className="font-medium">
                                                            {new Date(job.start_date).toLocaleDateString("en-US", {
                                                                weekday: "short",
                                                                year: "numeric",
                                                                month: "short",
                                                                day: "numeric"
                                                            })}
                                                        </span>
                                                    </div>
                                                )}
                                                {job.start_time && (
                                                    <div className="flex items-center text-sm text-gray-700">
                                                        <span className="text-gray-400 mr-2">🕐</span>
                                                        <span className="font-medium">
                                                            {new Date(job.start_time).toLocaleTimeString("en-US", {
                                                                hour: "numeric",
                                                                minute: "2-digit",
                                                                hour12: true
                                                            })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Special Requirements */}
                                            {job.special_requirements && (
                                                <div className="mb-4 p-3 bg-gray-50 rounded-lg border-l-4 border-primary-500">
                                                    <p className="text-xs font-semibold text-gray-700 mb-1">Special Requirements:</p>
                                                    <p className="text-sm text-gray-600 line-clamp-2">{job.special_requirements}</p>
                                                </div>
                                            )}

                                            {/* Applications Count */}
                                            {job.job_applications && (
                                                <div className="mb-4 flex items-center text-sm text-gray-600">
                                                    <span className="mr-2">👥</span>
                                                    <span>
                                                        {job.job_applications.length || 0} {job.job_applications.length === 1 ? "application" : "applications"}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Action Button */}
                                            <div className="pt-4 border-t border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <span className={`font-semibold text-sm ${isAuthenticated && job.has_applied ? "text-green-600 group-hover:text-green-700" : "text-primary-600 group-hover:text-primary-700"}`}>
                                                        {!isAuthenticated ? "Login to Apply" : (job.has_applied ? "View Application" : "Apply Now")}
                                                    </span>
                                                    <span className={`group-hover:translate-x-1 transition-transform ${isAuthenticated && job.has_applied ? "text-green-600" : "text-primary-600"}`}>
                                                        →
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {bookings.links && bookings.links.length > 3 && (
                            <div className="mt-12 flex justify-center">
                                <div className="flex space-x-2">
                                    {bookings.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            to={link.url || "#"}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                                                link.active
                                                    ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg"
                                                    : "bg-white text-gray-700 hover:bg-gray-100 shadow-md"
                                            } ${!link.url && "cursor-not-allowed opacity-50"}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-xl">
                        <div className="text-6xl mb-4">🔍</div>
                        <p className="text-gray-600 text-xl mb-6">No service requests found</p>
                        <p className="text-gray-500 mb-8">Try adjusting your filters</p>
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}

