import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { route } from "@/utils/routes";
import NotificationDropdown from "@/Components/NotificationDropdown";
import LogoutModal from "@/Components/LogoutModal";
import {
    isUser,
    isUserOrGuest,
    isHelperOrGuest,
    isHelperOrBusiness,
    isBusiness,
    isAdmin
} from "@/utils/permissions";

export default function PublicLayout({ children }) {
    const { user, logout } = useAuth();
    const { locale, t } = useLanguage();
    const navigate = useNavigate();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Handle RTL for Urdu
    useEffect(() => {
        const html = document.documentElement;
        if (locale === "ur") {
            html.setAttribute("dir", "rtl");
            html.setAttribute("lang", "ur");
        } else {
            html.setAttribute("dir", "ltr");
            html.setAttribute("lang", "en");
        }
    }, [locale]);

    return (
        <div className={`min-h-screen bg-gray-50 ${locale === "ur" ? "font-urdu" : ""}`}>
            {/* Navigation */}
            <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20 w-full">
                        <Link to={route("home")} className="flex items-center">
                            <img
                                src="/kamwaalay-logo.png"
                                alt="kamwaalay"
                                className="h-24 w-auto"
                            />
                        </Link>

                        <div className="hidden lg:flex items-center space-x-8">
                            <Link to={route("home")} className="text-gray-700 hover:text-primary-600 font-medium transition-colors">{t("common.home")}</Link>
                            {user && (
                                <Link to={route("dashboard")} className="text-gray-700 hover:text-primary-600 font-medium transition-colors">{t("common.dashboard")}</Link>
                            )}
                            {isUser(user) && (
                                <Link to={route("service-listings.index")} className="text-gray-700 hover:text-primary-600 font-medium transition-colors">Browse Services</Link>
                            )}
                            {isUserOrGuest(user) && (
                                <Link to={route("helpers.index")} className="text-gray-700 hover:text-primary-600 font-medium transition-colors">{t("navigation.find_help")}</Link>
                            )}
                            {!user && (
                                <Link to={route("service-requests.browse")} className="text-gray-700 hover:text-primary-600 font-medium transition-colors">{t("navigation.services_required")}</Link>
                            )}
                            {user && (
                                <Link to={route("job-applications.index")} className="text-gray-700 hover:text-primary-600 font-medium transition-colors">Search Jobs</Link>
                            )}

                            {user ? (
                                <>
                                    {isAdmin(user) && (
                                        <Link to={route("admin.dashboard")} className="text-gray-700 hover:text-primary-600 font-medium transition-colors">{t("navigation.admin")}</Link>
                                    )}
                                    <NotificationDropdown />
                                    {isUser(user) && (
                                        <Link to={route("bookings.create")} className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-2.5 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg font-medium">
                                            {t("navigation.post_service_request")}
                                        </Link>
                                    )}
                                    <Link to={route("profile.edit")} className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-2.5 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg font-medium">
                                        {t("common.profile")}
                                    </Link>
                                    <button
                                        onClick={() => setShowLogoutModal(true)}
                                        className="text-red-600 hover:text-red-700 font-medium transition-colors"
                                    >
                                        {t("common.logout")}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to={route("login")} className="text-gray-700 hover:text-primary-600 font-medium transition-colors">{t("common.login")}</Link>
                                    <Link to={route("register")} className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-2.5 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg font-medium">
                                        {t("navigation.get_started")}
                                    </Link>
                                </>
                            )}
                        </div>

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
                            <Link to={route("home")} className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">{t("common.home")}</Link>
                            {user && (
                                <Link to={route("dashboard")} className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">Dashboard</Link>
                            )}
                            {isUser(user) && (
                                <Link to={route("service-listings.index")} className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">Browse Services</Link>
                            )}
                            {isUserOrGuest(user) && (
                                <Link to={route("helpers.index")} className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">{t("navigation.find_help")}</Link>
                            )}
                            {!user && (
                                <Link to={route("service-requests.browse")} className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">{t("navigation.services_required")}</Link>
                            )}
                            {user && (
                                <Link to={route("job-applications.index")} className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">Search Jobs</Link>
                            )}
                            {user ? (
                                <>
                                    <Link to={route("messages")} className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">Messages</Link>
                                    <div className="block py-3 px-4">
                                        <NotificationDropdown />
                                    </div>
                                    <button
                                        onClick={() => setShowLogoutModal(true)}
                                        className="block py-3 px-4 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full text-left font-medium"
                                    >
                                        Logout
                                    </button>
                                    {isUser(user) && (
                                        <Link to={route("bookings.create")} className="block py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all font-medium text-center">
                                            Post Job
                                        </Link>
                                    )}
                                    <Link to={route("profile.edit")} className="block py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg font-medium text-center">Profile</Link>
                                </>
                            ) : (
                                <>
                                    <Link to={route("login")} className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">Login</Link>
                                    <Link to={route("register")} className="block py-3 px-4 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">Register</Link>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <main className="min-h-screen">{children}</main>

            {/* Footer */}
            <footer className="bg-gray-900 text-white mt-20">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                        <div className="col-span-1 md:col-span-2">
                            <div className="mb-4">
                                <img
                                    src="/kamwaalay-logo.png"
                                    alt="kamwaalay"
                                    className="h-10 w-auto"
                                />
                            </div>
                            <p className="text-gray-400 mb-4 max-w-md">Connecting households with trusted domestic help. Your reliable partner for all home care services.</p>
                            <div className="flex space-x-4 mt-6">
                                <a href="#" className="text-gray-400 hover:text-white transition-colors">Facebook</a>
                                <a href="#" className="text-gray-400 hover:text-white transition-colors">Twitter</a>
                                <a href="#" className="text-gray-400 hover:text-white transition-colors">Instagram</a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4 text-lg">Services</h4>
                            <ul className="space-y-3 text-gray-400">
                                <li><Link to={route("helpers.index")} className="hover:text-white transition-colors">Find Househelp</Link></li>
                                <li><Link to={route("bookings.create")} className="hover:text-white transition-colors">Post Job</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4 text-lg">Company</h4>
                            <ul className="space-y-3 text-gray-400">
                                <li><Link to={route("about")} className="hover:text-white transition-colors">About Us</Link></li>
                                <li><Link to={route("contact")} className="hover:text-white transition-colors">Contact</Link></li>
                                <li><Link to={route("faq")} className="hover:text-white transition-colors">FAQ</Link></li>
                                <li><Link to={route("terms")} className="hover:text-white transition-colors">Terms</Link></li>
                                <li><Link to={route("privacy")} className="hover:text-white transition-colors">Privacy</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
                        <p>&copy; {new Date().getFullYear()} kamwaalay. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            <LogoutModal show={showLogoutModal} onClose={() => setShowLogoutModal(false)} />
        </div>
    );
}
