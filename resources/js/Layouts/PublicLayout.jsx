import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { route } from "@/utils/routes";
import { Link } from "react-router-dom";
import Navbar from "@/Components/Navbar";

export default function PublicLayout({ children }) {
    const { locale } = useLanguage();

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
        <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${locale === "ur" ? "font-urdu" : ""}`}>
            {/* Navigation */}
            <Navbar />

            {/* Main Content */}
            <main>{children}</main>

            {/* Footer */}
            <footer className="bg-gray-900 dark:bg-gray-950 text-white dark:text-gray-200 mt-8">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                        <div className="col-span-1 md:col-span-2">
                            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">kamwaalay</h3>
                            <p className="text-gray-400 mb-4 max-w-md">Connecting households with trusted domestic help. Your reliable partner for all home care services.</p>
                            <div className="flex space-x-4 mt-6">
                                <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-200 transition-colors">Facebook</a>
                                <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-200 transition-colors">Twitter</a>
                                <a href="#" className="text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-200 transition-colors">Instagram</a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4 text-lg">Services</h4>
                                    <ul className="space-y-3 text-gray-400 dark:text-gray-500">
                                        <li><Link to={route("helpers.index")} className="hover:text-white dark:hover:text-gray-200 transition-colors">Find Helpers</Link></li>
                                        <li><Link to={route("bookings.create")} className="hover:text-white dark:hover:text-gray-200 transition-colors">Possst Service Request</Link></li>
                                    </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4 text-lg">Company</h4>
                            <ul className="space-y-3 text-gray-400 dark:text-gray-500">
                                <li><Link to={route("about")} className="hover:text-white dark:hover:text-gray-200 transition-colors">About Us</Link></li>
                                <li><Link to={route("contact")} className="hover:text-white dark:hover:text-gray-200 transition-colors">Contact</Link></li>
                                <li><Link to={route("faq")} className="hover:text-white dark:hover:text-gray-200 transition-colors">FAQ</Link></li>
                                <li><Link to={route("terms")} className="hover:text-white dark:hover:text-gray-200 transition-colors">Terms</Link></li>
                                <li><Link to={route("privacy")} className="hover:text-white dark:hover:text-gray-200 transition-colors">Privacy</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 dark:border-gray-700 mt-12 pt-8 text-center text-gray-400 dark:text-gray-500">
                        <p>&copy; {new Date().getFullYear()} kamwaalay. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
