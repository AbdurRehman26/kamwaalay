import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "@/Layouts/PublicLayout.jsx";
import { homeService } from "@/services/home";
import { bookingsService } from "@/services/bookings";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";
import {
    isUser,
    isUserOrGuest,
    isHelperOrBusiness, isHelperOrBusinessOrGuest
} from "@/utils/permissions";

export default function Home() {
    const { user } = useAuth();
    const [featuredHelpers, setFeaturedHelpers] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [browseDropdownOpen, setBrowseDropdownOpen] = useState(false);
    const [browseDropdownOpenCTA, setBrowseDropdownOpenCTA] = useState(false);
    const browseDropdownRef = useRef(null);
    const browseDropdownRefCTA = useRef(null);

    useEffect(() => {
        // Fetch home data from API
        homeService.getHomeData()
            .then((data) => {
                setFeaturedHelpers(data.featured_helpers || []);
                setStats(data.stats || {});
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching home data:", error);
                setLoading(false);
            });

        // Fetch jobs only for guests, helpers, and businesses (not regular users)
        if (!user || isHelperOrBusiness(user)) {
            bookingsService.browseBookings({ page: 1, per_page: 6 })
                .then((data) => {
                    // Get first 6 jobs
                    setJobs((data.job_posts?.data || data.bookings?.data || []).slice(0, 6));
                })
                .catch((error) => {
                    console.error("Error fetching jobs:", error);
                });
        }
    }, [user]);

    // Handle click outside dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (browseDropdownRef.current && !browseDropdownRef.current.contains(event.target)) {
                setBrowseDropdownOpen(false);
            }
            if (browseDropdownRefCTA.current && !browseDropdownRefCTA.current.contains(event.target)) {
                setBrowseDropdownOpenCTA(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const services = [
        { name: "Maid", icon: "🧹", color: "from-indigo-500 to-purple-600" },
        { name: "Cook", icon: "👨‍🍳", color: "from-orange-400 to-red-500" },
        { name: "Babysitter", icon: "👶", color: "from-blue-400 to-cyan-500" },
        { name: "Caregiver", icon: "👵", color: "from-emerald-400 to-green-500" },
        { name: "Cleaner", icon: "✨", color: "from-teal-400 to-emerald-500" },
        { name: "All Rounder", icon: "🌟", color: "from-amber-400 to-orange-500" },
    ];

    const steps = [
        {
            number: "01",
            title: "Book",
            description: "Choose your service and preferred helper with just a few clicks.",
            icon: "📅",
        },
        {
            number: "02",
            title: "Verify",
            description: "We ensure all helpers are background checked and verified.",
            icon: "✅",
        },
        {
            number: "03",
            title: "Relax",
            description: "Sit back and enjoy quality home care you can trust.",
            icon: "😌",
        },
    ];

    const testimonials = [
        {
            name: "Warish Batool",
            service: "Maid",
            rating: 5,
            comment: "Excellent service! Found a reliable maid within minutes.",
        },
        {
            name: "M. Ali",
            service: "Cook",
            rating: 5,
            comment: "Best cook we ever had. Highly recommended!",
        },
        {
            name: "Aayat",
            service: "Babysitter",
            rating: 5,
            comment: "Trustworthy and professional. My kids love her!",
        },
    ];

    return (
        <PublicLayout>
            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 text-white overflow-hidden">
                {/* Abstract Background Shapes */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                    <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-2000"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 relative z-10 w-full">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="text-center lg:text-left">
                            <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-6 animate-fade-in-up">
                                <span className="text-sm font-medium text-indigo-200">✨ Trusted by 5000+ Families</span>
                            </div>
                            <h1 className="text-5xl md:text-6xl xl:text-7xl font-bold mb-8 leading-tight tracking-tight">
                                Find Reliable <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">House Help</span> Today
                            </h1>
                            <p className="text-xl text-indigo-100/90 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                Connect with verified domestic helpers - maids, cooks, babysitters, and more. Your trusted partner for quality home care.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                {isUserOrGuest(user) && (
                                    <div className="relative" ref={browseDropdownRef}>
                                        <button
                                            onClick={() => setBrowseDropdownOpen(!browseDropdownOpen)}
                                            className="w-full sm:w-auto px-8 py-4 bg-white text-indigo-900 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-all duration-300 shadow-xl shadow-indigo-900/20 flex items-center justify-center gap-2"
                                        >
                                            Browse Now
                                            <svg
                                                className={`w-5 h-5 transition-transform ${browseDropdownOpen ? "rotate-180" : ""}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {browseDropdownOpen && (
                                            <div className="absolute top-full left-0 mt-3 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 z-50 overflow-hidden backdrop-blur-xl">
                                                <Link
                                                    to={route("helpers.index")}
                                                    onClick={() => setBrowseDropdownOpen(false)}
                                                    className="block px-6 py-4 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                                                >
                                                    <span className="block text-sm text-gray-400 dark:text-gray-500 mb-1">Find a Helper</span>
                                                    Browse Helpers
                                                </Link>
                                                <Link
                                                    to={route("service-listings.index")}
                                                    onClick={() => setBrowseDropdownOpen(false)}
                                                    className="block px-6 py-4 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
                                                >
                                                    <span className="block text-sm text-gray-400 dark:text-gray-500 mb-1">Explore Services</span>
                                                    Browse Services
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {isHelperOrBusinessOrGuest(user) && (
                                    <Link
                                        to={route("job-applications.index")}
                                        className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl font-bold text-lg hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
                                    >
                                        Find Jobs
                                    </Link>
                                )}
                                {isUser(user) && (
                                    <Link
                                        to={route("bookings.create")}
                                        className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl font-bold text-lg hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
                                    >
                                        Post a Job
                                    </Link>
                                )}
                                {isHelperOrBusiness(user) && (
                                    <Link
                                        to={route("service-listings.create")}
                                        className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl font-bold text-lg hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
                                    >
                                        Offer Service
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Hero Visual */}
                        <div className="relative hidden lg:block">
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full blur-[80px] opacity-30 animate-pulse"></div>
                            <div className="relative z-10 grid grid-cols-2 gap-4">
                                <div className="space-y-4 mt-8">
                                    <div className="p-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl transform hover:-translate-y-2 transition-transform duration-300">
                                        <div className="text-4xl mb-2">🧹</div>
                                        <div className="font-bold text-lg">Maid Services</div>
                                        <div className="text-indigo-200 text-sm">Cleaning & Cooking</div>
                                    </div>
                                    <div className="p-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl transform hover:-translate-y-2 transition-transform duration-300">
                                        <div className="text-4xl mb-2">👶</div>
                                        <div className="font-bold text-lg">Babysitting</div>
                                        <div className="text-indigo-200 text-sm">Care for your little ones</div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl transform hover:-translate-y-2 transition-transform duration-300">
                                        <div className="text-4xl mb-2">👨‍🍳</div>
                                        <div className="font-bold text-lg">Cook</div>
                                        <div className="text-indigo-200 text-sm">Delicious home meals</div>
                                    </div>
                                    <div className="p-6 bg-gradient-to-br from-white to-indigo-50 text-indigo-900 rounded-2xl shadow-xl transform hover:-translate-y-2 transition-transform duration-300">
                                        <div className="font-bold text-4xl mb-1">{stats?.total_helpers || "500"}+</div>
                                        <div className="font-bold">Verified Helpers</div>
                                        <div className="text-indigo-500 text-sm mt-1">Ready to hire</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Bar */}
            <div className="transform -translate-y-1/2 max-w-7xl mx-auto px-6 lg:px-8 relative z-20">
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 lg:p-12 grid grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
                    <div className="text-center">
                        <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-2">
                            {stats?.total_helpers || 0}+
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 font-medium text-sm lg:text-base">Verified Helpers</div>
                    </div>
                    <div className="text-center border-l border-gray-100 dark:border-gray-700 pl-8">
                        <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 dark:from-orange-400 dark:to-red-400 mb-2">
                            {stats?.total_bookings || 0}+
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 font-medium text-sm lg:text-base">Successful Bookings</div>
                    </div>
                    <div className="text-center border-l border-gray-100 dark:border-gray-700 pl-8">
                        <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-400 mb-2">
                            {stats?.total_reviews || 0}+
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 font-medium text-sm lg:text-base">5-Star Reviews</div>
                    </div>
                    <div className="text-center border-l border-gray-100 dark:border-gray-700 pl-8">
                        <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-400 mb-2">
                            {stats?.verified_helpers || 0}+
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 font-medium text-sm lg:text-base">Police Verified</div>
                    </div>
                </div>
            </div>

            {/* Services Section */}
            <section className="py-20 lg:py-32 bg-gray-50/50 dark:bg-gray-900/50">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-indigo-600 dark:text-indigo-400 font-bold tracking-wide uppercase text-sm mb-3">Our Services</h2>
                        <h3 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">Professional Home Services</h3>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            Choose from a wide range of professional house help services tailored to your specific needs.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {services.map((service) => (
                            <Link
                                key={service.name}
                                to={route("helpers.index") + `?service_type=${service.name.toLowerCase().replace(" ", "_")}`}
                                className="group relative bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 text-center border border-gray-100 dark:border-gray-700/50 overflow-hidden"
                            >
                                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${service.color}`}></div>
                                <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300 filter drop-shadow-sm">{service.icon}</div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {service.name}
                                </h3>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Helpers */}
            {!loading && !isHelperOrBusiness(user) && featuredHelpers && featuredHelpers.length > 0 && (
                <section className="py-24 bg-white dark:bg-gray-900">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                            <div className="max-w-2xl">
                                <h2 className="text-indigo-600 dark:text-indigo-400 font-bold tracking-wide uppercase text-sm mb-3">Featured Profiles</h2>
                                <h3 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">Top Rated Helpers</h3>
                                <p className="text-xl text-gray-600 dark:text-gray-300">
                                    Verified professionals ready to help you today.
                                </p>
                            </div>
                            <Link
                                to={route("helpers.index")}
                                className="group inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-lg hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                            >
                                View All Helpers
                                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                            </Link>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {featuredHelpers.map((helper) => {
                                if (!helper.id) return null;
                                return (
                                    <Link
                                        key={helper.id}
                                        to={route("helpers.show", helper.id)}
                                        className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                                    >
                                        <div className="h-64 relative bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                            {helper.photo ? (
                                                <img
                                                    src={`/storage/${helper.photo}`}
                                                    alt={helper.name}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20">
                                                    <span className="text-6xl text-indigo-300 dark:text-indigo-600">👤</span>
                                                </div>
                                            )}
                                            <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                                <span className="text-yellow-500 text-sm">⭐</span>
                                                <span className="font-bold text-gray-900 dark:text-white text-sm">{helper.rating || "New"}</span>
                                            </div>
                                        </div>
                                        <div className="p-8">
                                            <div className="mb-4">
                                                <span className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold uppercase tracking-wide">
                                                    {helper.service_listings?.[0]?.service_types?.[0]?.service_type?.replace("_", " ") || "Helper"}
                                                </span>
                                            </div>
                                            <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {helper.name}
                                            </h3>
                                            <p className="text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-2 text-sm">
                                                <span>📍</span> {helper.city || "Unknown City"}, {helper.area || "Area"}
                                            </p>
                                            <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                                <span className="text-gray-500 dark:text-gray-400 text-sm">Starting from</span>
                                                <span className="font-bold text-lg text-gray-900 dark:text-white">
                                                    Contact for Price
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Available Jobs (Conditional) */}
            {(!user || isHelperOrBusiness(user)) && jobs && jobs.length > 0 && (
                <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                            <div className="max-w-2xl">
                                <h2 className="text-indigo-600 dark:text-indigo-400 font-bold tracking-wide uppercase text-sm mb-4 flex items-center gap-2">
                                    <span className="text-lg">💼</span>
                                    Latest Opportunities
                                </h2>
                                <h3 className="text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
                                    Available Jobs
                                </h3>
                                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                                    Browse the latest job postings in your area and apply today.
                                </p>
                            </div>
                            <Link
                                to={route("job-applications.index")}
                                className="group inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 whitespace-nowrap"
                            >
                                View All Jobs
                                <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                            </Link>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {jobs.map((job) => (
                                <Link
                                    key={job.id}
                                    to={route("bookings.show", job.id)}
                                    className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300 transform hover:-translate-y-1"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                    {job.user?.name?.charAt(0) || "C"}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 dark:text-white text-base">{job.user?.name || "Customer"}</h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                        {new Date(job.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase tracking-wide">
                                                {job.status}
                                            </span>
                                        </div>

                                        <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors capitalize leading-tight">
                                            {job.service_type?.replace("_", " ")}
                                        </h3>

                                        <div className="space-y-2.5 mb-6">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                <span className="text-base">💼</span>
                                                <span className="font-semibold capitalize">{job.work_type?.replace("_", " ")}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                <span className="text-base">📍</span>
                                                <span className="font-semibold truncate">{job.city}, {job.area}</span>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                                                {job.job_applications?.length || 0} Applicants
                                            </span>
                                            <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 group-hover:underline flex items-center gap-1">
                                                Apply Now
                                                <span className="text-lg">→</span>
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* How It Works */}
            <section className="py-24 bg-white dark:bg-gray-900 relative">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-indigo-600 dark:text-indigo-400 font-bold tracking-wide uppercase text-sm mb-3">Simple Process</h2>
                        <h3 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">How It Works</h3>
                        <p className="text-xl text-gray-600 dark:text-gray-300">
                            Get your household help sorted in three easy steps.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-gray-200 via-indigo-200 to-gray-200 dark:from-gray-700 dark:via-indigo-900 dark:to-gray-700 z-0"></div>

                        {steps.map((step, index) => (
                            <div key={index} className="text-center relative z-10 group">
                                <div className="w-24 h-24 mx-auto bg-white dark:bg-gray-800 rounded-full border-4 border-white dark:border-gray-800 shadow-xl flex items-center justify-center text-4xl mb-6 relative group-hover:scale-110 transition-transform duration-300">
                                    <div className="absolute inset-0 bg-indigo-50 dark:bg-indigo-900/20 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                                    <span className="relative z-10">{step.icon}</span>
                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-indigo-600 text-white dark:bg-indigo-500 rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                                        {step.number}
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{step.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed px-4">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Unique Selling Points */}
            <section className="py-24 bg-indigo-900 relative overflow-hidden text-white">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-[100px]"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                    <div className="grid md:grid-cols-3 gap-12 border-t border-indigo-700/50 pt-16">
                        <div className="text-center">
                            <div className="text-5xl mb-6 opacity-90">🛡️</div>
                            <h3 className="text-xl font-bold mb-3">Safety First</h3>
                            <p className="text-indigo-200 leading-relaxed">
                                Detailed background checks and police verification for every helper ensuring your family's safety.
                            </p>
                        </div>
                        <div className="text-center border-l-0 md:border-l border-indigo-700/50">
                            <div className="text-5xl mb-6 opacity-90">✨</div>
                            <h3 className="text-xl font-bold mb-3">Service Guarantee</h3>
                            <p className="text-indigo-200 leading-relaxed">
                                We stand by our service. If you're not satisfied, we provide a free replacement within 7 days.
                            </p>
                        </div>
                        <div className="text-center border-l-0 md:border-l border-indigo-700/50">
                            <div className="text-5xl mb-6 opacity-90">🚀</div>
                            <h3 className="text-xl font-bold mb-3">Quick & Easy</h3>
                            <p className="text-indigo-200 leading-relaxed">
                                Our platform is designed for speed. Find meaningful help within minutes, not days.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-indigo-600 dark:text-indigo-400 font-bold tracking-wide uppercase text-sm mb-3">Testimonials</h2>
                        <h3 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">Loved by Families</h3>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                                <div className="flex gap-1 mb-6 text-yellow-400">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                    ))}
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-6 italic">"{testimonial.comment}"</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold">
                                        {testimonial.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-white">{testimonial.name}</div>
                                        <div className="text-sm text-indigo-600 dark:text-indigo-400">{testimonial.service}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20">
                <div className="max-w-5xl mx-auto px-6 lg:px-8">
                    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-900 dark:to-purple-900 shadow-2xl">
                        {/* Background Patterns */}
                        <div className="absolute inset-0 opacity-20">
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white rounded-full blur-[80px]"></div>
                            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-pink-500 rounded-full blur-[80px]"></div>
                        </div>

                        <div className="relative z-10 px-8 py-16 md:px-16 text-center">
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to get started?</h2>
                            <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
                                Join thousands of happy families and professional helpers on our platform today.
                            </p>

                            {!user && (
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link
                                        to={route("register")}
                                        className="inline-block px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors shadow-lg"
                                    >
                                        Create Account
                                    </Link>
                                    <Link
                                        to={route("helpers.index")}
                                        className="inline-block px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-colors"
                                    >
                                        Browse Helpers
                                    </Link>
                                </div>
                            )}

                            {user && (
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    {isHelperOrBusiness(user) ? (
                                        <Link
                                            to={route("service-listings.create")}
                                            className="inline-block px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors shadow-lg"
                                        >
                                            Offer Service
                                        </Link>
                                    ) : (
                                        <Link
                                            to={route("bookings.create")}
                                            className="inline-block px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors shadow-lg"
                                        >
                                            Post a Job
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
