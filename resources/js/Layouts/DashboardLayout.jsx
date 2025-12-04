import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";
import NotificationDropdown from "@/Components/NotificationDropdown";
import LogoutModal from "@/Components/LogoutModal";
import {
    isHelperOrBusiness, isUser,
} from "@/utils/permissions";

export default function DashboardLayout({ children }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + "/");
    };

    // Navigation items based on user role
    const getNavItems = () => {
        const items = [
            {
                name: "Overview",
                path: route("dashboard"),
                icon: "📊",
                roles: ["user", "helper", "business"]
            },
            {
                name: "Applications",
                path: user?.role === "user"
                    ? route("job-applications.my-request-applications")
                    : route("job-applications.my-applications"),
                icon: "📋",
                roles: ["user", "helper", "business"]
            },
            {
                name: "Messages",
                path: route("messages"),
                icon: "💬",
                roles: ["user", "helper", "business"]
            },
            {
                name: "Profile",
                path: route("profile.edit"),
                icon: "👤",
                roles: ["user", "helper", "business"]
            }
        ];

        // Add role-specific items
        if (user?.role === "user") {
            items.push(
                {
                    name: "My Job Postings",
                    path: route("bookings.index"),
                    icon: "📅",
                    roles: ["user"]
                }
            );
        }

        if (user?.role === "helper" || user?.role === "business") {
            items.push(
                {
                    name: "My Service Listings",
                    path: route("service-listings.my-listings"),
                    icon: "📝",
                    roles: ["helper", "business"]
                },
                {
                    name: "Documents",
                    path: "/dashboard/documents",
                    icon: "📄",
                    roles: ["helper", "business"]
                },
            );

        }

        if (user?.role === "business") {
            items.push(
                {
                    name: "Workers",
                    path: route("business.workers.index"),
                    icon: "👥",
                    roles: ["business"]
                }
            );
        }

        return items.filter(item => item.roles.includes(user?.role));
    };

    const navItems = getNavItems();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top Navigation Bar */}
            <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20 w-full">
                        <div className="flex items-center">
                            <Link to={route("home")} className="flex items-center">
                                <img
                                    src="/kamwaalay-logo.png"
                                    alt="kamwaalay"
                                    className="h-24 w-auto"
                                />
                            </Link>
                        </div>

                        <div className="hidden lg:flex items-center space-x-8">
                            <Link
                                to={route("home")}
                                className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                            >
                                Home
                            </Link>
                            {isHelperOrBusiness(user) && (
                                <>
                                    <Link
                                        to={route("service-listings.create")}
                                        className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2.5 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg font-medium"
                                    >
                                        Offer New Service
                                    </Link>
                                    <Link
                                        to={route("job-applications.index")}
                                        className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                                    >
                                        Search Jobs
                                    </Link>
                                </>
                            )}
                            {isUser(user) && (
                                <Link
                                    to={route("helpers.index")}
                                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                                >
                                    Browse Helpers
                                </Link>
                            )}
                            <Link
                                to={route("dashboard")}
                                className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                            >
                                Dashboard
                            </Link>
                            {isUser(user) && (
                                <Link
                                    to={route("bookings.create")}
                                    className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2.5 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg font-medium"
                                >
                                    Post a Job
                                </Link>
                            )}
                            <Link
                                to={route("profile.edit")}
                                className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-2.5 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg font-medium"
                            >
                                Profile
                            </Link>
                            <NotificationDropdown />
                            <button
                                onClick={() => setShowLogoutModal(true)}
                                className="text-red-600 hover:text-red-700 font-medium transition-colors"
                            >
                                Logout
                            </button>
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden text-gray-700 p-2"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </nav>

            <div className="flex">
                {/* Sidebar */}
                <aside className="hidden lg:flex lg:flex-shrink-0">
                    <div className="flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen">
                        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                            <nav className="flex-1 px-3 space-y-1">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                            isActive(item.path)
                                                ? "bg-primary-50 text-primary-700 border-l-4 border-primary-600"
                                                : "text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                                        }`}
                                    >
                                        <span className="mr-3 text-xl">{item.icon}</span>
                                        <span>{item.name}</span>
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    </div>
                </aside>

                {/* Mobile Sidebar */}
                {mobileMenuOpen && (
                    <div className="fixed inset-0 z-40 lg:hidden">
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)}></div>
                        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                            <div className="absolute top-0 right-0 -mr-12 pt-2">
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                >
                                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                                <nav className="px-2 space-y-1">
                                    <Link
                                        to={route("home")}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="group flex items-center px-3 py-2 text-base font-medium rounded-lg text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                                    >
                                        <span className="mr-3 text-xl">🏠</span>
                                        <span>Home</span>
                                    </Link>
                                    <Link
                                        to={route("job-applications.index")}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="group flex items-center px-3 py-2 text-base font-medium rounded-lg text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                                    >
                                        <span className="mr-3 text-xl">🔍</span>
                                        <span>Search Jobs</span>
                                    </Link>
                                    <Link
                                        to={route("dashboard")}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="group flex items-center px-3 py-2 text-base font-medium rounded-lg text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                                    >
                                        <span className="mr-3 text-xl">📊</span>
                                        <span>Dashboard</span>
                                    </Link>
                                    {isHelperOrBusiness(user) && (
                                        <Link
                                            to={route("service-listings.create")}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="group flex items-center px-3 py-2 text-base font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100"
                                        >
                                            <span className="mr-3 text-xl">➕</span>
                                            <span>Offer New Service</span>
                                        </Link>
                                    )}
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`group flex items-center px-3 py-2 text-base font-medium rounded-lg ${
                                                isActive(item.path)
                                                    ? "bg-primary-50 text-primary-700"
                                                    : "text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                                            }`}
                                        >
                                            <span className="mr-3 text-xl">{item.icon}</span>
                                            <span>{item.name}</span>
                                        </Link>
                                    ))}
                                </nav>
                            </div>
                            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                                <div className="flex items-center w-full">
                                    <div className="flex-shrink-0">
                                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                            <span className="text-primary-700 font-bold">
                                                {user?.name?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                                        <p className="text-xs text-gray-500">{user?.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <main className="flex-1 min-w-0">
                    {children}
                </main>
            </div>

            <LogoutModal show={showLogoutModal} onClose={() => setShowLogoutModal(false)} />
        </div>
    );
}
