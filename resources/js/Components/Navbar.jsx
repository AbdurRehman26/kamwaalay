import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { route } from "@/utils/routes";
import NotificationDropdown from "@/Components/NotificationDropdown";
import LogoutModal from "@/Components/LogoutModal";
import { isHelperOrBusiness, isHelperOrBusinessOrGuest, isUser, isUserOrGuest } from "@/utils/permissions";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
    const { user, logout } = useAuth();
    const { locale, t } = useLanguage();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/login");
        } catch (error) {
            console.error("Logout error:", error);
            navigate("/login");
        }
    };

    return (
        <>
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
                                {t ? t("common.home") : "Home"}
                            </Link>
                            {(isHelperOrBusinessOrGuest(user)) && (
                                <Link
                                    to={route("job-applications.index")}
                                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                                >
                                    Search Jobs
                                </Link>
                            )}
                            {isUserOrGuest(user) && (
                                <Link
                                    to={route("helpers.index")}
                                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                                >
                                    Browse Helpers
                                </Link>
                            )}
                            {user ? (
                                <>
                                    <Link
                                        to={route("dashboard")}
                                        className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
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
                                        className="text-red-600 hover:text-red-700 font-medium transition-colors"
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
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden text-gray-700 p-2"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="lg:hidden py-4 space-y-2 border-t border-gray-100">
                            <Link
                                to={route("home")}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                {t ? t("common.home") : "Home"}
                            </Link>
                            {(!user || isHelperOrBusiness(user)) && (
                                <Link
                                    to={route("job-applications.index")}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    Search Jobs
                                </Link>
                            )}
                            {isUserOrGuest(user) && (
                                <Link
                                    to={route("helpers.index")}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    Browse Helpers
                                </Link>
                            )}
                            {user ? (
                                <>
                                    <Link
                                        to={route("dashboard")}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
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
                                        className="block py-3 px-4 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full text-left"
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

