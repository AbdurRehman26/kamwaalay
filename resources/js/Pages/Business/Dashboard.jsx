import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { businessesService } from "@/services/businesses";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";

export default function BusinessDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentWorkers, setRecentWorkers] = useState([]);
    const [recentBookings, setRecentBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("workers"); // 'workers' or 'bookings'

    useEffect(() => {
        businessesService.getDashboard()
            .then((response) => {
                setStats(response.stats);
                setRecentWorkers(response.recent_workers || []);
                setRecentBookings(response.recent_bookings || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching dashboard:", err);
                setError(err.response?.data?.message || "Failed to load dashboard");
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex h-[calc(100vh-64px)] items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-gray-500 animate-pulse">Loading dashboard...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="flex h-[calc(100vh-64px)] items-center justify-center">
                    <div className="text-center p-8 max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-red-100 dark:border-red-900/30">
                        <div className="text-4xl mb-4">⚠️</div>
                        <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Something went wrong</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-10 relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">Business Dashboard</h1>
                            <p className="text-indigo-100 text-lg max-w-2xl">
                                Manage your agency workers and bookings efficiently.
                            </p>
                        </div>
                        <Link
                            to={route("business.workers.create")}
                            className="inline-flex items-center justify-center px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-all duration-300 shadow-lg group whitespace-nowrap"
                        >
                            <span className="mr-2 text-xl group-hover:rotate-90 transition-transform">➕</span>
                            Add New Worker
                        </Link>
                    </div>
                    {/* Decorative blobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-20 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl transform translate-y-1/2"></div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                        <div className="flex flex-col">
                            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total Workers</span>
                            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats?.total_workers || 0}</div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
                        <div className="flex flex-col">
                            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Active Workers</span>
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats?.active_workers || 0}</div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 border-l-4 border-l-yellow-500">
                        <div className="flex flex-col">
                            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Pending</span>
                            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats?.pending_verification || 0}</div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 border-l-4 border-l-indigo-500">
                        <div className="flex flex-col">
                            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Verified</span>
                            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats?.verified_workers || 0}</div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                        <div className="flex flex-col">
                            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total Bookings</span>
                            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats?.total_bookings || 0}</div>
                        </div>
                    </div>
                </div>

                {/* Tabs Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-indigo-100/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {/* Tab Headers */}
                    <div className="border-b border-gray-100 dark:border-gray-700">
                        <nav className="flex" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab("workers")}
                                className={`flex-1 py-5 px-6 text-center font-bold text-sm transition-all relative ${activeTab === "workers"
                                    ? "text-indigo-600 dark:text-indigo-400"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                    }`}
                            >
                                Recent Workers
                                {recentWorkers && recentWorkers.length > 0 && (
                                    <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${activeTab === "workers"
                                        ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                        }`}>
                                        {recentWorkers.length}
                                    </span>
                                )}
                                {activeTab === "workers" && (
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 dark:bg-indigo-400 rounded-t-full"></div>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab("bookings")}
                                className={`flex-1 py-5 px-6 text-center font-bold text-sm transition-all relative ${activeTab === "bookings"
                                    ? "text-indigo-600 dark:text-indigo-400"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                    }`}
                            >
                                Recent Bookings
                                {recentBookings && recentBookings.length > 0 && (
                                    <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${activeTab === "bookings"
                                        ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                        }`}>
                                        {recentBookings.length}
                                    </span>
                                )}
                                {activeTab === "bookings" && (
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 dark:bg-indigo-400 rounded-t-full"></div>
                                )}
                            </button>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6 md:p-8">
                        {activeTab === "workers" && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Added Workers</h3>
                                    <Link
                                        to={route("business.workers.index")}
                                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-bold flex items-center gap-1 group"
                                    >
                                        View All <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </Link>
                                </div>
                                {recentWorkers && recentWorkers.length > 0 ? (
                                    <div className="space-y-4">
                                        {recentWorkers.map((worker) => (
                                            <div key={worker.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                                                        {worker.user?.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white">{worker.user?.name}</div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                                                            {worker.service_listings && worker.service_listings.length > 0 && worker.service_listings[0].service_types && worker.service_listings[0].service_types.length > 0
                                                                ? worker.service_listings?.[0]?.service_types?.[0]?.service_type?.replace("_", " ") || "No service type"
                                                                : "No service type"}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-sm">
                                                    {worker.verification_status === "verified" ? (
                                                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-bold text-xs">Verified</span>
                                                    ) : (
                                                        <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full font-bold text-xs">Pending</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="text-5xl mb-4">👥</div>
                                        <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't added any workers yet.</p>
                                        <Link
                                            to={route("business.workers.create")}
                                            className="inline-block px-5 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 font-bold rounded-lg hover:bg-indigo-100 transition-colors"
                                        >
                                            Add Your First Worker
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "bookings" && (
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Incoming Bookings</h3>
                                    <Link
                                        to={route("job-posts.index")}
                                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-bold flex items-center gap-1 group"
                                    >
                                        View All <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </Link>
                                </div>
                                {recentBookings && recentBookings.length > 0 ? (
                                    <div className="space-y-4">
                                        {recentBookings.map((booking) => (
                                            <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold">
                                                        {booking.user?.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white">{booking.user?.name}</div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{booking.service_type?.replace("_", " ") || "N/A"}</div>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${booking.status === "confirmed" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" :
                                                    booking.status === "pending" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300" :
                                                        "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                                                    }`}>
                                                    {booking.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="text-5xl mb-4">📅</div>
                                        <p className="text-gray-500 dark:text-gray-400">No bookings received yet.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
