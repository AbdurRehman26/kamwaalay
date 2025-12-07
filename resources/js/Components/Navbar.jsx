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
            <nav className="bg-white dark:bg-gray-600 shadow-md sticky top-0 z-50 border-b border-gray-100 dark:border-gray-500">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20 w-full">
                        <div className="flex items-center">
                            <Link to={route("home")} className="flex items-center">
                                <img
                                    src="/kamwaalay-logo.png"
                                    alt="kamwaalay"
                                    className="h-32 w-auto"
                                />
                            </Link>
                        </div>

                        <div className="hidden lg:flex items-center space-x-8">
                            {/* Dark Mode Toggle */}
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
                            <Link
                                to={route("home")}
                                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
                            >
                                {t ? t("common.home") : "Home"}
                            </Link>
                            {(isHelperOrBusinessOrGuest(user)) && (
                                <Link
                                    to={route("job-applications.index")}
                                    className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
                                >
                                    Search Jobs
                                </Link>
                            )}
                            {isUserOrGuest(user) && (
                                <div className="relative" ref={browseDropdownRef}>
                                    <button
                                        onClick={() => setBrowseDropdownOpen(!browseDropdownOpen)}
                                        className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors flex items-center gap-1"
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
                                        <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                                            <Link
                                                to={route("helpers.index")}
                                                onClick={() => setBrowseDropdownOpen(false)}
                                                className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                            >
                                                Browse Helpers
                                            </Link>
                                            <Link
                                                to={route("service-listings.index")}
                                                onClick={() => setBrowseDropdownOpen(false)}
                                                className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                            >
                                                Browse Services
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                            {user ? (
                                <>
                                    <Link
                                        to={route("dashboard")}
                                        className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
                                    >
                                        {t ? t("common.dashboard") : "Dashboard"}
                                    </Link>
                                    {isHelperOrBusiness(user) && (
                                        <Link
                                            to={route("service-listings.create")}
                                            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2.5 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg font-medium"
                                        >
                                            Offer New Service
                                        </Link>
                                    )}
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
                                        {t ? t("common.profile") : "Profile"}
                                    </Link>
                                    <NotificationDropdown />
                                    <button
                                        onClick={() => setShowLogoutModal(true)}
                                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors"
                                    >
                                        {t ? t("common.logout") : "Logout"}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to={route("login")}
                                        className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                                    >
                                        {t ? t("common.login") : "Login"}
                                    </Link>
                                    <Link
                                        to={route("register")}
                                        className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-2.5 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg font-medium"
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
                                className="text-gray-700 dark:text-gray-300 p-2"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="lg:hidden py-4 space-y-2 border-t border-gray-100 dark:border-gray-800">
                            <Link
                                to={route("home")}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block py-3 px-4 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                {t ? t("common.home") : "Home"}
                            </Link>
                            {(!user || isHelperOrBusiness(user)) && (
                                <Link
                                    to={route("job-applications.index")}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block py-3 px-4 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    Search Jobs
                                </Link>
                            )}
                            {isUserOrGuest(user) && (
                                <>
                                    <Link
                                        to={route("helpers.index")}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-3 px-4 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                        Browse Helpers
                                    </Link>
                                    <Link
                                        to={route("service-listings.index")}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-3 px-4 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                        Browse Services
                                    </Link>
                                </>
                            )}
                            {user ? (
                                <>
                                    <Link
                                        to={route("dashboard")}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-3 px-4 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                        {t ? t("common.dashboard") : "Dashboard"}
                                    </Link>
                                    {isHelperOrBusiness(user) && (
                                        <Link
                                            to={route("service-listings.create")}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="block py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium text-center"
                                        >
                                            Offer New Service
                                        </Link>
                                    )}
                                    {isUser(user) && (
                                        <Link
                                            to={route("bookings.create")}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="block py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium text-center"
                                        >
                                            Post a Job
                                        </Link>
                                    )}
                                    <Link
                                        to={route("profile.edit")}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all font-medium text-center"
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
                                        className="block py-3 px-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors w-full text-left"
                                    >
                                        {t ? t("common.logout") : "Logout"}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to={route("login")}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        {t ? t("common.login") : "Login"}
                                    </Link>
                                    <Link
                                        to={route("register")}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all font-medium text-center"
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




