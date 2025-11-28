// Head removed
import PublicLayout from "@/Layouts/PublicLayout";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { route } from "@/utils/routes";
import { serviceListingsService } from "@/services/serviceListings";

export default function MyServiceListings() {
    const [listings, setListings] = useState({ data: [], links: [], meta: {} });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        serviceListingsService.getMyListings()
            .then((data) => {
                setListings(data.listings || { data: [], links: [], meta: {} });
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching listings:", error);
                setLoading(false);
            });
    }, []);
    const getStatusColor = (status) => {
        switch (status) {
            case "active":
                return "bg-green-100 text-green-800";
            case "paused":
                return "bg-yellow-100 text-yellow-800";
            case "closed":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <PublicLayout>
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-600 text-white py-10 shadow-lg">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">My Service Listings</h1>
                                <p className="text-base text-white/90 mb-2">Manage your service offerings</p>
                                <div className="flex items-center gap-2 text-white/80">
                                    <span className="text-lg">💡</span>
                                    <p className="text-xs">
                                        You can create multiple listings for different services and locations
                                    </p>
                                </div>
                            </div>
                            <Link
                                to={route("service-listings.create")}
                                className="group bg-white text-primary-600 px-6 py-3 rounded-lg hover:bg-gray-50 transition-all duration-300 font-bold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2"
                            >
                                <span className="text-lg">➕</span>
                                Add New Listing
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {loading ? (
                        <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-100">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-3"></div>
                            <p className="text-gray-600 text-sm font-medium">Loading your listings...</p>
                        </div>
                    ) : listings.data && listings.data.length > 0 ? (
                        <>
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">
                                        {listings.meta?.total || listings.data.length} {listings.meta?.total === 1 ? "Listing" : "Listings"}
                                    </h2>
                                    <p className="text-gray-600 mt-0.5 text-sm">All your service offerings</p>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4 mb-6">
                                {listings.data.map((listing) => (
                                    <div key={listing.id} className="group bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 transform hover:-translate-y-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
                                                        <span className="text-xl">📋</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-bold text-gray-900 mb-1">{listing.service_type_label}</h3>
                                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(listing.status)}`}>
                                                            {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 mb-3">
                                                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                                                        <span className="text-primary-600 font-bold">📍</span>
                                                        <span className="capitalize">
                                                            {listing.work_type?.replace("_", " ") || "N/A"} • {listing.city || "N/A"}, {listing.area || "N/A"}
                                                        </span>
                                                    </div>
                                                    {listing.monthly_rate && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-primary-600 font-bold">💰</span>
                                                            <span className="text-lg font-bold text-green-600">
                                                                PKR {listing.monthly_rate.toLocaleString()}/month
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                {listing.description && (
                                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border-l-4 border-primary-500">
                                                        <p className="text-gray-700 text-xs line-clamp-3">{listing.description}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                                            <Link
                                                to={route("service-listings.show", listing.id)}
                                                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-all duration-300 font-semibold text-sm text-center shadow-md hover:shadow-lg"
                                            >
                                                View Details
                                            </Link>
                                            <Link
                                                to={route("service-listings.edit", listing.id)}
                                                className="flex-1 bg-white text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 transition-all duration-300 font-semibold text-sm text-center border-2 border-primary-600 hover:border-primary-700"
                                            >
                                                Edit
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Pagination */}
                            {listings.links && listings.links.length > 3 && (
                                <div className="mt-8 flex justify-center">
                                    <div className="flex space-x-2 bg-white p-3 rounded-xl shadow-md border border-gray-100">
                                        {listings.links.map((link, index) => (
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
                            <div className="text-5xl mb-4">📋</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No service listings yet</h3>
                            <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
                                Create your first service listing to start offering your services to clients
                            </p>
                            <Link
                                to={route("service-listings.create")}
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-md hover:shadow-lg font-bold text-sm transform hover:-translate-y-1"
                            >
                                <span className="text-lg">➕</span>
                                Create Service Listing
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}

