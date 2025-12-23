import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import PublicLayout from "@/Layouts/PublicLayout";
import api from "@/services/api";
import { jobApplicationsService } from "@/services/jobApplications";
import { route } from "@/utils/routes";
import { useAuth } from "@/contexts/AuthContext";
import { useServiceTypes } from "@/hooks/useServiceTypes";

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

    // Fetch service types from API
    const { serviceTypes: fetchedServiceTypes } = useServiceTypes();
    const serviceTypes = [
        { value: "", label: "All Services" },
        ...fetchedServiceTypes,
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
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 text-white overflow-hidden py-16 md:py-24">
                {/* Abstract Background Shapes */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Browse Jobs</h1>
                    <p className="text-xl text-indigo-100/90 max-w-2xl mx-auto leading-relaxed">
                        Discover job opportunities in your area and apply to provide your services.
                    </p>
                </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                        <span className="text-lg">📍</span>
                        <strong>Note:</strong> We are currently serving Karachi, Lahore, and Islamabad. More cities coming soon!
                    </p>
                </div>
            </div>

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">

                    {/* Filters */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-12 border border-white/20 dark:border-gray-700 relative z-20 -mt-16">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                            <span>🔍</span> Filter Requests
                        </h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service Type</label>
                                <select
                                    value={serviceType}
                                    onChange={(e) => setServiceType(e.target.value)}
                                    className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-indigo-500 py-3 px-4 shadow-sm transition-colors"
                                >
                                    {serviceTypes.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="relative" ref={locationFilterRef}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
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
                                    className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-indigo-500 py-3 px-4 shadow-sm transition-colors"
                                    placeholder="Search location..."
                                />
                                {showLocationSuggestions && locationFilterSuggestions.length > 0 && (
                                    <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-auto">
                                        {locationFilterSuggestions.map((suggestion, index) => (
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
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleFilter}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-indigo-500/30 font-bold"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bookings Grid */}
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : bookings.data && bookings.data.length > 0 ? (
                        <>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {bookings.data.map((job) => {
                                    if (!job.id) {
                                        return null;
                                    }

                                    const workTypeLabels = {
                                        "full_time": "Full Time",
                                        "part_time": "Part Time"
                                    };

                                    const statusColors = {
                                        "pending": "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
                                        "confirmed": "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
                                        "in_progress": "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
                                        "completed": "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300",
                                        "cancelled": "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                                    };

                                    const cityName = job.city_name || (job.city?.name) || (typeof job.city === "string" ? job.city : "") || "City not specified";

                                    const handleCardClick = (e) => {
                                        // Navigate to job detail page
                                        navigate(route("job-posts.show", job.id));
                                    };

                                    return (
                                        <div
                                            key={job.id}
                                            onClick={handleCardClick}
                                            className="group bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 cursor-pointer"
                                        >
                                            {/* Header with gradient */}
                                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
                                                        {job.service_type?.replace("_", " ") || "Service Request"}
                                                    </span>
                                                    <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${statusColors[job.status] || "bg-gray-100 text-gray-800"}`}>
                                                        {job.status || "Pending"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Already Applied Badge */}
                                            {isAuthenticated && job.has_applied && (
                                                <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 px-6 py-3">
                                                    <div className="flex items-center">
                                                        <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        <span className="text-sm font-semibold text-green-800 dark:text-green-300">Applied</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="p-6">
                                                {/* Customer Info */}
                                                <div className="flex items-center mb-6">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4 shadow-md">
                                                        {job.user?.name?.charAt(0)?.toUpperCase() || job.name?.charAt(0)?.toUpperCase() || "C"}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-1">{job.user?.name || job.name || "Customer"}</h3>
                                                        {job.created_at && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                Posted {new Date(job.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="space-y-3 mb-6">
                                                    {/* Work Type */}
                                                    {job.work_type && (
                                                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                                                            <span className="w-6 flex justify-center mr-2 text-indigo-500">💼</span>
                                                            <span className="inline-flex items-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs px-2 py-1 rounded font-medium">
                                                                {workTypeLabels[job.work_type] || job.work_type}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Estimated Salary */}
                                                    {job.estimated_salary && (
                                                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                                                            <span className="w-6 flex justify-center mr-2 text-indigo-500">💰</span>
                                                            <span className="font-medium">
                                                                Rs. {parseInt(job.estimated_salary).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Location */}
                                                    {(!!job.city || !!job.address) && (
                                                        <div className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                                            <span className="w-6 flex justify-center mr-2 text-indigo-500 mt-0.5">📍</span>
                                                            <div className="flex-1">
                                                                <span className="font-medium block">
                                                                    {cityName}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Date & Time */}
                                                    {job.start_date && (
                                                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                                                            <span className="w-6 flex justify-center mr-2 text-indigo-500">📅</span>
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
                                                </div>

                                                {/* Special Requirements */}
                                                {job.special_requirements && (
                                                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                                        <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-1">Special Requirements</p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 italic">"{job.special_requirements}"</p>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                        {job.job_applications?.length || 0} Applicants
                                                    </span>
                                                    <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-bold text-sm group-hover:underline">
                                                        {!isAuthenticated ? "Login to Apply" : (job.has_applied ? "View Application" : "Apply Now")}
                                                        <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {bookings.links && bookings.links.length > 3 && (
                                <div className="mt-16 flex justify-center">
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {bookings.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                to={link.url || "#"}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center min-w-[40px] ${link.active
                                                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                                                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-700"
                                                    } ${!link.url && "cursor-not-allowed opacity-50"}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
                            <div className="text-7xl mb-6 opacity-80">🔍</div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No service requests found</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                We couldn't find any job requests matching your filters. Try adjusting your search criteria.
                            </p>
                            <button
                                onClick={() => {
                                    setServiceType("");
                                    setLocationId("");
                                    setLocationDisplay("");
                                    setLocationFilterQuery("");
                                }}
                                className="mt-8 px-6 py-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 font-bold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                            >
                                Clear All Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}
