import DashboardLayout from "@/Layouts/DashboardLayout";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";
import { businessesService } from "@/services/businesses";

export default function DashboardOverview() {
    const { user } = useAuth();
    const [businessStats, setBusinessStats] = useState(null);
    const [businessLoading, setBusinessLoading] = useState(false);

    useEffect(() => {
        if (user?.role === "business") {
            setBusinessLoading(true);
            businessesService.getDashboard()
                .then((response) => {
                    setBusinessStats(response.stats);
                    setBusinessLoading(false);
                })
                .catch((err) => {
                    console.error("Error fetching business dashboard:", err);
                    setBusinessLoading(false);
                });
        }
    }, [user]);

    return (
        <DashboardLayout>
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
                {/* Welcome Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Welcome back, {user?.name || "User"}!
                    </h1>
                    <p className="text-sm text-gray-600">Manage your services and track your activity</p>
                    
                    {/* Skills Display for Helpers/Businesses */}
                    {user && (user.role === "helper" || user.role === "business") && user.skills && (
                        <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2 font-medium">Skills:</p>
                            <div className="flex flex-wrap gap-2">
                                {user.skills.split(",").map((skill, idx) => (
                                    <span key={idx} className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium capitalize">
                                        {skill.trim().replace(/_/g, " ")}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* Service Requests (Users) */}
                    {user && user.role === "user" && (
                        <>
                            <Link
                                to={route("bookings.create")}
                                className="group relative bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
                                <div className="relative z-10">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <span className="text-2xl">📝</span>
                                    </div>
                                    <h3 className="text-lg font-bold mb-2 text-white">Post Service Request</h3>
                                    <p className="text-primary-100 text-sm leading-relaxed">Post a service request and get help from verified helpers</p>
                                    <div className="mt-4 flex items-center text-white text-sm font-semibold group-hover:translate-x-2 transition-transform duration-300">
                                        Get Started <span className="ml-1">→</span>
                                    </div>
                                </div>
                            </Link>
                            <Link
                                to={route("job-applications.my-request-applications")}
                                className="group relative bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
                            >
                                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors duration-300">
                                    <span className="text-2xl">📋</span>
                                </div>
                                <h3 className="text-lg font-bold mb-2 text-gray-900">My Request Applications</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">View and manage applications to your service requests</p>
                                <div className="mt-4 flex items-center text-primary-600 text-sm font-semibold group-hover:translate-x-2 transition-transform duration-300">
                                    View All <span className="ml-1">→</span>
                                </div>
                            </Link>
                            <Link
                                to={route("bookings.index")}
                                className="group relative bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
                            >
                                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors duration-300">
                                    <span className="text-2xl">📅</span>
                                </div>
                                <h3 className="text-lg font-bold mb-2 text-gray-900">My Bookings</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">View all your service requests and bookings</p>
                                <div className="mt-4 flex items-center text-primary-600 text-sm font-semibold group-hover:translate-x-2 transition-transform duration-300">
                                    View All <span className="ml-1">→</span>
                                </div>
                            </Link>
                        </>
                    )}

                    {/* Service Offerings (Helpers/Businesses) */}
                    {(user?.role === "helper" || user?.role === "business") && (
                        <>
                            <Link
                                to={route("service-listings.create")}
                                className="group relative bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
                                <div className="relative z-10">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <span className="text-2xl">➕</span>
                                    </div>
                                    <h3 className="text-lg font-bold mb-2 text-white">Create Service Listing</h3>
                                    <p className="text-primary-100 text-sm leading-relaxed">Post a service you offer and get clients</p>
                                    <div className="mt-4 flex items-center text-white text-sm font-semibold group-hover:translate-x-2 transition-transform duration-300">
                                        Create Now <span className="ml-1">→</span>
                                    </div>
                                </div>
                            </Link>
                            <Link
                                to={route("service-listings.my-listings")}
                                className="group relative bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
                            >
                                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors duration-300">
                                    <span className="text-2xl">📋</span>
                                </div>
                                <h3 className="text-lg font-bold mb-2 text-gray-900">My Service Listings</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">Manage your service offerings</p>
                                <div className="mt-4 flex items-center text-primary-600 text-sm font-semibold group-hover:translate-x-2 transition-transform duration-300">
                                    Manage <span className="ml-1">→</span>
                                </div>
                            </Link>
                            {user?.role === "business" && (
                                <Link
                                    to={route("job-applications.index")}
                                    className="group relative bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
                                >
                                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors duration-300">
                                        <span className="text-2xl">🔍</span>
                                    </div>
                                    <h3 className="text-lg font-bold mb-2 text-gray-900">Browse Job Requests</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">Browse service requests from users and apply</p>
                                    <div className="mt-4 flex items-center text-primary-600 text-sm font-semibold group-hover:translate-x-2 transition-transform duration-300">
                                        Browse <span className="ml-1">→</span>
                                    </div>
                                </Link>
                            )}
                            <Link
                                to={user?.role === "user" 
                                    ? route("job-applications.my-request-applications")
                                    : route("job-applications.my-applications")
                                }
                                className="group relative bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
                            >
                                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors duration-300">
                                    <span className="text-2xl">📝</span>
                                </div>
                                <h3 className="text-lg font-bold mb-2 text-gray-900">My Applications</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">Track your job applications</p>
                                <div className="mt-4 flex items-center text-primary-600 text-sm font-semibold group-hover:translate-x-2 transition-transform duration-300">
                                    Track <span className="ml-1">→</span>
                                </div>
                            </Link>
                        </>
                    )}

                    {/* Admin */}
                    {user?.role === "admin" && (
                        <>
                            <Link
                                to={route("admin.dashboard")}
                                className="group relative bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
                                <div className="relative z-10">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <span className="text-2xl">⚙️</span>
                                    </div>
                                    <h3 className="text-lg font-bold mb-2 text-white">Admin Dashboard</h3>
                                    <p className="text-primary-100 text-sm leading-relaxed">Manage the platform</p>
                                    <div className="mt-4 flex items-center text-white text-sm font-semibold group-hover:translate-x-2 transition-transform duration-300">
                                        Go to Admin <span className="ml-1">→</span>
                                    </div>
                                </div>
                            </Link>
                        </>
                    )}
                </div>

                {/* Verification Status Section (Helpers/Businesses) */}
                {(user?.role === "helper" || user?.role === "business") && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Verification Status</h2>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Onboarding Status */}
                            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-900">Onboarding Status</h3>
                                    {user.onboarding_complete ? (
                                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-xl flex items-center justify-center shadow-md">
                                            <span className="text-xl text-white">✓</span>
                                        </div>
                                    ) : (
                                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-md">
                                            <span className="text-xl text-white">⏳</span>
                                        </div>
                                    )}
                                </div>
                                {user.onboarding_complete ? (
                                    <div>
                                        <p className="text-lg font-bold text-green-600 mb-1">Completed</p>
                                        <p className="text-sm text-gray-600">Your profile is complete and ready</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-lg font-bold text-yellow-600 mb-1">In Progress</p>
                                        <p className="text-sm text-gray-600">Complete your onboarding to get started</p>
                                    </div>
                                )}
                            </div>

                            {/* Verification Status */}
                            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-900">Verification Status</h3>
                                    {user.verification_status === "verified" ? (
                                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-xl flex items-center justify-center shadow-md">
                                            <span className="text-xl text-white">✓</span>
                                        </div>
                                    ) : (
                                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-md">
                                            <span className="text-xl text-white">⏳</span>
                                        </div>
                                    )}
                                </div>
                                {user.verification_status === "verified" ? (
                                    <div>
                                        <p className="text-lg font-bold text-green-600 mb-1">Verified</p>
                                        <p className="text-sm text-gray-600">Your documents are verified</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-lg font-bold text-yellow-600 mb-1">Pending</p>
                                        <p className="text-sm text-gray-600">Awaiting document verification</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Business Stats Section */}
                {user?.role === "business" && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Business Overview</h2>
                        
                        {businessLoading ? (
                            <div className="text-center py-8">
                                <p className="text-gray-600">Loading business stats...</p>
                            </div>
                        ) : businessStats ? (
                            <>
                                {/* Stats Cards */}
                                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                                    <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg p-6 text-white">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-3xl">👥</span>
                                        </div>
                                        <div className="text-3xl font-bold mb-1">{businessStats.total_workers || 0}</div>
                                        <div className="text-primary-100 text-sm">Total Workers</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-3xl">✅</span>
                                        </div>
                                        <div className="text-3xl font-bold mb-1">{businessStats.active_workers || 0}</div>
                                        <div className="text-green-100 text-sm">Active Workers</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-3xl">✓</span>
                                        </div>
                                        <div className="text-3xl font-bold mb-1">{businessStats.verified_workers || 0}</div>
                                        <div className="text-blue-100 text-sm">Verified Workers</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-3xl">⏳</span>
                                        </div>
                                        <div className="text-3xl font-bold mb-1">{businessStats.pending_verification || 0}</div>
                                        <div className="text-yellow-100 text-sm">Pending Verification</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-3xl">📅</span>
                                        </div>
                                        <div className="text-3xl font-bold mb-1">{businessStats.total_bookings || 0}</div>
                                        <div className="text-purple-100 text-sm">Total Bookings</div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="group relative bg-white rounded-xl shadow-md p-6 border border-gray-100">
                                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                                            <span className="text-2xl">👥</span>
                                        </div>
                                        <h3 className="text-lg font-bold mb-2 text-gray-900">Workers</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed mb-2">
                                            <span className="font-semibold text-primary-600">{businessStats.active_workers || 0}</span> active out of <span className="font-semibold text-primary-600">{businessStats.total_workers || 0}</span> total workers
                                        </p>
                                        <p className="text-gray-500 text-xs">
                                            {businessStats.verified_workers || 0} verified, {businessStats.pending_verification || 0} pending verification
                                        </p>
                                    </div>
                                    <Link
                                        to={route("service-listings.my-listings")}
                                        className="group relative bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
                                    >
                                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors duration-300">
                                            <span className="text-2xl">📋</span>
                                        </div>
                                        <h3 className="text-lg font-bold mb-2 text-gray-900">Service Listings</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">Manage your service offerings</p>
                                        <div className="mt-4 flex items-center text-primary-600 text-sm font-semibold group-hover:translate-x-2 transition-transform duration-300">
                                            View Listings <span className="ml-1">→</span>
                                        </div>
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                                <p className="text-gray-600">No business stats available</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

