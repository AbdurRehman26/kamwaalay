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
            <footer className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 dark:from-indigo-950 dark:via-purple-950 dark:to-gray-900 text-white overflow-hidden mt-8">
                {/* Abstract Background Shapes */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-400/20 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-500/10 dark:bg-purple-400/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                    <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] bg-blue-500/5 dark:bg-blue-400/15 rounded-full blur-[100px] animate-pulse delay-2000"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                        <div className="col-span-1 md:col-span-2">
                            <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-400 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-500 bg-clip-text text-transparent">
                                kamwaalay
                            </h3>
                            <p className="text-indigo-100 dark:text-gray-300 mb-6 max-w-md text-lg leading-relaxed">
                                Connecting households with trusted domestic help. Your reliable partner for all home care services.
                            </p>
                            <div className="flex space-x-4 mt-6">
                                <a
                                    href="https://www.facebook.com/profile.php?id=61584642879532"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 dark:border-gray-700 text-indigo-100 dark:text-gray-300 hover:bg-indigo-500/30 dark:hover:bg-indigo-600/30 hover:text-white dark:hover:text-white hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
                                    aria-label="Facebook"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold mb-6 text-lg text-indigo-200 dark:text-indigo-300">Services</h4>
                            <ul className="space-y-3">
                                <li>
                                    <Link
                                        to={route("helpers.index")}
                                        className="text-indigo-100 dark:text-gray-300 hover:text-white dark:hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                                    >
                                        Find Helpers
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to={route("job-posts.create")}
                                        className="text-indigo-100 dark:text-gray-300 hover:text-white dark:hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                                    >
                                        Post Job
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to={route("service-listings.index")}
                                        className="text-indigo-100 dark:text-gray-300 hover:text-white dark:hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                                    >
                                        Browse Services
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-6 text-lg text-indigo-200 dark:text-indigo-300">Company</h4>
                            <ul className="space-y-3">
                                <li>
                                    <Link
                                        to={route("about")}
                                        className="text-indigo-100 dark:text-gray-300 hover:text-white dark:hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                                    >
                                        About Us
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to={route("contact")}
                                        className="text-indigo-100 dark:text-gray-300 hover:text-white dark:hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                                    >
                                        Contact
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to={route("faq")}
                                        className="text-indigo-100 dark:text-gray-300 hover:text-white dark:hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                                    >
                                        FAQ
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to={route("terms")}
                                        className="text-indigo-100 dark:text-gray-300 hover:text-white dark:hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                                    >
                                        Terms
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to={route("privacy")}
                                        className="text-indigo-100 dark:text-gray-300 hover:text-white dark:hover:text-white transition-colors duration-300 hover:translate-x-1 inline-block"
                                    >
                                        Privacy
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-indigo-700/50 dark:border-gray-700/50 mt-12 pt-8 text-center">
                        <p className="text-indigo-200 dark:text-gray-400 text-sm">
                            &copy; {new Date().getFullYear()} kamwaalay. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
