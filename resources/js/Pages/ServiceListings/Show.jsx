import { Link, useParams } from "react-router-dom";
import PublicLayout from "@/Layouts/PublicLayout";
import { useState, useEffect } from "react";
import { serviceListingsService } from "@/services/serviceListings";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";
import ChatPopup from "@/Components/ChatPopup";

export default function ServiceListingShow() {
    const { listingId } = useParams();
    const { user } = useAuth();
    const [listing, setListing] = useState(null);
    const [otherListings, setOtherListings] = useState([]);
    const [matchingBookings, setMatchingBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [selectedRecipient, setSelectedRecipient] = useState(null);

    // Check if current user is the owner of this listing
    const isOwner = user && listing && user.profile?.id === listing.profile_id;

    // Get city display name (full name for detail page)
    const getCityDisplayName = (listingData) => {
        let cityName = "";

        if (listingData?.location_details && listingData.location_details.length > 0) {
            cityName = listingData.location_details[0].city_name;
        } else if (listingData?.city) {
            cityName = listingData.city;
        }

        return cityName || null;
    };

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

    useEffect(() => {
        if (listingId) {
            serviceListingsService.getListing(listingId)
                .then((data) => {
                    setListing(data.listing);
                    setOtherListings(data.other_listings || []);
                    setMatchingBookings(data.matching_bookings || []);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error("Error fetching listing:", err);
                    setError(err.response?.data?.message || "Failed to load listing");
                    setLoading(false);
                });
        }
    }, [listingId]);

    if (loading) {
        return (
            <PublicLayout>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading listing details...</p>
                    </div>
                </div>
            </PublicLayout>
        );
    }

    if (error || !listing) {
        return (
            <PublicLayout>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
                    <div className="max-w-2xl mx-auto px-6 lg:px-8">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center border border-gray-100 dark:border-gray-700">
                            <div className="text-6xl mb-6">❌</div>
                            <p className="text-red-600 dark:text-red-400 text-xl mb-6 font-semibold">{error || "Listing not found"}</p>
                            <Link
                                to={route("service-listings.index")}
                                className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-indigo-500/30 font-bold"
                            >
                                Back to Listings
                            </Link>
                        </div>
                    </div>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 text-white overflow-hidden py-8 md:py-12">
                {/* Abstract Background Shapes */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 text-center">
                    <h1 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">{listing.service_type_label}</h1>
                    <p className="text-base text-indigo-100/90 max-w-2xl mx-auto leading-relaxed">
                        Service offered by {listing.user?.name}
                    </p>
                    {otherListings && otherListings.length > 0 && (
                        <p className="text-sm text-indigo-100/80 mt-2">
                            This provider offers {otherListings.length} other service{otherListings.length !== 1 ? "s" : ""}
                        </p>
                    )}
                </div>
            </div>

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        {/* Main Content Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 mb-6 border border-gray-100 dark:border-gray-700 relative z-20 -mt-10">
                            {isOwner && (
                                <div className="mb-6 flex justify-end">
                                    <Link
                                        to={route("service-listings.edit", listing.id)}
                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-indigo-500/30 font-bold inline-flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit Listing
                                    </Link>
                                </div>
                            )}
                            <div className="grid md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800">
                                    <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-2">👤 Service Provider</h3>
                                    <Link
                                        to={listing.user?.role === "business" || listing.user?.roles?.some(r => r.name === "business")
                                            ? route("businesses.show", listing.user?.id)
                                            : route("helpers.show", listing.user?.id)
                                        }
                                        className="text-gray-900 dark:text-white font-bold text-lg mb-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-flex items-center gap-1"
                                    >
                                        {listing.user?.name}
                                        <span className="text-indigo-500 text-sm">→</span>
                                    </Link>
                                    {user && listing.user?.phone && (
                                        <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                            <span>📞</span>
                                            <span>{listing.user.phone}</span>
                                        </p>
                                    )}
                                    {listing.user?.gender && (
                                        <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-2">
                                            <span>👤</span>
                                            <span className="capitalize">{listing.user.gender}</span>
                                        </p>
                                    )}
                                    {listing.user?.religion && (
                                        <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-2">
                                            <span>🕌</span>
                                            <span className="capitalize">
                                                {typeof listing.user.religion === "object"
                                                    ? listing.user.religion.label
                                                    : listing.user.religion.replace(/_/g, " ")}
                                            </span>
                                        </p>
                                    )}
                                    {listing.user?.languages && listing.user.languages.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Languages:</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {listing.user.languages.map((lang, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded-md font-medium"
                                                    >
                                                        {lang.name || lang}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800">
                                    <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-2">💼 Work Type</h3>
                                    <p className="text-gray-900 dark:text-white font-semibold text-base capitalize mb-3">{listing.work_type?.replace("_", " ") || "N/A"}</p>
                                    <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-2">
                                        📍 Location{listing.location_details && listing.location_details.length > 1 ? "s" : ""}
                                        {getCityDisplayName(listing) && (
                                            <span className="ml-2 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs rounded-md font-bold">
                                                {getCityDisplayName(listing)}
                                            </span>
                                        )}
                                    </h3>
                                    {listing.location_details && listing.location_details.length > 0 ? (
                                        <div className="space-y-2">
                                            {listing.location_details.map((location, idx) => (
                                                <p key={idx} className="text-gray-900 dark:text-white flex items-center font-medium">
                                                    <span className="mr-2">📍</span>
                                                    <span>{location.area || location.city_name}</span>
                                                </p>
                                            ))}
                                        </div>
                                    ) : listing.area ? (
                                        <p className="text-gray-900 dark:text-white font-medium">
                                            📍 {listing.area}
                                        </p>
                                    ) : (
                                        <p className="text-gray-500 dark:text-gray-400">Location not specified</p>
                                    )}
                                    {listing.pin_address && (
                                        <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-800">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Pin Address:</p>
                                            <p className="text-gray-900 dark:text-white flex items-start gap-2 font-medium">
                                                <span className="mt-1">📌</span>
                                                <span>{listing.pin_address}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mb-6">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <span>🛠️</span>
                                    Services Offered
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {listing.service_types && listing.service_types.length > 0 ? (
                                        listing.service_types.map((serviceType, idx) => (
                                            <span key={idx} className="bg-gradient-to-r from-primary-600 to-indigo-600 text-white px-4 py-1.5 rounded-full font-semibold text-sm capitalize shadow-md">
                                                {typeof serviceType === "string" ? serviceType.replace("_", " ") : serviceType}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-500 dark:text-gray-400 text-sm">No services specified</span>
                                    )}
                                </div>
                            </div>

                            {listing.user?.skills && (
                                <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <span>⚡</span>
                                        Key Skills
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {listing.user.skills.split(",").map((skill, idx) => (
                                            <span
                                                key={idx}
                                                className="bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-md font-semibold text-sm border border-indigo-200 dark:border-indigo-700"
                                            >
                                                {skill.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {listing.monthly_rate && (
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                                    <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">Monthly Rate</p>
                                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">PKR {listing.monthly_rate}/month</p>
                                </div>
                            )}
                            {listing.description && (
                                <div className="mb-6">
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <span>📝</span>
                                        Description
                                    </h3>
                                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                        <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{listing.description}</p>
                                    </div>
                                </div>
                            )}
                            {isOwner && (
                                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Listing Details</h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                                            <p className="font-semibold dark:text-white capitalize">{listing.status || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                                            <p className="font-semibold dark:text-white">{listing.is_active ? "Yes" : "No"}</p>
                                        </div>
                                        {listing.created_at && (
                                            <div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
                                                <p className="font-semibold dark:text-white">{new Date(listing.created_at).toLocaleDateString()}</p>
                                            </div>
                                        )}
                                        {listing.updated_at && (
                                            <div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
                                                <p className="font-semibold dark:text-white">{new Date(listing.updated_at).toLocaleDateString()}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        {!isOwner && (
                            <div className="mt-8 pt-8 border-t-2 border-gray-200 dark:border-gray-700">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <span>📞</span>
                                    Contact Provider
                                </h3>
                                {user ? (
                                    <div className="flex flex-wrap gap-4">
                                        {/* In-app Message Button - Always available for logged in */}
                                        <button
                                            onClick={() => {
                                                setSelectedRecipient({
                                                    id: listing.user?.id,
                                                    name: listing.user?.name,
                                                    photo: listing.user?.photo,
                                                });
                                                setChatOpen(true);
                                            }}
                                            className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-indigo-500/30 font-bold text-lg"
                                        >
                                            <span className="text-2xl">✉️</span>
                                            In-app Message
                                        </button>

                                        {/* Phone Buttons - Only if phone exists */}
                                        {listing.user?.phone && (
                                            <>
                                                {/* Call Button */}
                                                <a
                                                    href={`tel:${listing.user.phone}`}
                                                    className="flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-green-500/30 font-bold text-lg"
                                                >
                                                    <span className="text-2xl">📞</span>
                                                    Call
                                                </a>

                                                {/* WhatsApp Button */}
                                                <a
                                                    href={`https://wa.me/${formatPhoneForWhatsApp(listing.user.phone)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 bg-gradient-to-r from-[#25D366] to-[#20BA5A] text-white px-8 py-4 rounded-xl hover:from-[#20BA5A] hover:to-[#1DA851] transition-all duration-300 shadow-lg hover:shadow-[#25D366]/30 font-bold text-lg"
                                                >
                                                    <span className="text-2xl">💬</span>
                                                    WhatsApp
                                                </a>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
                                        <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">Please login to view contact details and message this provider.</p>
                                        <Link
                                            to={route("login")}
                                            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl hover:bg-indigo-700 transition-colors font-bold text-lg shadow-lg hover:shadow-indigo-500/30"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                            </svg>
                                            Login to Contact
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                        {isOwner && matchingBookings && matchingBookings.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 border border-gray-100 dark:border-gray-700">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <span>🎯</span>
                                    Matching Service Requests
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    Here are service requests that match your listing criteria. You can apply to these requests.
                                </p>
                                <div className="space-y-4">
                                    {matchingBookings.map((booking) => (
                                        <div key={booking.id} className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                        {booking.service_type_label} - {booking.work_type?.replace("_", " ")}
                                                    </h3>
                                                    <p className="text-gray-600 dark:text-gray-300">
                                                        <span className="font-semibold">Location:</span> {booking.city}{booking.area ? `, ${booking.area}` : ""}
                                                    </p>
                                                    {booking.user && (
                                                        <p className="text-gray-600 dark:text-gray-300 mt-1">
                                                            <span className="font-semibold">Requested by:</span> {booking.user.name}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${booking.status === "pending" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300" :
                                                    booking.status === "confirmed" ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" :
                                                        "bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-300"
                                                    }`}>
                                                    {booking.status_label || booking.status}
                                                </span>
                                            </div>
                                            {booking.special_requirements && (
                                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                                    <span className="font-semibold">Requirements:</span> {booking.special_requirements}
                                                </p>
                                            )}
                                            <div className="flex gap-3 mt-4">
                                                <Link
                                                    to={route("job-posts.show", booking.id)}
                                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-indigo-500/30 font-bold"
                                                >
                                                    View Details
                                                </Link>
                                                <Link
                                                    to={`/job-posts/${booking.id}/apply`}
                                                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-green-500/30 font-bold"
                                                >
                                                    Apply Now
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 text-center">
                                    <Link
                                        to={route("job-applications.index")}
                                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold text-lg inline-flex items-center gap-2"
                                    >
                                        View All Service Requests
                                        <span className="text-xl">→</span>
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Other Services from Same Provider */}
                        {otherListings && otherListings.length > 0 && (
                            <div className="mt-12">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-2">
                                    <span>🌟</span>
                                    Other Services by {listing.user?.name}
                                </h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {otherListings.map((otherListing) => (
                                        <Link
                                            key={otherListing.id}
                                            to={route("service-listings.show", otherListing.id)}
                                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-indigo-300 dark:hover:border-indigo-600"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {otherListing.service_types && otherListing.service_types.length > 0 ? (
                                                        otherListing.service_types.slice(0, 2).map((st, idx) => (
                                                            <span key={idx} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs px-3 py-1 rounded-full font-bold capitalize shadow-sm">
                                                                {typeof st === "string" ? st.replace("_", " ") : (st?.service_type?.replace("_", " ") || "Service")}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs px-3 py-1 rounded-full font-bold capitalize shadow-sm">
                                                            Service
                                                        </span>
                                                    )}
                                                </div>
                                                {otherListing.monthly_rate && (
                                                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                                        PKR {otherListing.monthly_rate}/month
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 capitalize">
                                                {otherListing.work_type?.replace("_", " ") || "Service"}
                                            </p>
                                            {otherListing.location_details && otherListing.location_details.length > 0 ? (
                                                <div className="text-sm text-gray-600 dark:text-gray-300 mb-2 space-y-1">
                                                    {otherListing.location_details.slice(0, 2).map((location, idx) => (
                                                        <p key={idx} className="flex items-center">
                                                            <span className="mr-1">📍</span>
                                                            <span>{location.area || location.city_name}</span>
                                                        </p>
                                                    ))}
                                                    {otherListing.location_details.length > 2 && (
                                                        <p className="text-gray-500 dark:text-gray-400 font-medium text-xs">
                                                            +{otherListing.location_details.length - 2} more location{otherListing.location_details.length - 2 !== 1 ? "s" : ""}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : otherListing.area ? (
                                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                                    📍 {otherListing.area}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">📍 Location not specified</p>
                                            )}
                                            {otherListing.description && (
                                                <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-3">
                                                    {otherListing.description}
                                                </p>
                                            )}
                                            <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                                                View Details
                                                <span className="text-lg">→</span>
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                                <div className="mt-6 text-center">
                                    {listing.user?.role === "helper" && listing.user?.id && (
                                        <Link
                                            to={route("helpers.show", listing.user.id)}
                                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold text-lg inline-flex items-center gap-2"
                                        >
                                            View All Services from {listing.user?.name}
                                            <span className="text-xl">→</span>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
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

