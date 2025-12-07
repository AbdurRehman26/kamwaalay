import { useState, useEffect } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardService } from "@/services/dashboard";
import { Link } from "react-router-dom";
import { route } from "@/utils/routes";
import { isUser, isHelperOrBusiness } from "@/utils/permissions";

export default function DashboardOverview() {
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        dashboardService.getDashboard()
            .then((data) => {
                setDashboardData(data);
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
                {/* Welcome Section */}
                <div className="mb-10 relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none">
                    <div className="relative z-10">
                        <h1 className="text-3xl md:text-4xl font-bold mb-3">Welcome back, {user?.name?.split(" ")[0]}! 👋</h1>
                        <p className="text-indigo-100 text-lg max-w-xl">
                            Here's what's happening with your account today. You have a few items pending your attention.
                        </p>
                    </div>
                    {/* Decorative blobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-20 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl transform translate-y-1/2"></div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {/* Profile Status Card */}
                    <div className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-indigo-100 dark:hover:border-gray-600 transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-2xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                                👤
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${user?.onboarding_complete
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                    : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                                }`}>
                                {user?.onboarding_complete ? "Complete" : "Action Needed"}
                            </span>
                        </div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Profile Status</h3>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {user?.onboarding_complete ? "All Set" : "Incomplete"}
                        </p>
                    </div>

                    {/* Verification Card (Only for Helper/Business) */}
                    {isHelperOrBusiness(user) && (
                        <div className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-green-100 dark:hover:border-gray-600 transition-all duration-300">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-2xl text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-300">
                                    🛡️
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${user?.verification_status === "verified"
                                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                        : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                    }`}>
                                    {user?.verification_status === "verified" ? "Verified" : "Pending"}
                                </span>
                            </div>
                            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Account Verification</h3>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                                {user?.verification_status || "Pending"}
                            </p>
                        </div>
                    )}

                    {/* Account Type Card */}
                    <div className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-purple-100 dark:hover:border-gray-600 transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-2xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300">
                                🔑
                            </div>
                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-bold uppercase tracking-wide">
                                Role
                            </span>
                        </div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Account Type</h3>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                            {user?.role || "User"}
                        </p>
                    </div>
                </div>

                {/* Service Cards / Quick Actions */}
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    ⚡ Quick Actions
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {isUser(user) && (
                        <>
                            <Link
                                to={route("bookings.create")}
                                className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full group-hover:bg-indigo-500/10 transition-colors"></div>
                                <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">📅</div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Post a Job</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Create a new service request</p>
                            </Link>

                            <Link
                                to={route("bookings.index")}
                                className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full group-hover:bg-blue-500/10 transition-colors"></div>
                                <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">📋</div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">My Postings</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">View and manage jobs</p>
                            </Link>
                        </>
                    )}

                    {isHelperOrBusiness(user) && (
                        <>
                            <Link
                                to={route("service-listings.create")}
                                className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full group-hover:bg-emerald-500/10 transition-colors"></div>
                                <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">📝</div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Create Service</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Offer a new service</p>
                            </Link>

                            <Link
                                to="/dashboard/documents"
                                className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full group-hover:bg-amber-500/10 transition-colors"></div>
                                <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">📄</div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Documents</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your files</p>
                            </Link>
                        </>
                    )}

                    <Link
                        to={route("profile.edit")}
                        className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full group-hover:bg-purple-500/10 transition-colors"></div>
                        <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">⚙️</div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Edit Profile</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Update account info</p>
                    </Link>

                    <Link
                        to={route("messages")}
                        className="group relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-bl-full group-hover:bg-pink-500/10 transition-colors"></div>
                        <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">💬</div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">Messages</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Check your inbox</p>
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
}
