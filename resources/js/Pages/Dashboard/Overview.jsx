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
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 text-center">
                        <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
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
                        <p className="text-red-600 dark:text-red-400">{error}</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Welcome back, {user?.name}!</p>
                    </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Profile Status</h3>
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-500 rounded-xl flex items-center justify-center shadow-md">
                                <span className="text-xl text-white">👤</span>
                            </div>
                        </div>
                        {user?.onboarding_complete ? (
                            <div>
                                <p className="text-lg font-bold text-green-600 dark:text-green-400 mb-1">Complete</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Your profile is set up</p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400 mb-1">In Progress</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Complete your profile</p>
                            </div>
                        )}
                    </div>

                    {isHelperOrBusiness(user) && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Verification</h3>
                                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-xl flex items-center justify-center shadow-md">
                                    <span className="text-xl text-white">✓</span>
                                </div>
                            </div>
                            {user?.verification_status === "verified" ? (
                                <div>
                                    <p className="text-lg font-bold text-green-600 dark:text-green-400 mb-1">Verified</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Your documents are verified</p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400 mb-1">Pending</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Awaiting verification</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Account Type</h3>
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center shadow-md">
                                <span className="text-xl text-white">🔑</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-primary-600 dark:text-primary-400 mb-1 capitalize">{user?.role || "User"}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Your account role</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {isUser(user) && (
                            <>
                                <Link
                                    to={route("bookings.create")}
                                    className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors duration-300 border border-primary-200 dark:border-primary-800"
                                >
                                    <div className="text-2xl mb-2">📅</div>
                                    <div className="font-semibold text-primary-700 dark:text-primary-300">Post a Job</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Create a job posting</div>
                                </Link>
                                <Link
                                    to={route("bookings.index")}
                                    className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-300 border border-blue-200 dark:border-blue-800"
                                >
                                    <div className="text-2xl mb-2">📋</div>
                                    <div className="font-semibold text-blue-700 dark:text-blue-300">My Job Postings</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">View your bookings</div>
                                </Link>
                            </>
                        )}
                        {isHelperOrBusiness(user) && (
                            <>
                                <Link
                                    to={route("service-listings.create")}
                                    className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors duration-300 border border-green-200 dark:border-green-800"
                                >
                                    <div className="text-2xl mb-2">➕</div>
                                    <div className="font-semibold text-green-700 dark:text-green-300">Create Service</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Offer your service</div>
                                </Link>
                                <Link
                                    to="/dashboard/documents"
                                    className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors duration-300 border border-yellow-200 dark:border-yellow-800"
                                >
                                    <div className="text-2xl mb-2">📄</div>
                                    <div className="font-semibold text-yellow-700 dark:text-yellow-300">Documents</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Manage documents</div>
                                </Link>
                            </>
                        )}
                        <Link
                            to={route("profile.edit")}
                            className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors duration-300 border border-purple-200 dark:border-purple-800"
                        >
                            <div className="text-2xl mb-2">⚙️</div>
                            <div className="font-semibold text-purple-700 dark:text-purple-300">Edit Profile</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Update your information</div>
                        </Link>
                        <Link
                            to={route("messages")}
                            className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors duration-300 border border-indigo-200 dark:border-indigo-800"
                        >
                            <div className="text-2xl mb-2">💬</div>
                            <div className="font-semibold text-indigo-700 dark:text-indigo-300">Messages</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">View your messages</div>
                        </Link>
                    </div>
                </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
