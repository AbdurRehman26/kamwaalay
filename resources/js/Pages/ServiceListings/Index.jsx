import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import PublicLayout from "@/Layouts/PublicLayout";
import { route } from "@/utils/routes";
import axios from "axios";
import { serviceListingsService } from "@/services/serviceListings";
import { useAuth } from "@/contexts/AuthContext";
import ChatPopup from "@/Components/ChatPopup";
import { useServiceTypes } from "@/hooks/useServiceTypes";

export default function ServiceListingsIndex() {
    const { user } = useAuth();
    const [listings, setListings] = useState({ data: [], links: [], meta: {} });
    const [filters, setFilters] = useState({});
    const [loading, setLoading] = useState(true);
    const [serviceType, setServiceType] = useState("");
    const [workType, setWorkType] = useState("");
    const [sortBy, setSortBy] = useState("created_at");
    const [locationId, setLocationId] = useState("");
    const [locationDisplay, setLocationDisplay] = useState("");
    const [locationFilterQuery, setLocationFilterQuery] = useState("");
    const [locationFilterSuggestions, setLocationFilterSuggestions] = useState([]);
    const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
    const locationFilterRef = useRef(null);
    const searchTimeoutRef = useRef(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [selectedRecipient, setSelectedRecipient] = useState(null);

    // Format phone number for WhatsApp (add +92 if needed)
    const formatPhoneForWhatsApp = (phone) => {
        if (!phone) return "";

        // Check if it starts with +92 (with or without spaces)
        const trimmed = phone.trim();
        if (trimmed.startsWith("+92") || trimmed.startsWith("+ 92")) {
            // Remove all non-digit characters, which will keep 92 at the start
            return trimmed.replace(/\D/g, "");
        }

        // Remove all non-digit characters
        let cleaned = phone.replace(/\D/g, "");

        // If starts with 0, replace with 92
        if (cleaned.startsWith("0")) {
            cleaned = "92" + cleaned.substring(1);
        }
        // If doesn't start with 92, add it
        else if (!cleaned.startsWith("92")) {
            cleaned = "92" + cleaned;
        }

        return cleaned;
    };

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

    // Fetch listings from API
    useEffect(() => {
        const params = {
            service_type: serviceType || undefined,
            work_type: workType || undefined,
            location_id: locationId || undefined,
            sort_by: sortBy,
        };

        // Remove undefined values
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

        setLoading(true);
        serviceListingsService.getListings(params)
            .then((data) => {
                setListings(data.listings || { data: [], links: [], meta: {} });
                setFilters(data.filters || {});
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching listings:", error);
                setLoading(false);
            });
    }, [serviceType, workType, locationId, sortBy]);

    const handleFilter = () => {
        // Filters are applied via useEffect above
    };

    return (
        <PublicLayout>
            <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-orange-500 dark:from-primary-800 dark:via-primary-900 dark:to-orange-700 text-white py-16">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Browse Services Offered</h1>
                    <p className="text-xl text-white/90">Find services offered by verified helpers and businesses</p>
                </div>
            </div>

            {/* Notice */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        <strong>Note:</strong> We are currently serving Karachi only. We will be going live in different cities soon!
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-12">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Filter Services</h2>
                    <div className="grid md:grid-cols-5 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Service Type</label>
                            <select
                                value={serviceType}
                                onChange={(e) => setServiceType(e.target.value)}
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Work Type</label>
                            <select
                                value={workType}
                                onChange={(e) => setWorkType(e.target.value)}
                                className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-primary-500 py-3 px-4 shadow-sm"
                            >
                                <option value="">All Types</option>
                                <option value="full_time">Full Time</option>
                                <option value="part_time">Part Time</option>
                            </select>
                        </div>
                        <div className="relative" ref={locationFilterRef}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Location</label>
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
                                className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-primary-500 py-3 px-4 shadow-sm"
                                placeholder="Search location..."
                            />
                            {showLocationSuggestions && locationFilterSuggestions.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                                    {locationFilterSuggestions.map((suggestion, index) => (
                                        <div
                                            key={index}
                                            onClick={() => handleLocationSelect(suggestion)}
                                            className="px-4 py-2 hover:bg-primary-50 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0 text-gray-900 dark:text-gray-200"
                                        >
                                            {suggestion.display_text}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-primary-500 focus:ring-primary-500 py-3 px-4 shadow-sm"
                            >
                                <option value="created_at">Newest</option>
                                <option value="rate_low">Rate: Low to High</option>
                                <option value="rate_high">Rate: High to Low</option>
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

                {/* Listings Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400">Loading service listings...</p>
                    </div>
                ) : listings.data && listings.data.length > 0 ? (
                    <>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {listings.data.map((listing) => (
                                <div
                                    key={listing.id}
                                    className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                                >
                                    <Link
                                        to={route("service-listings.show", listing.id)}
                                        className="block"
                                    >
                                        <div className="p-6">
                                            {/* Service Types & Rate Section - Highlighted */}
                                            <div className="mb-5">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex flex-wrap gap-2">
                                                        {listing.service_types && listing.service_types.length > 0 ? (
                                                            listing.service_types.map((st, idx) => (
                                                                <span key={idx} className="bg-gradient-to-r from-primary-600 to-indigo-600 text-white text-sm px-4 py-1.5 rounded-full font-bold capitalize shadow-sm hover:shadow-md transition-shadow cursor-default">
                                                                    {typeof st === "string" ? st.replace("_", " ") : st}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="bg-gradient-to-r from-primary-600 to-indigo-600 text-white text-sm px-4 py-1.5 rounded-full font-bold capitalize shadow-sm">
                                                                Service
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {listing.work_type && (
                                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full capitalize">
                                                        {listing.work_type.replace("_", " ")}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Skills - Highlighted */}
                                            {listing.user?.skills && (
                                                <div className="mb-5">
                                                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                        <span>⚡</span> Skills
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {listing.user.skills.split(",").slice(0, 3).map((skill, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg font-semibold border border-indigo-100 dark:border-indigo-800"
                                                            >
                                                                {skill.trim()}
                                                            </span>
                                                        ))}
                                                        {listing.user.skills.split(",").length > 3 && (
                                                            <span className="text-xs text-gray-500 font-medium px-2 py-1">+{listing.user.skills.split(",").length - 3} more</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {listing.monthly_rate && (
                                                <div className="mb-4">
                                                    <span className="text-xl font-bold text-green-600 dark:text-green-400 block">
                                                        PKR {listing.monthly_rate}<span className="text-sm text-gray-500 dark:text-gray-400 font-normal">/month</span>
                                                    </span>
                                                </div>
                                            )}

                                            {/* Avatar and Name Section - De-emphasized */}
                                            <div className="flex items-center gap-3 mb-4 p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700">
                                                <div className="flex-shrink-0">
                                                    {listing.user?.photo ? (
                                                        <img
                                                            src={listing.user.photo.startsWith("http") ? listing.user.photo : `/storage/${listing.user.photo}`}
                                                            alt={listing.user?.name || "Helper"}
                                                            className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-300 font-bold text-sm">
                                                            {listing.user?.name ? listing.user.name.charAt(0).toUpperCase() : "👤"}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
                                                        {listing.user?.name || "Helper"}
                                                    </h3>
                                                    <div className="flex items-center gap-1 text-xs text-yellow-500">
                                                        <span>★</span>
                                                        <span className="text-gray-600 dark:text-gray-400">{listing.user?.rating || "New"}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Multiple Locations */}
                                            {listing.location_details && listing.location_details.length > 0 ? (
                                                <div className="text-sm text-gray-600 dark:text-gray-300 mb-3 space-y-1">
                                                    {listing.location_details.slice(0, 2).map((location, idx) => (
                                                        <p key={idx} className="capitalize">
                                                            📍 {location.area || location.city_name}
                                                        </p>
                                                    ))}
                                                    {listing.location_details.length > 2 && (
                                                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                                                            +{listing.location_details.length - 2} more location{listing.location_details.length - 2 !== 1 ? "s" : ""}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : listing.area ? (
                                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 capitalize">
                                                    📍 {listing.area}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                    📍 Location not specified
                                                </p>
                                            )}

                                            {listing.description && (
                                                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                                                    {listing.description}
                                                </p>
                                            )}

                                            {/* Gender, Religion, Languages */}
                                            <div className="space-y-2 mb-4">
                                                {/* Gender */}
                                                {listing.user?.gender && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="text-gray-500 dark:text-gray-400">👤</span>
                                                        <span className="text-gray-700 dark:text-gray-300 capitalize">{listing.user.gender}</span>
                                                    </div>
                                                )}

                                                {/* Religion */}
                                                {listing.user?.religion && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="text-gray-500 dark:text-gray-400">🕌</span>
                                                        <span className="text-gray-700 dark:text-gray-300 capitalize">
                                                            {typeof listing.user.religion === "object"
                                                                ? listing.user.religion.label
                                                                : listing.user.religion.replace(/_/g, " ")}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Languages */}
                                                {listing.user?.languages && listing.user.languages.length > 0 && (
                                                    <div className="flex items-start gap-2 text-sm">
                                                        <span className="text-gray-500 dark:text-gray-400 mt-0.5">💬</span>
                                                        <div className="flex flex-wrap gap-1.5 flex-1">
                                                            {listing.user.languages.map((lang, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-md"
                                                                >
                                                                    {lang.name || lang}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm">View Details →</span>
                                            </div>
                                        </div>
                                    </Link>
                                    <div className="px-6 pb-6 pt-0">
                                        {user ? (
                                            <div className="flex items-center justify-center gap-3">
                                                {/* In-app Message Icon */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedRecipient({
                                                            id: listing.user?.id,
                                                            name: listing.user?.name,
                                                            photo: listing.user?.photo,
                                                        });
                                                        setChatOpen(true);
                                                    }}
                                                    className="flex items-center justify-center w-12 h-12 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-all duration-300 shadow-md hover:shadow-lg"
                                                    title="Send Message"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                </button>

                                                {/* Phone & WhatsApp - Only if phone exists */}
                                                {listing.user?.phone && (
                                                    <>
                                                        {/* Call Icon */}
                                                        <a
                                                            href={`tel:${listing.user.phone}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="flex items-center justify-center w-12 h-12 bg-green-600 text-white rounded-full hover:bg-green-700 transition-all duration-300 shadow-md hover:shadow-lg"
                                                            title="Call"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                            </svg>
                                                        </a>

                                                        {/* WhatsApp Icon */}
                                                        <a
                                                            href={`https://wa.me/${formatPhoneForWhatsApp(listing.user.phone)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="flex items-center justify-center w-12 h-12 bg-[#25D366] text-white rounded-full hover:bg-[#20BA5A] transition-all duration-300 shadow-md hover:shadow-lg"
                                                            title="WhatsApp"
                                                        >
                                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                            </svg>
                                                        </a>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-center pb-2">
                                                <Link
                                                    to={route("login")}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                                    </svg>
                                                    Login to contact provider
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {listings.links && listings.links.length > 1 && (
                            <div className="mt-12">
                                {/* Results Info */}
                                {listings.total !== undefined && (
                                    <div className="text-center mb-6 text-gray-600 dark:text-gray-400">
                                        <p className="text-sm">
                                            Showing {listings.from || 0} to {listings.to || 0} of {listings.total || 0} results
                                        </p>
                                    </div>
                                )}
                                <div className="flex justify-center">
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {listings.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                to={link.url || "#"}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${link.active
                                                    ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg"
                                                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-md"
                                                    } ${!link.url && "cursor-not-allowed opacity-50"}`}
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
                        <p className="text-gray-600 dark:text-gray-300 text-xl mb-6">No services found</p>
                        <p className="text-gray-500 dark:text-gray-400 mb-8">Try adjusting your filters</p>
                    </div>
                )}
            </div>

            {/* Chat Popup */}
            {selectedRecipient && (
                <ChatPopup
                    recipientId={selectedRecipient.id}
                    recipientName={selectedRecipient.name}
                    recipientPhoto={selectedRecipient.photo}
                    isOpen={chatOpen}
                    onClose={() => {
                        setChatOpen(false);
                        setSelectedRecipient(null);
                    }}
                />
            )}
        </PublicLayout>
    );
}

