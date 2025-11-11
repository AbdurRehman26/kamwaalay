import { Link, useParams } from "react-router-dom";
import PublicLayout from "@/Layouts/PublicLayout";
import { useState, useEffect } from "react";
import { serviceListingsService } from "@/services/serviceListings";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";

export default function ServiceListingShow() {
    const { listingId } = useParams();
    const { user } = useAuth();
    const [listing, setListing] = useState(null);
    const [otherListings, setOtherListings] = useState([]);
    const [matchingBookings, setMatchingBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Check if current user is the owner of this listing
    const isOwner = user && listing && user.profile?.id === listing.profile_id;

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
            
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
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
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300 font-semibold inline-flex items-center gap-2"
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
                                    <p className="text-gray-600">📞 {listing.user.phone}</p>
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Work Type</h3>
                                <p className="text-gray-900 capitalize">{listing.work_type?.replace("_", " ") || "N/A"}</p>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2 mt-4">Location</h3>
                                <p className="text-gray-900">
                                    {listing.city && listing.area
                                        ? `${listing.city}, ${listing.area}`
                                        : listing.locations && listing.locations.length > 0
                                        ? `Location ID: ${listing.locations[0]}`
                                        : "Location not specified"}
                                </p>
                            </div>
                        </div>
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Services Offered</h3>
                            <div className="flex flex-wrap gap-2">
                                {listing.service_types && listing.service_types.length > 0 ? (
                                    listing.service_types.map((serviceType, idx) => (
                                        <span key={idx} className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold capitalize">
                                            {typeof serviceType === 'string' ? serviceType.replace("_", " ") : serviceType}
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
                                                    <span className="font-semibold">Location:</span> {booking.city}{booking.area ? `, ${booking.area}` : ''}
                                                </p>
                                                {booking.user && (
                                                    <p className="text-gray-600 mt-1">
                                                        <span className="font-semibold">Requested by:</span> {booking.user.name}
                                                    </p>
                                                )}
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                'bg-gray-100 text-gray-800'
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
                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300 font-semibold text-sm"
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
                                    className="text-blue-600 hover:text-blue-800 font-semibold"
                                >
                                    View All Service Requests →
                                </Link>
                            </div>
                        </div>
                    )}
                    {!isOwner && user && (user.role === "helper" || user.role === "business") && (
                        <div className="text-center space-y-3">
                            <div className="flex flex-wrap justify-center gap-3">
                                {listing.user?.phone ? (
                                    <a
                                        href={`tel:${listing.user.phone}`}
                                        className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-lg inline-flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        Contact
                                    </a>
                                ) : (
                                    <button
                                        disabled
                                        className="bg-gray-400 text-white px-8 py-4 rounded-lg cursor-not-allowed font-semibold text-lg inline-flex items-center gap-2 opacity-60"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        Contact
                                    </button>
                                )}
                                <Link
                                    to={(() => {
                                        const params = new URLSearchParams();
                                        if (listing.service_types && listing.service_types.length > 0) {
                                            params.append('service_type', listing.service_types[0]);
                                        }
                                        if (listing.work_type) {
                                            params.append('work_type', listing.work_type);
                                        }
                                        if (listing.locations && listing.locations.length > 0) {
                                            params.append('location_id', listing.locations[0]);
                                        }
                                        const queryString = params.toString();
                                        return `${route("job-applications.index")}${queryString ? `?${queryString}` : ''}`;
                                    })()}
                                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-lg inline-block"
                                >
                                    Apply
                                </Link>
                            </div>
                        </div>
                    )}
                    {user && user.role === "user" && (
                        <div className="text-center space-y-3">
                            <Link
                                to={route("bookings.create", {
                                    service_type: listing.service_types && listing.service_types.length > 0 ? listing.service_types[0] : null,
                                    work_type: listing.work_type,
                                    location_id: listing.locations && listing.locations.length > 0 ? listing.locations[0] : null,
                                })}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-lg inline-block"
                            >
                                Request This Service
                            </Link>
                            {listing.user?.phone && (
                                <a
                                    href={`tel:${listing.user.phone}`}
                                    className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-lg inline-flex items-center gap-2 mx-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    Contact Provider
                                </a>
                            )}
                        </div>
                    )}
                    {!user && (
                        <div className="text-center space-y-3">
                            {listing.user?.phone && (
                                <a
                                    href={`tel:${listing.user.phone}`}
                                    className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-lg inline-flex items-center gap-2 mx-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    Contact Provider
                                </a>
                            )}
                            <Link
                                to={route("login")}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-lg inline-block"
                            >
                                Login to Request This Service
                            </Link>
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
                                        className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-blue-500"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex flex-wrap gap-2">
                                                {otherListing.service_types && otherListing.service_types.length > 0 ? (
                                                    otherListing.service_types.slice(0, 2).map((st, idx) => (
                                                        <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-semibold capitalize">
                                                            {typeof st === 'string' ? st.replace("_", " ") : (st?.service_type?.replace("_", " ") || "Service")}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-semibold capitalize">
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
                                        <span className="text-blue-600 font-semibold text-sm">View Details →</span>
                                    </Link>
                                ))}
                            </div>
                            <div className="mt-6 text-center">
                                {listing.user?.role === "helper" && listing.user?.id && (
                                    <Link
                                        to={route("helpers.show", listing.user.id)}
                                        className="text-blue-600 hover:text-blue-800 font-semibold"
                                    >
                                        View All Services from {listing.user?.name} →
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}

