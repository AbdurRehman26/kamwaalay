import DashboardLayout from "@/Layouts/DashboardLayout";
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
                return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
            case "paused":
                return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
            case "closed":
                return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
            default:
                return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
        }
    };

    const toTitleCase = (str) => {
        if (!str) return "";
        return str
            .replace(/_/g, " ")
            .toLowerCase()
            .split(" ")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    const getCityDisplayName = (listing) => {
        let cityName = "";

        // Try getting city from location details (assuming all locations are in same city)
        if (listing.location_details && listing.location_details.length > 0) {
            cityName = listing.location_details[0].city_name;
        } else if (listing.city) { // Fallback
            cityName = listing.city;
        }

        if (!cityName) return null;

        const lowerCity = cityName.toLowerCase();
        if (lowerCity === "karachi") return "Khi";
        if (lowerCity === "islamabad") return "Isb";
        if (lowerCity === "lahore") return "Lahore";

        return cityName;
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-10 relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">My Service Listings</h1>
                            <p className="text-indigo-100 text-lg max-w-2xl">
                                Manage your service offerings and availability.
                            </p>
                        </div>
                        <Link
                            to={route("service-listings.create")}
                            className="inline-flex items-center justify-center px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-all duration-300 shadow-lg group whitespace-nowrap"
                        >
                            <span className="mr-2 text-xl group-hover:rotate-90 transition-transform">➕</span>
                            Add New Listing
                        </Link>
                    </div>
                    {/* Decorative blobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-20 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl transform translate-y-1/2"></div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <p className="text-gray-500 animate-pulse">Loading listings...</p>
                        </div>
                    </div>
                ) : listings.data && listings.data.length > 0 ? (
                    <>
                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            {listings.data.map((listing) => (
                                <div key={listing.id} className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all duration-300">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                                                    <span className="text-xl">📋</span>
                                                </div>
                                                <div className="flex-1">
                                                    {/* Services */}
                                                    {listing.service_types && listing.service_types.length > 0 ? (
                                                        <div className="mb-1">
                                                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                                                {listing.service_types.slice(0, 2).map((st, idx) => (
                                                                    <span key={idx}>
                                                                        {typeof st === "string" ? toTitleCase(st) : toTitleCase(st?.service_type || "Service")}
                                                                        {idx < Math.min(listing.service_types.length, 2) - 1 && ", "}
                                                                    </span>
                                                                ))}
                                                                {listing.service_types.length > 2 && (
                                                                    <span className="text-gray-600 dark:text-gray-400 font-normal">
                                                                        {" "}+{listing.service_types.length - 2} more
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{toTitleCase(listing.service_type_label) || "Service"}</h3>
                                                    )}
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(listing.status)}`}>
                                                        {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="space-y-2 mb-3">
                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                                                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">💼</span>
                                                    <span className="capitalize">
                                                        {listing.work_type?.replace("_", " ") || "N/A"}
                                                    </span>
                                                </div>
                                                {/* Locations */}
                                                {listing.location_details && listing.location_details.length > 0 ? (
                                                    <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400 text-sm">
                                                        <span className="text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">📍</span>
                                                        <div className="flex-1">
                                                            <span>
                                                                {listing.location_details.slice(0, 2).map((loc, idx) => (
                                                                    <span key={idx}>
                                                                        {loc.area || loc.city_name}
                                                                        {idx < Math.min(listing.location_details.length, 2) - 1 && ", "}
                                                                    </span>
                                                                ))}
                                                                {listing.location_details.length > 2 && (
                                                                    <span className="text-gray-500 dark:text-gray-500">
                                                                        {" "}+{listing.location_details.length - 2} more
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : listing.area ? (
                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                                                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">📍</span>
                                                        <span>{listing.area}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-500 text-sm">
                                                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">📍</span>
                                                        <span>Location not specified</span>
                                                    </div>
                                                )}
                                                {listing.monthly_rate && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">💰</span>
                                                        <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                                            PKR {listing.monthly_rate.toLocaleString()}/month
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            {listing.description && (
                                                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-l-4 border-indigo-500">
                                                    <p className="text-gray-700 dark:text-gray-300 text-xs line-clamp-3">{listing.description}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* City Badge */}
                                        {getCityDisplayName(listing) && (
                                            <div className="ml-2 flex-shrink-0">
                                                <span className="inline-block px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-lg uppercase tracking-wider shadow-sm border border-gray-200 dark:border-gray-600">
                                                    {getCityDisplayName(listing)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                                        <Link
                                            to={route("service-listings.show", listing.id)}
                                            className="flex-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all duration-300 font-bold text-sm text-center"
                                        >
                                            View Details
                                        </Link>
                                        <Link
                                            to={route("service-listings.edit", listing.id)}
                                            className="flex-1 bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300 font-bold text-sm text-center border-2 border-indigo-600 dark:border-indigo-500"
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
                                <div className="flex flex-wrap justify-center gap-2">
                                    {listings.links.map((link, index) => (
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
                        <div className="text-7xl mb-6 opacity-80">📋</div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No service listings yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
                            Create your first service listing to start offering your services to clients.
                        </p>
                        <Link
                            to={route("service-listings.create")}
                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-1"
                        >
                            <span className="mr-2 text-xl">✨</span> Create Service Listing
                        </Link>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
