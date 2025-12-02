import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { businessesService } from "@/services/businesses";
import { route } from "@/utils/routes";
import { useAuth } from "@/contexts/AuthContext";
import RemoveWorkerModal from "@/Components/RemoveWorkerModal";

export default function Workers() {
    const { user } = useAuth();
    const [workers, setWorkers] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [workerToRemove, setWorkerToRemove] = useState(null);

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

    const handleDeleteClick = (worker) => {
        setWorkerToRemove(worker);
        setShowRemoveModal(true);
    };

    const handleDeleteConfirm = async (workerId) => {
        try {
            await businessesService.deleteWorker(workerId);
            // Refresh workers list
            const response = await businessesService.getWorkers();
            setWorkers(response.workers || { data: [], links: [] });
            setShowRemoveModal(false);
            setWorkerToRemove(null);
        } catch (err) {
            console.error("Error deleting worker:", err);
            alert(err.response?.data?.message || "Failed to delete worker");
            throw err; // Re-throw to let modal handle it
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
                                {workers.data.map((worker) => (
                                    <div key={worker.id} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="h-20 w-20 bg-gradient-to-br from-primary-400 to-primary-500 rounded-full flex items-center justify-center overflow-hidden">
                                                {worker.photo ? (
                                                    <img src={worker.photo.startsWith("http") ? worker.photo : `/storage/${worker.photo}`} alt={worker.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="text-4xl text-white">👤</div>
                                                )}
                                            </div>
                                            {worker.verification_status === "verified" && (
                                                <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-semibold">✓ Verified</span>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{worker.name || "Worker"}</h3>
                                        
                                        {/* Services */}
                                        {worker.service_listings && worker.service_listings.length > 0 && worker.service_listings[0].service_types && worker.service_listings[0].service_types.length > 0 ? (
                                            <div className="mb-3">
                                                <p className="text-xs font-semibold text-gray-700 mb-1">Services:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {worker.service_listings[0].service_types.map((st, idx) => {
                                                        const serviceType = typeof st === "object" ? st.service_type : st;
                                                        const serviceLabels = {
                                                            maid: "🧹 Maid",
                                                            cook: "👨‍🍳 Cook",
                                                            babysitter: "👶 Babysitter",
                                                            caregiver: "👵 Caregiver",
                                                            cleaner: "✨ Cleaner",
                                                            all_rounder: "🌟 All Rounder"
                                                        };
                                                        return (
                                                            <span key={idx} className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full capitalize">
                                                                {serviceLabels[serviceType] || serviceType?.replace("_", " ")}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : worker.service_type ? (
                                            <p className="text-gray-600 mb-2 capitalize text-sm">
                                                {worker.service_type.replace("_", " ")}
                                            </p>
                                        ) : null}

                                        {/* Skills */}
                                        {worker.skills && (
                                            <div className="mb-3">
                                                <p className="text-xs font-semibold text-gray-700 mb-1">Skills:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {worker.skills.split(",").map((skill, idx) => {
                                                        const trimmedSkill = skill.trim();
                                                        return trimmedSkill ? (
                                                            <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                                {trimmedSkill}
                                                            </span>
                                                        ) : null;
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Locations */}
                                        {worker.service_listings && worker.service_listings.length > 0 && worker.service_listings[0].location_details && worker.service_listings[0].location_details.length > 0 ? (
                                            <div className="mb-3">
                                                <p className="text-xs font-semibold text-gray-700 mb-1">Locations:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {worker.service_listings[0].location_details.map((loc, idx) => (
                                                        <span key={idx} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                                            📍 {loc.city_name || loc.city}{loc.area ? `, ${loc.area}` : ""}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (worker.city || worker.area) ? (
                                            <div className="mb-3">
                                                <p className="text-xs font-semibold text-gray-700 mb-1">Location:</p>
                                                <p className="text-sm text-gray-600">
                                                    {worker.city || ""}{worker.city && worker.area ? ", " : ""}{worker.area || ""}
                                                </p>
                                            </div>
                                        ) : null}

                                        {user && user.id === worker.id ? (
                                            <div className="text-center py-2 text-sm text-gray-500 italic">
                                                This is you
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <Link
                                                    to={route("business.workers.edit", worker.id)}
                                                    className="flex-1 text-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteClick(worker)}
                                                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
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

            <RemoveWorkerModal
                show={showRemoveModal}
                onClose={() => {
                    setShowRemoveModal(false);
                    setWorkerToRemove(null);
                }}
                worker={workerToRemove}
                onConfirm={handleDeleteConfirm}
            />
        </DashboardLayout>
    );
}

