import { Link, useParams, useNavigate } from "react-router-dom";
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
    const navigate = useNavigate();
    
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
                    <p className="text-gray-600">Loading listing details...</p>
                </div>
            </PublicLayout>
        );
    }

    if (error || !listing) {
        return (
            <PublicLayout>
                
                <div className="container mx-auto px-4 py-12 text-center">
                    <p className="text-red-600">{error || "Listing not found"}</p>
                    <Link
                        to={route("service-listings.index")}
                        className="mt-4 inline-block bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition duration-300 font-semibold"
                    >
                        Back to Listings
                    </Link>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>
            
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
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
                    <div className="bg-white rounded-lg shadow-md p-8 mb-8">
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
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Service Provider</h3>
                                <p className="text-gray-900 font-bold text-xl">{listing.user?.name}</p>
                                {listing.user?.phone && (
                                    <p className="text-gray-600 mb-3">📞 {listing.user.phone}</p>
                                )}
                                
                                {/* Contact Options */}
                                {listing.user?.phone && !isOwner && (
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-600 mb-3 font-medium">Contact Provider:</p>
                                        <div className="flex items-center gap-3">
                                            {/* In-app Message Icon */}
                                            {user ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setChatOpen(true);
                                                    }}
                                                    className="flex items-center justify-center w-12 h-12 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-all duration-300 shadow-md hover:shadow-lg"
                                                    title="Send Message"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        navigate(route("login"));
                                                    }}
                                                    className="flex items-center justify-center w-12 h-12 bg-gray-400 text-white rounded-full cursor-not-allowed opacity-60 hover:bg-gray-500 transition-all duration-300 shadow-md"
                                                    title="Please login to send message"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                </button>
                                            )}
                                            
                                            {/* Call Icon */}
                                            <a
                                                href={`tel:${listing.user.phone}`}
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
                                                className="flex items-center justify-center w-12 h-12 bg-[#25D366] text-white rounded-full hover:bg-[#20BA5A] transition-all duration-300 shadow-md hover:shadow-lg"
                                                title="WhatsApp"
                                            >
                                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                                </svg>
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Work Type</h3>
                                <p className="text-gray-900 capitalize">{listing.work_type?.replace("_", " ") || "N/A"}</p>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-4">Location</h3>
                                <p className="text-gray-900">
                                    {listing.location_details && listing.location_details.length > 0
                                        ? listing.location_details.map(loc => `${loc.city_name}${loc.area ? ", " + loc.area : ""}`).join(" • ")
                                        : listing.city
                                        ? `${listing.city}${listing.area ? ", " + listing.area : ""}`
                                        : "Location not specified"}
                                </p>
                            </div>
                        </div>
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Services Offered</h3>
                            <div className="flex flex-wrap gap-2">
                                {listing.service_types && listing.service_types.length > 0 ? (
                                    listing.service_types.map((serviceType, idx) => (
                                        <span key={idx} className="bg-primary-100 text-primary-800 px-4 py-2 rounded-full font-semibold capitalize">
                                            {typeof serviceType === "string" ? serviceType.replace("_", " ") : serviceType}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-gray-500">No services specified</span>
                                )}
                            </div>
                        </div>
                        {listing.monthly_rate && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                                <p className="text-3xl font-bold text-green-600">PKR {listing.monthly_rate}/month</p>
                            </div>
                        )}
                        {listing.description && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Description</h3>
                                <p className="text-gray-600 whitespace-pre-wrap">{listing.description}</p>
                            </div>
                        )}
                        {isOwner && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-700 mb-3">Listing Details</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Status</p>
                                        <p className="font-semibold capitalize">{listing.status || "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Active</p>
                                        <p className="font-semibold">{listing.is_active ? "Yes" : "No"}</p>
                                    </div>
                                    {listing.created_at && (
                                        <div>
                                            <p className="text-sm text-gray-600">Created</p>
                                            <p className="font-semibold">{new Date(listing.created_at).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                    {listing.updated_at && (
                                        <div>
                                            <p className="text-sm text-gray-600">Last Updated</p>
                                            <p className="font-semibold">{new Date(listing.updated_at).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    {isOwner && matchingBookings && matchingBookings.length > 0 && (
                        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Matching Service Requests</h2>
                            <p className="text-gray-600 mb-4">
                                Here are service requests that match your listing criteria. You can apply to these requests.
                            </p>
                            <div className="space-y-4">
                                {matchingBookings.map((booking) => (
                                    <div key={booking.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                    {booking.service_type_label} - {booking.work_type?.replace("_", " ")}
                                                </h3>
                                                <p className="text-gray-600">
                                                    <span className="font-semibold">Location:</span> {booking.city}{booking.area ? `, ${booking.area}` : ""}
                                                </p>
                                                {booking.user && (
                                                    <p className="text-gray-600 mt-1">
                                                        <span className="font-semibold">Requested by:</span> {booking.user.name}
                                                    </p>
                                                )}
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                booking.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                                booking.status === "confirmed" ? "bg-green-100 text-green-800" :
                                                "bg-gray-100 text-gray-800"
                                            }`}>
                                                {booking.status_label || booking.status}
                                            </span>
                                        </div>
                                        {booking.special_requirements && (
                                            <p className="text-gray-600 mb-4">
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
                                    className="text-primary-600 hover:text-primary-800 font-semibold"
                                >
                                    View All Service Requests →
                                </Link>
                            </div>
                        </div>
                    )}
                    {!isOwner && user && (user.role === "helper" || user.role === "business") && (
                        <div className="text-center space-y-3">
                            <div className="flex flex-wrap justify-center gap-3">
                                <Link
                                    to={(() => {
                                        const params = new URLSearchParams();
                                        if (listing.service_types && listing.service_types.length > 0) {
                                            params.append("service_type", listing.service_types[0]);
                                        }
                                        if (listing.work_type) {
                                            params.append("work_type", listing.work_type);
                                        }
                                        if (listing.locations && listing.locations.length > 0) {
                                            params.append("location_id", listing.locations[0]);
                                        }
                                        const queryString = params.toString();
                                        return `${route("job-applications.index")}${queryString ? `?${queryString}` : ""}`;
                                    })()}
                                    className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-4 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-lg inline-block"
                                >
                                    Apply
                                </Link>
                            </div>
                        </div>
                    )}
                    
                    {/* Other Services from Same Provider */}
                    {otherListings && otherListings.length > 0 && (
                        <div className="mt-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">Other Services by {listing.user?.name}</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {otherListings.map((otherListing) => (
                                    <Link
                                        key={otherListing.id}
                                        to={route("service-listings.show", otherListing.id)}
                                        className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-primary-500"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex flex-wrap gap-2">
                                                {otherListing.service_types && otherListing.service_types.length > 0 ? (
                                                    otherListing.service_types.slice(0, 2).map((st, idx) => (
                                                        <span key={idx} className="bg-primary-100 text-primary-800 text-xs px-3 py-1 rounded-full font-semibold capitalize">
                                                            {typeof st === "string" ? st.replace("_", " ") : (st?.service_type?.replace("_", " ") || "Service")}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="bg-primary-100 text-primary-800 text-xs px-3 py-1 rounded-full font-semibold capitalize">
                                                        Service
                                                    </span>
                                                )}
                                            </div>
                                            {otherListing.monthly_rate && (
                                                <span className="text-lg font-bold text-green-600">
                                                    PKR {otherListing.monthly_rate}/month
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2 capitalize">
                                            {otherListing.work_type?.replace("_", " ") || "Service"} • {otherListing.city && otherListing.area ? `${otherListing.city}, ${otherListing.area}` : otherListing.locations && otherListing.locations.length > 0 ? `Location ID: ${otherListing.locations[0]}` : "Location not specified"}
                                        </p>
                                        {otherListing.description && (
                                            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                                                {otherListing.description}
                                            </p>
                                        )}
                                        <span className="text-primary-600 font-semibold text-sm">View Details →</span>
                                    </Link>
                                ))}
                            </div>
                            <div className="mt-6 text-center">
                                {listing.user?.role === "helper" && listing.user?.id && (
                                    <Link
                                        to={route("helpers.show", listing.user.id)}
                                        className="text-primary-600 hover:text-primary-800 font-semibold"
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
            {listing?.user && (
                <ChatPopup
                    recipientId={listing.user.id}
                    recipientName={listing.user.name}
                    recipientPhoto={listing.user.photo}
                    isOpen={chatOpen}
                    onClose={() => setChatOpen(false)}
                />
            )}
        </PublicLayout>
    );
}

