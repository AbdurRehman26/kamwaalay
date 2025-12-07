import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { route } from "@/utils/routes";
import NotificationDropdown from "@/Components/NotificationDropdown";
import LogoutModal from "@/Components/LogoutModal";
import { isHelperOrBusiness, isHelperOrBusinessOrGuest, isUser, isUserOrGuest } from "@/utils/permissions";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
    const { user, logout } = useAuth();
    const { locale, t } = useLanguage();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [browseDropdownOpen, setBrowseDropdownOpen] = useState(false);
    const browseDropdownRef = useRef(null);

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/login");
        } catch (error) {
            console.error("Logout error:", error);
            navigate("/login");
        }
    };

    // Handle click outside dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (browseDropdownRef.current && !browseDropdownRef.current.contains(event.target)) {
                setBrowseDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <>
            <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-sm sticky top-0 z-50 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20 w-full">
                        <div className="flex items-center">
                            <Link to={route("home")} className="flex items-center group">
                                <img
                                    src="/kamwaalay-logo.png"
                                    alt="kamwaalay"
                                    className="h-32 w-auto transition-transform group-hover:scale-105"
                                />
                            </Link>
                        </div>

                        <div className="hidden lg:flex items-center space-x-6">
                            {/* Dark Mode Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 transition-all duration-300"
                                aria-label="Toggle dark mode"
                            >
                                {isDark ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                )}
                            </button>
                            <Link
                                to={route("home")}
                                className="text-gray-700 dark:text-gray-300 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 font-semibold transition-all duration-300"
                            >
                                {t ? t("common.home") : "Home"}
                            </Link>
                            {(isHelperOrBusinessOrGuest(user)) && (
                                <Link
                                    to={route("job-applications.index")}
                                    className="text-gray-700 dark:text-gray-300 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 font-semibold transition-all duration-300"
                                >
                                    Search Jobs
                                </Link>
                            )}
                            {isUserOrGuest(user) && (
                                <div className="relative" ref={browseDropdownRef}>
                                    <button
                                        onClick={() => setBrowseDropdownOpen(!browseDropdownOpen)}
                                        className="text-gray-700 dark:text-gray-300 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 font-semibold transition-all duration-300 flex items-center gap-1"
                                    >
                                        Browse
                                        <svg
                                            className={`w-4 h-4 transition-transform ${browseDropdownOpen ? "rotate-180" : ""}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {browseDropdownOpen && (
                                        <div className="absolute top-full left-0 mt-2 w-56 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 py-2 z-50 overflow-hidden">
                                            <Link
                                                to={route("helpers.index")}
                                                onClick={() => setBrowseDropdownOpen(false)}
                                                className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 font-medium"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className="text-lg">👥</span>
                                                    Browse Helpers
                                                </span>
                                            </Link>
                                            <Link
                                                to={route("service-listings.index")}
                                                onClick={() => setBrowseDropdownOpen(false)}
                                                className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 font-medium"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className="text-lg">🛠️</span>
                                                    Browse Services
                                                </span>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                            {user ? (
                                <>
                                    <Link
                                        to={route("dashboard")}
                                        className="text-gray-700 dark:text-gray-300 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 font-semibold transition-all duration-300"
                                    >
                                        {t ? t("common.dashboard") : "Dashboard"}
                                    </Link>
                                    {isHelperOrBusiness(user) && (
                                        <Link
                                            to={route("service-listings.create")}
                                            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-2.5 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 font-semibold"
                                        >
                                            <span className="flex items-center gap-2">
                                                <span>✨</span>
                                                Offer Service
                                            </span>
                                        </Link>
                                    )}
                                    {isUser(user) && (
                                        <Link
                                            to={route("bookings.create")}
                                            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-2.5 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 font-semibold"
                                        >
                                            <span className="flex items-center gap-2">
                                                <span>➕</span>
                                                Post a Job
                                            </span>
                                        </Link>
                                    )}
                                    <Link
                                        to={route("profile.edit")}
                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 font-semibold"
                                    >
                                        {t ? t("common.profile") : "Profile"}
                                    </Link>
                                    <NotificationDropdown />
                                    <button
                                        onClick={() => setShowLogoutModal(true)}
                                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-semibold transition-colors"
                                    >
                                        {t ? t("common.logout") : "Logout"}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to={route("login")}
                                        className="text-gray-700 dark:text-gray-300 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 font-semibold transition-all duration-300"
                                    >
                                        {t ? t("common.login") : "Login"}
                                    </Link>
                                    <Link
                                        to={route("register")}
                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 font-semibold"
                                    >
                                        {t ? t("navigation.get_started") : "Get Started"}
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <div className="lg:hidden flex items-center space-x-2">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                aria-label="Toggle dark mode"
                            >
                                {isDark ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                )}
                            </button>
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="text-gray-700 dark:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                {mobileMenuOpen ? (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="lg:hidden py-4 space-y-2 border-t border-gray-200/50 dark:border-gray-700/50">
                            <Link
                                to={route("home")}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block py-3 px-4 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 rounded-xl transition-all duration-300 font-medium"
                            >
                                {t ? t("common.home") : "Home"}
                            </Link>
                            {(!user || isHelperOrBusiness(user)) && (
                                <Link
                                    to={route("job-applications.index")}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block py-3 px-4 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 rounded-xl transition-all duration-300 font-medium"
                                >
                                    Search Jobs
                                </Link>
                            )}
                            {isUserOrGuest(user) && (
                                <>
                                    <Link
                                        to={route("helpers.index")}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-3 px-4 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 rounded-xl transition-all duration-300 font-medium"
                                    >
                                        <span className="flex items-center gap-2">
                                            <span>👥</span>
                                            Browse Helpers
                                        </span>
                                    </Link>
                                    <Link
                                        to={route("service-listings.index")}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-3 px-4 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 rounded-xl transition-all duration-300 font-medium"
                                    >
                                        <span className="flex items-center gap-2">
                                            <span>🛠️</span>
                                            Browse Services
                                        </span>
                                    </Link>
                                </>
                            )}
                            {user ? (
                                <>
                                    <Link
                                        to={route("dashboard")}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-3 px-4 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 rounded-xl transition-all duration-300 font-medium"
                                    >
                                        {t ? t("common.dashboard") : "Dashboard"}
                                    </Link>
                                    {isHelperOrBusiness(user) && (
                                        <Link
                                            to={route("service-listings.create")}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="block py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 font-semibold text-center shadow-md"
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                <span>✨</span>
                                                Offer New Service
                                            </span>
                                        </Link>
                                    )}
                                    {isUser(user) && (
                                        <Link
                                            to={route("bookings.create")}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="block py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 font-semibold text-center shadow-md"
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                <span>➕</span>
                                                Post a Job
                                            </span>
                                        </Link>
                                    )}
                                    <Link
                                        to={route("profile.edit")}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold text-center shadow-md"
                                    >
                                        {t ? t("common.profile") : "Profile"}
                                    </Link>
                                    <div className="flex items-center space-x-2 px-4 py-3">
                                        <div className="flex items-center">
                                            <NotificationDropdown />
                                        </div>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            await handleLogout();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="block py-3 px-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-300 w-full text-left font-semibold"
                                    >
                                        {t ? t("common.logout") : "Logout"}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to={route("login")}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-3 px-4 text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 rounded-xl transition-all duration-300 font-medium"
                                    >
                                        {t ? t("common.login") : "Login"}
                                    </Link>
                                    <Link
                                        to={route("register")}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold text-center shadow-md"
                                    >
                                        {t ? t("navigation.get_started") : "Get Started"}
                                    </Link>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </nav>
            <LogoutModal show={showLogoutModal} onClose={() => setShowLogoutModal(false)} />
        </>
    );
}
