import { Link, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import PublicLayout from "@/Layouts/PublicLayout";
import { businessesService } from "@/services/businesses";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";
import ChatPopup from "@/Components/ChatPopup";

export default function BusinessShow() {
    const { businessId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [serviceListings, setServiceListings] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [chatOpen, setChatOpen] = useState(false);

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
        if (businessId) {
            businessesService.getBusiness(businessId)
                .then((response) => {
                    setBusiness(response.business);
                    setServiceListings(response.business?.service_listings || []);
                    setWorkers(response.business?.helpers || []);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error("Error fetching business:", err);
                    setError(err.response?.data?.message || "Failed to load business");
                    setLoading(false);
                });
        }
    }, [businessId]);

    if (loading) {
        return (
            <PublicLayout>

                <div className="container mx-auto px-4 py-12 text-center">
                    <p className="text-gray-600">Loading business profile...</p>
                </div>
            </PublicLayout>
        );
    }

    if (error || !business) {
        return (
            <PublicLayout>

                <div className="container mx-auto px-4 py-12 text-center">
                    <p className="text-red-600">{error || "Business not found"}</p>
                </div>
            </PublicLayout>
        );
    }

    return (
        <PublicLayout>


            {/* Hero Section */}
            <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white py-16">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        <div className="flex-shrink-0">
                            <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center text-6xl border-4 border-white shadow-lg">
                                🏢
                            </div>
                        </div>
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold mb-2">{business.name}</h1>
                            <p className="text-xl text-white/90 mb-4">{business.bio || "Professional service agency"}</p>
                            <div className="flex items-center gap-4 flex-wrap">
                                <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                    🏢 Business Agency
                                </span>
                                {business.is_active && (
                                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                        ✓ Active
                                    </span>
                                )}
                                {serviceListings.length > 0 && (
                                    <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                        📋 {serviceListings.length} Service{serviceListings.length !== 1 ? "s" : ""}
                                    </span>
                                )}
                                {workers.length > 0 && (
                                    <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                        👥 {workers.length} Worker{workers.length !== 1 ? "s" : ""}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Sidebar - Moved to Left */}
                    <div className="space-y-6 order-2 lg:order-1">
                        {/* Business Info */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Business Information</h3>
                            <div className="space-y-4">
                                {business.phone && (
                                    <div>
                                        <p className="text-sm text-gray-600">Phone</p>
                                        <p className="font-semibold text-gray-900">{business.phone}</p>
                                    </div>
                                )}
                                {business.address && (
                                    <div>
                                        <p className="text-sm text-gray-600">Address</p>
                                        <p className="font-semibold text-gray-900">{business.address}</p>
                                    </div>
                                )}
                                {business.city && (
                                    <div>
                                        <p className="text-sm text-gray-600">Location</p>
                                        <p className="font-semibold text-gray-900">{business.city}, {business.area || "N/A"}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stats Card */}
                        <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg shadow-md p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Business Stats</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Total Services</span>
                                    <span className="font-bold text-primary-600 text-lg">{serviceListings.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Active Workers</span>
                                    <span className="font-bold text-primary-600 text-lg">{workers.length}</span>
                                </div>
                            </div>
                        </div>

                        {/* Contact Options */}
                        {business.phone && (
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Business</h3>
                                <div className="flex items-center justify-center gap-4">
                                    {/* In-app Message Icon */}
                                    {user ? (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setChatOpen(true);
                                            }}
                                            className="flex items-center justify-center w-14 h-14 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-all duration-300 shadow-md hover:shadow-lg"
                                            title="Send Message"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                navigate(route("login"));
                                            }}
                                            className="flex items-center justify-center w-14 h-14 bg-gray-400 text-white rounded-full cursor-not-allowed opacity-60 hover:bg-gray-500 transition-all duration-300 shadow-md"
                                            title="Please login to send message"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                        </button>
                                    )}
                                    
                                    {/* Call Icon */}
                                    <a
                                        href={`tel:${business.phone}`}
                                        className="flex items-center justify-center w-14 h-14 bg-green-600 text-white rounded-full hover:bg-green-700 transition-all duration-300 shadow-md hover:shadow-lg"
                                        title="Call"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </a>
                                    
                                    {/* WhatsApp Icon */}
                                    <a
                                        href={`https://wa.me/${formatPhoneForWhatsApp(business.phone)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full hover:bg-[#20BA5A] transition-all duration-300 shadow-md hover:shadow-lg"
                                        title="WhatsApp"
                                    >
                                        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main Content - Moved to Right */}
                    <div className="lg:col-span-2 space-y-8 order-1 lg:order-2">
                        {/* Service Listings */}
                        {serviceListings && serviceListings.length > 0 && (
                            <div className="bg-white rounded-lg shadow-md p-8">
                                <h2 className="text-3xl font-bold text-gray-900 mb-6">Services Offered</h2>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {serviceListings.map((listing) => (
                                        <Link
                                            key={listing.id}
                                            to={route("service-listings.show", listing.id)}
                                            className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-primary-300"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {listing.service_types && listing.service_types.length > 0 ? (
                                                        <>
                                                            {listing.service_types.slice(0, 2).map((st, idx) => (
                                                                <span key={idx} className="bg-primary-600 text-white text-sm px-3 py-1 rounded-full font-semibold capitalize">
                                                                    {typeof st === "string" ? st.replace("_", " ") : (st?.service_type?.replace("_", " ") || "Service")}
                                                                </span>
                                                            ))}
                                                            {listing.service_types.length > 2 && (
                                                                <span className="bg-primary-500 text-white text-sm px-3 py-1 rounded-full font-semibold">
                                                                    +{listing.service_types.length - 2}
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="bg-primary-600 text-white text-sm px-3 py-1 rounded-full font-semibold capitalize">
                                                            Service
                                                        </span>
                                                    )}
                                                </div>
                                                {listing.monthly_rate && (
                                                    <span className="text-lg font-bold text-green-600">
                                                        PKR {listing.monthly_rate}/month
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-2 capitalize">
                                                {listing.work_type?.replace("_", " ") || "Service"} Service
                                            </h3>
                                            {listing.location_details && listing.location_details.length > 0 ? (
                                                <div className="text-sm text-gray-600 mb-3 space-y-1">
                                                    {listing.location_details.slice(0, 2).map((location, idx) => (
                                                        <p key={idx}>
                                                            📍 {location.area || location.city_name}
                                                        </p>
                                                    ))}
                                                    {listing.location_details.length > 2 && (
                                                        <p className="text-gray-500 font-medium">
                                                            +{listing.location_details.length - 2} more location{listing.location_details.length - 2 !== 1 ? "s" : ""}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : listing.area ? (
                                                <p className="text-sm text-gray-600 mb-3">
                                                    📍 {listing.area}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-gray-600 mb-3">
                                                    📍 Location not specified
                                                </p>
                                            )}
                                            {listing.description && (
                                                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                                                    {listing.description}
                                                </p>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500 capitalize">
                                                    {listing.work_type?.replace("_", " ") || "N/A"}
                                                </span>
                                                <span className="text-primary-600 font-semibold text-sm">View Details →</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                {serviceListings.length > 1 && (
                                    <p className="mt-4 text-sm text-gray-600 text-center">
                                        {business.name} offers {serviceListings.length} different services across multiple locations
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Workers Section */}
                        {workers && workers.length > 0 && (
                            <div className="bg-white rounded-lg shadow-md p-8">
                                <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Workers</h2>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {workers.map((worker) => {
                                        // Ensure worker.id exists before creating route
                                        if (!worker.id) {
                                            console.warn("Worker missing id:", worker);
                                            return null;
                                        }
                                        return (
                                            <Link
                                                key={worker.id}
                                                to={route("helpers.show", worker.id)}
                                                className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-primary-300"
                                            >
                                                <div className="flex items-center gap-4 mb-4">
                                                    {worker.photo ? (
                                                        <img
                                                            src={`/storage/${worker.photo}`}
                                                            alt={worker.name}
                                                            className="w-16 h-16 rounded-full object-cover border-2 border-primary-300"
                                                        />
                                                    ) : (
                                                        <div className="w-16 h-16 rounded-full bg-primary-300 flex items-center justify-center text-2xl">
                                                            👤
                                                        </div>
                                                    )}
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-gray-900">{worker.name}</h3>
                                                        {worker.service_listings && worker.service_listings.length > 0 && worker.service_listings[0].service_types && worker.service_listings[0].service_types.length > 0 && (
                                                            <p className="text-sm text-gray-600 capitalize">
                                                                {worker.service_listings?.[0]?.service_types?.[0]?.service_type?.replace("_", " ") || "No service type"}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {worker.verification_status === "verified" && (
                                                    <div className="mb-3">
                                                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">
                                                            ✓ Verified
                                                        </span>
                                                    </div>
                                                )}
                                                {/* Services */}
                                                {worker.service_listings && worker.service_listings.length > 0 && (
                                                    <div className="mb-3">
                                                        <div className="text-xs font-semibold text-gray-500 mb-1">Services</div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {worker.service_listings.flatMap(listing => 
                                                                listing.service_types?.map(st => st.service_type?.replace("_", " ")) || []
                                                            ).filter(Boolean).slice(0, 3).map((type, idx) => (
                                                                <span key={idx} className="bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-md font-medium capitalize">
                                                                    {type}
                                                                </span>
                                                            ))}
                                                            {worker.service_listings.flatMap(listing => 
                                                                listing.service_types?.map(st => st.service_type?.replace("_", " ")) || []
                                                            ).filter(Boolean).length > 3 && (
                                                                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium">
                                                                    +{worker.service_listings.flatMap(listing => 
                                                                        listing.service_types?.map(st => st.service_type?.replace("_", " ")) || []
                                                                    ).filter(Boolean).length - 3}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Location */}
                                                {(worker.city || worker.area) && (
                                                    <div className="mb-3">
                                                        <div className="flex items-center text-sm text-gray-600">
                                                            <span className="mr-2">📍</span>
                                                            <span>{[worker.city, worker.area].filter(Boolean).join(", ")}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {worker.experience_years && (
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        💼 {worker.experience_years} years experience
                                                    </p>
                                                )}
                                                <span className="text-primary-600 font-semibold text-sm mt-2 block">View Profile →</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                                {workers.length > 10 && (
                                    <div className="mt-6 text-center">
                                        <p className="text-sm text-gray-600">
                                            Showing 10 of {business.helpers_count || workers.length} workers.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Chat Popup */}
            {business && (
                <ChatPopup
                    recipientId={business.id}
                    recipientName={business.name}
                    recipientPhoto={business.photo}
                    isOpen={chatOpen}
                    onClose={() => setChatOpen(false)}
                />
            )}
        </PublicLayout>
    );
}


