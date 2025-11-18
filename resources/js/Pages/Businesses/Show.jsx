import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import PublicLayout from "@/Layouts/PublicLayout";
import { businessesService } from "@/services/businesses";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";

export default function BusinessShow() {
    const { businessId } = useParams();
    const { user } = useAuth();
    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [serviceListings, setServiceListings] = useState([]);
    const [workers, setWorkers] = useState([]);

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
                                {business.email && (
                                    <div>
                                        <p className="text-sm text-gray-600">Email</p>
                                        <p className="font-semibold text-gray-900">{business.email}</p>
                                    </div>
                                )}
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

                        {/* Action Buttons */}
                        {user && (
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <Link
                                    to={route("service-listings.index", {
                                        user_id: business.id,
                                    })}
                                    className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold text-center block mb-3"
                                >
                                    View All Services
                                </Link>
                                <Link
                                    to={route("bookings.create")}
                                    className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-all duration-300 font-semibold text-center block"
                                >
                                    Request Service
                                </Link>
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
                                                        listing.service_types.slice(0, 2).map((st, idx) => (
                                                            <span key={idx} className="bg-primary-600 text-white text-sm px-3 py-1 rounded-full font-semibold capitalize">
                                                                {st?.service_type?.replace("_", " ") || "Service"}
                                                            </span>
                                                        ))
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
                                            <p className="text-sm text-gray-600 mb-3">
                                                📍 {listing.locations && listing.locations.length > 0 ? `${listing.locations[0].city}, ${listing.locations[0].area}` : "Location not specified"}
                                            </p>
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
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center">
                                                    <span className="text-yellow-400 text-lg mr-1">⭐</span>
                                                    <span className="font-semibold">{worker.rating || 0}</span>
                                                    <span className="text-gray-500 text-sm ml-1">({worker.total_reviews || 0})</span>
                                                </div>
                                                {worker.verification_status === "verified" && (
                                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">
                                                        ✓ Verified
                                                    </span>
                                                )}
                                            </div>
                                            {worker.experience_years && (
                                                <p className="text-sm text-gray-600 mb-2">
                                                    💼 {worker.experience_years} years experience
                                                </p>
                                            )}
                                            {worker.service_listings && worker.service_listings.length > 0 && (
                                                <p className="text-xs text-gray-500">
                                                    📋 {worker.service_listings.length} service listing{worker.service_listings.length !== 1 ? "s" : ""}
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
                                            <Link to={route("business.workers")} className="text-primary-600 hover:text-primary-800 ml-1 font-semibold">
                                                View All →
                                            </Link>
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}


