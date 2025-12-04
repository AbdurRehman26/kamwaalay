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
                            <h2 className="text-3xl font-bold text-gray-900">Manage Workers</h2>
                            <p className="mt-2 text-gray-600">Add and manage workers in your agency</p>
                        </div>
                        <Link
                            to={route("business.workers.create")}
                            className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg font-semibold"
                        >
                            ➕ Add Worker
                        </Link>
                    </div>

                    {workers.data && workers.data.length > 0 ? (
                        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                                {workers.data.map((worker) => {
                                    // Get all service types
                                    const serviceTypes = worker.service_listings && worker.service_listings.length > 0
                                        ? worker.service_listings.flatMap(listing => 
                                            listing.service_types?.map(st => st.service_type?.replace("_", " ")) || []
                                          ).filter(Boolean)
                                        : [];
                                    
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

                                    return (
                                        <div key={worker.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all duration-300">
                                            {/* Header with Photo and Status */}
                                            <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-16 w-16 bg-gradient-to-br from-primary-400 to-primary-500 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        {worker.photo ? (
                                                            <img src={`/storage/${worker.photo}`} alt={worker.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="text-3xl text-white">👤</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-gray-900">{worker.name}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {worker.verification_status === "verified" ? (
                                                                <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-semibold">✓ Verified</span>
                                                            ) : (
                                                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-semibold">Pending</span>
                                                            )}
                                                            {worker.is_active !== false ? (
                                                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-semibold">Active</span>
                                                            ) : (
                                                                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full font-semibold">Inactive</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Contact Information */}
                                            <div className="mb-4 space-y-2">
                                                {worker.email && (
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <span className="mr-2">📧</span>
                                                        <span className="truncate">{worker.email}</span>
                                                    </div>
                                                )}
                                                {worker.phone && (
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <span className="mr-2">📞</span>
                                                        <span>{worker.phone}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Service Types */}
                                            {serviceTypes.length > 0 && (
                                                <div className="mb-4">
                                                    <div className="text-xs font-semibold text-gray-500 mb-2 uppercase">Services</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {serviceTypes.map((type, idx) => (
                                                            <span key={idx} className="bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-md font-medium capitalize">
                                                                {type}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Location */}
                                            {(worker.city || worker.area) && (
                                                <div className="mb-4">
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <span className="mr-2">📍</span>
                                                        <span>{[worker.city, worker.area].filter(Boolean).join(", ")}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Experience & Availability */}
                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                {worker.experience_years !== null && worker.experience_years !== undefined && (
                                                    <div className="bg-gray-50 rounded-lg p-2">
                                                        <div className="text-xs text-gray-500 mb-1">Experience</div>
                                                        <div className="text-sm font-semibold text-gray-900">{worker.experience_years} {worker.experience_years === 1 ? "year" : "years"}</div>
                                                    </div>
                                                )}
                                                {worker.availability && (
                                                    <div className="bg-gray-50 rounded-lg p-2">
                                                        <div className="text-xs text-gray-500 mb-1">Availability</div>
                                                        <div className="text-sm font-semibold text-gray-900 capitalize">
                                                            {availabilityLabels[worker.availability] || worker.availability}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Skills */}
                                            {worker.skills && (
                                                <div className="mb-4">
                                                    <div className="text-xs font-semibold text-gray-500 mb-2">Skills</div>
                                                    <p className="text-sm text-gray-700 line-clamp-2">{worker.skills}</p>
                                                </div>
                                            )}

                                            {/* Bio */}
                                            {worker.bio && (
                                                <div className="mb-4">
                                                    <div className="text-xs font-semibold text-gray-500 mb-2">Bio</div>
                                                    <p className="text-sm text-gray-700 line-clamp-2">{worker.bio}</p>
                                                </div>
                                            )}

                                            {/* Rating */}
                                            <div className="flex items-center mb-4 pb-4 border-b border-gray-200">
                                                <span className="text-yellow-500 mr-2 text-lg">⭐</span>
                                                <span className="font-bold text-gray-900">{worker.rating ? worker.rating.toFixed(1) : "0.0"}</span>
                                                <span className="text-gray-500 ml-2 text-sm">({worker.total_reviews || 0} {worker.total_reviews === 1 ? "review" : "reviews"})</span>
                                            </div>

                                            {/* Joined Date */}
                                            {joinedDate && (
                                                <div className="mb-4 text-xs text-gray-500">
                                                    Joined: {joinedDate}
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex gap-2 mt-4">
                                                <Link
                                                    to={route("business.workers.edit", worker.id)}
                                                    className="flex-1 text-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(worker.id)}
                                                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
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
                                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                                                    link.active
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
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                            <div className="text-6xl mb-4">👥</div>
                            <h3 className="text-xl font-semibold mb-2 text-gray-900">No Workers Yet</h3>
                            <p className="text-gray-600 mb-6">Start building your agency by adding your first worker</p>
                            <Link
                                to={route("business.workers.create")}
                                className="inline-block bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg font-semibold"
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

