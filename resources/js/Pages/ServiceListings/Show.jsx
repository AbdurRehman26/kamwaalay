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
                
                <div className="container mx-auto px-4 py-12 text-center">
                    <p className="text-gray-600 dark:text-gray-400">Loading listing details...</p>
                </div>
            </PublicLayout>
        );
    }

    if (error || !listing) {
        return (
            <PublicLayout>
                
                <div className="container mx-auto px-4 py-12 text-center">
                    <p className="text-red-600 dark:text-red-400">{error || "Listing not found"}</p>
                    <Link
                        to={route("service-listings.index")}
                        className="mt-4 inline-block bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-300 font-semibold"
                    >
                        Back to Listings
                    </Link>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-800 dark:to-primary-900 text-white py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">{listing.service_type_label}</h1>
                    <p className="text-xl text-white/90">Service offered by {listing.user?.name}</p>
                    {otherListings && otherListings.length > 0 && (
                        <p className="text-lg text-white/80 mt-2">
                            This provider offers {otherListings.length} other service{otherListings.length !== 1 ? "s" : ""}
                        </p>
                    )}
                </div>
            </div>
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
                        {isOwner && (
                            <div className="mb-6 flex justify-end">
                                <Link
                                    to={route("service-listings.edit", listing.id)}
                                    className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-all duration-300 font-semibold inline-flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit Listing
                                </Link>
                            </div>
                        )}
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Service Provider</h3>
                                <p className="text-gray-900 dark:text-white font-bold text-xl">{listing.user?.name}</p>
                                {listing.user?.phone && (
                                    <p className="text-gray-600 dark:text-gray-400">📞 {listing.user.phone}</p>
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Work Type</h3>
                                <p className="text-gray-900 dark:text-white capitalize">{listing.work_type?.replace("_", " ") || "N/A"}</p>
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2 mt-4">Location{listing.location_details && listing.location_details.length > 1 ? "s" : ""}</h3>
                                {listing.location_details && listing.location_details.length > 0 ? (
                                    <div className="space-y-1">
                                        {listing.location_details.map((location, idx) => (
                                            <p key={idx} className="text-gray-900 dark:text-white flex items-center">
                                                <span className="mr-2">📍</span>
                                                <span>{location.city_name}{location.area ? `, ${location.area}` : ""}</span>
                                            </p>
                                        ))}
                                    </div>
                                ) : listing.city && listing.area ? (
                                    <p className="text-gray-900 dark:text-white">
                                        📍 {listing.city}, {listing.area}
                                    </p>
                                ) : (
                                    <p className="text-gray-900 dark:text-white">Location not specified</p>
                                )}
                            </div>
                        </div>
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Services Offered</h3>
                            <div className="flex flex-wrap gap-2">
                                {listing.service_types && listing.service_types.length > 0 ? (
                                    listing.service_types.map((serviceType, idx) => (
                                        <span key={idx} className="bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 px-4 py-2 rounded-full font-semibold capitalize">
                                            {typeof serviceType === "string" ? serviceType.replace("_", " ") : serviceType}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-gray-500 dark:text-gray-400">No services specified</span>
                                )}
                            </div>
                        </div>
                        {listing.monthly_rate && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400">PKR {listing.monthly_rate}/month</p>
                            </div>
                        )}
                        {listing.description && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</h3>
                                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{listing.description}</p>
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
                    {!isOwner && listing.user?.phone && (
                        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Contact Provider</h3>
                            <div className="flex flex-wrap gap-3">
                                {/* Call Button */}
                                <a
                                    href={`tel:${listing.user.phone}`}
                                    className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-300 shadow-md hover:shadow-lg font-semibold"
                                >
                                    <span className="text-xl">📞</span>
                                    Call
                                </a>
                                
                                {/* WhatsApp Button */}
                                <a
                                    href={`https://wa.me/${formatPhoneForWhatsApp(listing.user.phone)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-lg hover:bg-[#20BA5A] transition-all duration-300 shadow-md hover:shadow-lg font-semibold"
                                >
                                    <span className="text-xl">💬</span>
                                    WhatsApp
                                </a>
                                
                                {/* In-app Message Button */}
                                {user && (
                                    <button
                                        onClick={() => {
                                            setSelectedRecipient({
                                                id: listing.user?.id,
                                                name: listing.user?.name,
                                                photo: listing.user?.photo,
                                            });
                                            setChatOpen(true);
                                        }}
                                        className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-all duration-300 shadow-md hover:shadow-lg font-semibold"
                                    >
                                        <span className="text-xl">✉️</span>
                                        In-app Message
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    {isOwner && matchingBookings && matchingBookings.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Matching Service Requests</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                Here are service requests that match your listing criteria. You can apply to these requests.
                            </p>
                            <div className="space-y-4">
                                {matchingBookings.map((booking) => (
                                    <div key={booking.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow bg-white dark:bg-gray-700">
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
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                booking.status === "pending" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300" :
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
                                        <div className="flex gap-3">
                                            <Link
                                                to={`/service-requests/${booking.id}`}
                                                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-all duration-300 font-semibold text-sm"
                                            >
                                                View Details
                                            </Link>
                                            <Link
                                                to={`/bookings/${booking.id}/apply`}
                                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-300 font-semibold text-sm"
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
                                    className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-semibold"
                                >
                                    View All Service Requests →
                                </Link>
                            </div>
                        </div>
                    )}
                    
                    {/* Other Services from Same Provider */}
                    {otherListings && otherListings.length > 0 && (
                        <div className="mt-12">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Other Services by {listing.user?.name}</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {otherListings.map((otherListing) => (
                                    <Link
                                        key={otherListing.id}
                                        to={route("service-listings.show", otherListing.id)}
                                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-primary-500 dark:hover:border-primary-600"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex flex-wrap gap-2">
                                                {otherListing.service_types && otherListing.service_types.length > 0 ? (
                                                    otherListing.service_types.slice(0, 2).map((st, idx) => (
                                                        <span key={idx} className="bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 text-xs px-3 py-1 rounded-full font-semibold capitalize">
                                                            {typeof st === "string" ? st.replace("_", " ") : (st?.service_type?.replace("_", " ") || "Service")}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 text-xs px-3 py-1 rounded-full font-semibold capitalize">
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
                                                        <span>{location.city_name}{location.area ? `, ${location.area}` : ""}</span>
                                                    </p>
                                                ))}
                                                {otherListing.location_details.length > 2 && (
                                                    <p className="text-gray-500 dark:text-gray-400 font-medium text-xs">
                                                        +{otherListing.location_details.length - 2} more location{otherListing.location_details.length - 2 !== 1 ? "s" : ""}
                                                    </p>
                                                )}
                                            </div>
                                        ) : otherListing.city && otherListing.area ? (
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                                📍 {otherListing.city}, {otherListing.area}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">📍 Location not specified</p>
                                        )}
                                        {otherListing.description && (
                                            <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-3">
                                                {otherListing.description}
                                            </p>
                                        )}
                                        <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm">View Details →</span>
                                    </Link>
                                ))}
                            </div>
                            <div className="mt-6 text-center">
                                {listing.user?.role === "helper" && listing.user?.id && (
                                    <Link
                                        to={route("helpers.show", listing.user.id)}
                                        className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-semibold"
                                    >
                                        View All Services from {listing.user?.name} →
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
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

