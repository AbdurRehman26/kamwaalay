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
            
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold mb-4">My Service Listings</h1>
                            <p className="text-xl text-white/90">Manage your service offerings</p>
                            <p className="text-sm text-white/80 mt-2">
                                💡 You can create multiple listings for different services and locations
                            </p>
                        </div>
                        <Link
                            to={route("service-listings.create")}
                            className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition duration-300 font-semibold"
                        >
                            + Add New Listing
                        </Link>
                    </div>
                </div>
            </div>
            <div className="container mx-auto px-4 py-12">
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600">Loading your listings...</p>
                    </div>
                ) : listings.data && listings.data.length > 0 ? (
                    <div className="space-y-6">
                        {listings.data.map((listing) => (
                            <div key={listing.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-gray-900">{listing.service_type_label}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(listing.status)}`}>
                                                {listing.status}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 mb-2 capitalize">
                                            {listing.work_type?.replace("_", " ") || "N/A"} • {listing.city || "N/A"}, {listing.area || "N/A"}
                                        </p>
                                        {listing.monthly_rate && (
                                            <p className="text-lg font-bold text-green-600">PKR {listing.monthly_rate}/month</p>
                                        )}
                                        {listing.description && (
                                            <p className="text-gray-600 text-sm mt-3 line-clamp-2">{listing.description}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <Link
                                            to={route("service-listings.show", listing.id)}
                                            className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-200 transition duration-300 font-medium text-sm"
                                        >
                                            View
                                        </Link>
                                        <Link
                                            to={route("service-listings.edit", listing.id)}
                                            className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-200 transition duration-300 font-medium text-sm"
                                        >
                                            Edit
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {/* Pagination */}
                        {listings.links && listings.links.length > 3 && (
                            <div className="mt-8 flex justify-center">
                                <div className="flex space-x-2">
                                    {listings.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            to={link.url || "#"}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                                                link.active
                                                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                                                    : "bg-white text-gray-700 hover:bg-gray-100 shadow-md"
                                            } ${!link.url && "cursor-not-allowed opacity-50"}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-xl">
                        <div className="text-6xl mb-4">📋</div>
                        <p className="text-gray-600 text-xl mb-6">No service listings yet</p>
                        <p className="text-gray-500 mb-8">Create your first service listing to get started</p>
                        <Link
                            to={route("service-listings.create")}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg font-semibold inline-block"
                        >
                            Create Service Listing
                        </Link>
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}

