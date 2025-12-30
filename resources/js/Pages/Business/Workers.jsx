// Head removed
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { businessesService } from "@/services/businesses";
import { route } from "@/utils/routes";

export default function Workers() {
    const [workers, setWorkers] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        businessesService.getWorkers()
            .then((response) => {
                setWorkers(response.workers || { data: [], links: [] });
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching workers:", err);
                setError(err.response?.data?.message || "Failed to load workers");
                setLoading(false);
            });
    }, []);

    const handleDelete = async (workerId) => {
        if (confirm("Are you sure you want to remove this worker?")) {
            try {
                await businessesService.deleteWorker(workerId);
                // Refresh workers list
                const response = await businessesService.getWorkers();
                setWorkers(response.workers || { data: [], links: [] });
            } catch (err) {
                console.error("Error deleting worker:", err);
                alert(err.response?.data?.message || "Failed to delete worker");
            }
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 text-center">
                        <p className="text-gray-600">Loading workers...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 text-center">
                        <p className="text-red-600">{error}</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }
    return (
        <DashboardLayout>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Workers</h2>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">Add and manage workers in your agency</p>
                        </div>
                        <Link
                            to={route("business.workers.create")}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-bold"
                        >
                            ➕ Add Worker
                        </Link>
                    </div>

                    {workers.data && workers.data.length > 0 ? (
                        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                                {workers.data.map((worker) => {
                                    // Get all unique service types from all listings
                                    const allServiceTypesMap = new Map();
                                    if (worker.service_listings && worker.service_listings.length > 0) {
                                        worker.service_listings.forEach(listing => {
                                            if (listing.service_types && Array.isArray(listing.service_types)) {
                                                listing.service_types.forEach(st => {
                                                    if (typeof st === "object" && st.id) {
                                                        // New format: object with id, name, slug, icon
                                                        allServiceTypesMap.set(st.id, {
                                                            id: st.id,
                                                            name: st.name,
                                                            icon: st.icon || ""
                                                        });
                                                    } else if (typeof st === "string") {
                                                        // Old format: just slug string
                                                        allServiceTypesMap.set(st, {
                                                            name: st.replace(/_/g, " "),
                                                            icon: ""
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                    const serviceTypes = Array.from(allServiceTypesMap.values());

                                    // Get all unique locations from all listings
                                    const allLocations = new Set();
                                    if (worker.service_listings && worker.service_listings.length > 0) {
                                        worker.service_listings.forEach(listing => {
                                            if (listing.location_details && Array.isArray(listing.location_details)) {
                                                listing.location_details.forEach(loc => {
                                                    const area = loc.area || "";
                                                    if (area) {
                                                        allLocations.add(area);
                                                    }
                                                });
                                            }
                                        });
                                    }
                                    const locations = Array.from(allLocations);

                                    // Format availability
                                    const availabilityLabels = {
                                        "full_time": "Full Time",
                                        "part_time": "Part Time",
                                        "available": "Available"
                                    };

                                    // Format date
                                    const joinedDate = worker.created_at
                                        ? new Date(worker.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                                        : null;

                                    // Helper function to convert to title case
                                    const toTitleCase = (str) => {
                                        return str.replace(/\w\S*/g, (txt) => {
                                            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                                        });
                                    };

                                    return (
                                        <div key={worker.id} className="flex flex-col h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
                                            <div className="flex-1">
                                                {/* Header with Photo and Status */}
                                                <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-16 w-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-indigo-200 dark:border-indigo-700">
                                                            {worker.photo ? (
                                                                <img src={`/storage/${worker.photo}`} alt={worker.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="text-3xl text-white">👤</div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{worker.name}</h3>
                                                            {worker.phone && (
                                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">📱 {worker.phone}</p>
                                                            )}
                                                            <div className="flex items-center gap-2 mt-1">
                                                                {worker.verification_status === "verified" ? (
                                                                    <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-2 py-0.5 rounded-full font-semibold">✓ Verified</span>
                                                                ) : (
                                                                    <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs px-2 py-0.5 rounded-full font-semibold">Pending</span>
                                                                )}
                                                                {worker.is_active !== false ? (
                                                                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full font-semibold">Active</span>
                                                                ) : (
                                                                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full font-semibold">Inactive</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Service Types */}
                                                {serviceTypes.length > 0 && (
                                                    <div className="mb-4">
                                                        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Services</div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {serviceTypes.slice(0, 3).map((type, idx) => (
                                                                <span key={idx} className="inline-flex items-center gap-1 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 text-xs px-3 py-1 rounded-full font-semibold border-2 border-indigo-200 dark:border-indigo-700">
                                                                    {type.icon && <span>{type.icon}</span>}
                                                                    <span>{toTitleCase(type.name)}</span>
                                                                </span>
                                                            ))}
                                                            {serviceTypes.length > 3 && (
                                                                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-3 py-1 rounded-full font-semibold">
                                                                    +{serviceTypes.length - 3} more
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Pin Address (Primary Location) */}
                                                {worker.profile?.pin_address && (
                                                    <div className="mb-4">
                                                        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Location</div>
                                                        <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                            <span className="text-lg">📍</span>
                                                            <span className="line-clamp-2">{worker.profile.pin_address}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Locations */}
                                                {locations.length > 0 && (
                                                    <div className="mb-4">
                                                        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Locations</div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {locations.slice(0, 3).map((location, idx) => (
                                                                <span key={idx} className="inline-flex items-center gap-1 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 text-xs px-3 py-1 rounded-full font-semibold border-2 border-green-200 dark:border-green-700">
                                                                    <span>📍</span>
                                                                    <span>{location}</span>
                                                                </span>
                                                            ))}
                                                            {locations.length > 3 && (
                                                                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs px-3 py-1 rounded-full font-semibold">
                                                                    +{locations.length - 3} more
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Experience & Availability */}
                                                <div className="grid grid-cols-2 gap-3 mb-4">
                                                    {worker.experience_years !== null && worker.experience_years !== undefined && (
                                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-2">
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Experience</div>
                                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{worker.experience_years} {worker.experience_years === 1 ? "year" : "years"}</div>
                                                        </div>
                                                    )}
                                                    {worker.availability && (
                                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-2">
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Availability</div>
                                                            <div className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                                                                {availabilityLabels[worker.availability] || worker.availability}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Age, Gender, Religion */}
                                                <div className="grid grid-cols-2 gap-3 mb-4">
                                                    {worker.age && (
                                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-2">
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Age</div>
                                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{worker.age} years</div>
                                                        </div>
                                                    )}
                                                    {worker.gender && (
                                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-2">
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Gender</div>
                                                            <div className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{worker.gender}</div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Religion */}
                                                {worker.religion && (
                                                    <div className="mb-4">
                                                        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Religion</div>
                                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                                            {typeof worker.religion === "object" && worker.religion?.label
                                                                ? worker.religion.label
                                                                : typeof worker.religion === "string"
                                                                    ? worker.religion.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
                                                                    : "Not specified"}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Languages */}
                                                {worker.languages && worker.languages.length > 0 && (
                                                    <div className="mb-4">
                                                        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Languages</div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {worker.languages.map((lang, idx) => (
                                                                <span key={idx} className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 text-xs px-3 py-1 rounded-full font-semibold border-2 border-blue-200 dark:border-blue-700">
                                                                    {typeof lang === "object" && lang?.name ? lang.name : lang}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Skills */}
                                                {worker.skills && (
                                                    <div className="mb-4">
                                                        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Skills</div>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{worker.skills}</p>
                                                    </div>
                                                )}

                                                {/* Bio */}
                                                {worker.bio && (
                                                    <div className="mb-4">
                                                        <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Bio</div>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{worker.bio}</p>
                                                    </div>
                                                )}

                                                {/* Joined Date */}
                                                {joinedDate && (
                                                    <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                                                        Joined: {joinedDate}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2 mt-4">
                                                <Link
                                                    to={route("business.workers.edit", worker.id)}
                                                    className="flex-1 text-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-xl transition-all duration-300 text-sm font-bold shadow-md hover:shadow-lg"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(worker.id)}
                                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition-all duration-300 text-sm font-bold shadow-md hover:shadow-lg"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {workers.links && workers.links.length > 3 && (
                                <div className="px-6 py-4 border-t border-gray-200">
                                    <div className="flex justify-center space-x-2">
                                        {workers.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                to={link.url || "#"}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${link.active
                                                    ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg"
                                                    : "bg-white text-gray-700 hover:bg-gray-100 shadow-md"
                                                    } ${!link.url && "cursor-not-allowed opacity-50"}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700">
                            <div className="text-6xl mb-4">👥</div>
                            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No Workers Yet</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">Start building your agency by adding your first worker</p>
                            <Link
                                to={route("business.workers.create")}
                                className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-bold"
                            >
                                Add Your First Worker
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}

