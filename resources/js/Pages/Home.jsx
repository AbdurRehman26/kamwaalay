import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "@/Layouts/PublicLayout.jsx";
import { homeService } from "@/services/home";
import { jobPostsService } from "@/services/jobPosts";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";
import {
    isUser,
    isUserOrGuest,
    isHelper,
    isBusiness,
    isHelperOrBusiness,
    isHelperOrBusinessOrGuest
} from "@/utils/permissions";
import ChatPopup from "@/Components/ChatPopup";
import { useServiceTypes } from "@/hooks/useServiceTypes";

export default function Home() {
    const { user } = useAuth();
    const [featuredHelpers, setFeaturedHelpers] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [chatOpen, setChatOpen] = useState(false);
    const [selectedHelper, setSelectedHelper] = useState(null);

    // Format phone number for WhatsApp
    const formatPhoneForWhatsApp = (phone) => {
        if (!phone) return "";
        const trimmed = phone.trim();
        if (trimmed.startsWith("+92") || trimmed.startsWith("+ 92")) {
            return trimmed.replace(/\D/g, "");
        }
        let cleaned = phone.replace(/\D/g, "");
        if (cleaned.startsWith("0")) {
            cleaned = "92" + cleaned.substring(1);
        } else if (!cleaned.startsWith("92")) {
            cleaned = "92" + cleaned;
        }
        return cleaned;
    };

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
            jobPostsService.browseBookings({ page: 1, per_page: 6 })
                .then((data) => {
                    // Get first 6 jobs
                    setJobs((data.job_posts?.data || data.bookings?.data || []).slice(0, 6));
                })
                .catch((error) => {
                    console.error("Error fetching jobs:", error);
                });
        }
    }, [user]);

    // Fetch service types from database
    const { serviceTypes } = useServiceTypes();

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
            <section className="relative min-h-[75vh] flex items-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 text-white">
                {/* Abstract Background Shapes */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                    <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-2000"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 relative z-30 w-full">
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
                                    <Link
                                        to={route("helpers.index")}
                                        className="w-full sm:w-auto px-8 py-4 bg-white text-indigo-900 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-all duration-300 shadow-xl shadow-indigo-900/20 flex items-center justify-center gap-2"
                                    >
                                        Find Helpers
                                    </Link>
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
                                        to={route("job-posts.create")}
                                        className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl font-bold text-lg hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
                                    >
                                        Post a Job
                                    </Link>
                                )}
                                {isHelper(user) && (
                                    <Link
                                        to={route("service-listings.create")}
                                        className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl font-bold text-lg hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
                                    >
                                        Offer Service
                                    </Link>
                                )}
                            </div>

                            {/* Android App Download Button */}
                            <div className="mt-6 flex justify-center lg:justify-start">
                                <a
                                    href="https://play.google.com/store/apps/details?id=com.kamwaalay.app"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block transition-all duration-300 transform hover:-translate-y-1"
                                >
                                    <img src="/images/google-play-download-android-app-logo.webp" alt="Get on Google Play" className="h-28 w-auto mb-10" />
                                </a>
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
            <div className="mt-24 lg:mt-0 transform -translate-y-1/2 max-w-7xl mx-auto px-6 lg:px-8 relative z-20">
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
            {!isHelperOrBusiness(user) && (
                <section className="py-12 lg:py-16 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-8">
                            <h2 className="text-indigo-600 dark:text-indigo-400 font-bold tracking-wide uppercase text-sm mb-3">Our Services</h2>
                            <h3 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">Professional Home Services</h3>
                            <p className="text-xl text-gray-600 dark:text-gray-300">
                                Choose from a wide range of professional house help services tailored to your specific needs.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {serviceTypes.slice(0, 6).map((service) => (
                                <a
                                    key={service.value}
                                    href={route("helpers.index") + `?service_type=${service.value}`}
                                    className="group relative bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 text-center border border-gray-100 dark:border-gray-700/50 overflow-hidden cursor-pointer"
                                >
                                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${service.color || "from-indigo-500 to-purple-600"}`}></div>
                                    <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300 filter drop-shadow-sm">{service.icon}</div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {service.label}
                                    </h3>
                                </a>
                            ))}
                        </div>

                        {/* View More Button */}
                        {serviceTypes.length > 6 && (
                            <div className="mt-12 text-center">
                                <Link
                                    to={route("helpers.index")}
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                                >
                                    View All Services
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Featured Helpers */}
            {!loading && !isHelperOrBusiness(user) && featuredHelpers && featuredHelpers.length > 0 && (
                <section className="py-12 bg-white dark:bg-gray-900">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
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

                                // Get all unique service types from service listings
                                const allServiceTypes = helper.service_listings?.flatMap(listing =>
                                    listing.service_types?.map(st => {
                                        const serviceType = typeof st === "string" ? st : st?.service_type;
                                        return serviceType?.replace(/_/g, " ") || null;
                                    }) || []
                                ).filter(Boolean) || [];
                                const uniqueServiceTypes = [...new Set(allServiceTypes)];

                                // Get all unique locations from service listings
                                const allLocations = helper.service_listings?.flatMap(listing =>
                                    listing.location_details || []
                                ).filter(Boolean) || [];
                                // Create unique locations based on display_text
                                const uniqueLocations = Array.from(
                                    new Map(allLocations.map(loc => [loc.display_text, loc])).values()
                                );

                                return (
                                    <Link
                                        key={helper.id}
                                        to={route("helpers.show", helper.id)}
                                        className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                                    >
                                        <div className="h-48 relative bg-gray-100 dark:bg-gray-700 overflow-hidden">
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
                                            {/* Services */}
                                            {uniqueServiceTypes.length > 0 && (
                                                <div className="mb-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {uniqueServiceTypes.slice(0, 2).map((type, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold uppercase tracking-wide"
                                                            >
                                                                {type}
                                                            </span>
                                                        ))}
                                                        {uniqueServiceTypes.length > 2 && (
                                                            <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-semibold">
                                                                +{uniqueServiceTypes.length - 2} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {helper.name}
                                            </h3>
                                            {/* Locations */}
                                            {uniqueLocations.length > 0 ? (
                                                <div className="mb-6">
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-gray-500 dark:text-gray-400 mt-0.5">📍</span>
                                                        <div className="flex flex-wrap gap-1.5 flex-1">
                                                            {uniqueLocations.slice(0, 2).map((location, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-md"
                                                                    title={location.area || location.display_text}
                                                                >
                                                                    {location.area || location.display_text}
                                                                </span>
                                                            ))}
                                                            {uniqueLocations.length > 2 && (
                                                                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-md">
                                                                    +{uniqueLocations.length - 2} more
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-gray-500 dark:text-gray-400 mb-6 flex items-center gap-2 text-sm">
                                                    <span>📍</span> Location not specified
                                                </p>
                                            )}

                                            {/* Helper Details Grid */}
                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                {/* Left Column: Personal Info */}
                                                <div className="space-y-2">
                                                    {/* Age */}
                                                    {helper.age && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="text-gray-500 dark:text-gray-400 w-5 text-center">🎂</span>
                                                            <span className="text-gray-700 dark:text-gray-300 text-xs">{helper.age} years</span>
                                                        </div>
                                                    )}

                                                    {/* Gender */}
                                                    {helper.gender && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="text-gray-500 dark:text-gray-400 w-5 text-center">👤</span>
                                                            <span className="text-gray-700 dark:text-gray-300 capitalize text-xs">{helper.gender}</span>
                                                        </div>
                                                    )}

                                                    {/* Religion */}
                                                    {helper.religion && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="text-gray-500 dark:text-gray-400 w-5 text-center">🕌</span>
                                                            <span className="text-gray-700 dark:text-gray-300 capitalize text-xs">
                                                                {typeof helper.religion === "object"
                                                                    ? helper.religion.label
                                                                    : helper.religion.replace(/_/g, " ")}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right Column: Capabilities */}
                                                <div className="space-y-3">
                                                    {/* Languages */}
                                                    {helper.languages && helper.languages.length > 0 && (
                                                        <div>
                                                            <div className="flex items-center gap-1 mb-1.5">
                                                                <span className="text-gray-500 dark:text-gray-400 text-xs">💬 Languages</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {helper.languages.slice(0, 2).map((lang, idx) => (
                                                                    <span
                                                                        key={idx}
                                                                        className="text-[10px] text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-600"
                                                                    >
                                                                        {lang.name || lang}
                                                                    </span>
                                                                ))}
                                                                {helper.languages.length > 2 && (
                                                                    <span className="text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">+{helper.languages.length - 2}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Skills */}
                                                    {helper.skills && (
                                                        <div>
                                                            <div className="flex items-center gap-1 mb-1.5">
                                                                <span className="text-gray-500 dark:text-gray-400 text-xs">⚡ Skills</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {helper.skills.split(",").slice(0, 2).map((skill, idx) => (
                                                                    <span
                                                                        key={idx}
                                                                        className="text-[10px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800"
                                                                    >
                                                                        {skill.trim()}
                                                                    </span>
                                                                ))}
                                                                {helper.skills.split(",").length > 2 && (
                                                                    <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">+{helper.skills.split(",").length - 2}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {helper.phone && (
                                                <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {/* Call Button */}
                                                        <a
                                                            href={`tel:${helper.phone}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="flex items-center justify-center w-10 h-10 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                                            title="Call"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                            </svg>
                                                        </a>

                                                        {/* WhatsApp Button */}
                                                        <a
                                                            href={`https://wa.me/${formatPhoneForWhatsApp(helper.phone)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="flex items-center justify-center w-10 h-10 bg-[#25D366] text-white rounded-lg hover:bg-[#20BA5A] transition-all duration-200 shadow-sm hover:shadow-md"
                                                            title="WhatsApp"
                                                        >
                                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                            </svg>
                                                        </a>

                                                        {/* Message Button - Only for logged in users */}
                                                        {user && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setSelectedHelper(helper);
                                                                    setChatOpen(true);
                                                                }}
                                                                className="flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                                                title="Send Message"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
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
                <section className="py-12 bg-gray-50 dark:bg-gray-900/50">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
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
                            {jobs.map((job) => {
                                // Find the service type object to get its icon
                                const serviceTypeObj = serviceTypes.find(t =>
                                    t.value === job.service_type ||
                                    t.value === job.service_type_id ||
                                    t.slug === job.service_type ||
                                    t.label === job.service_type
                                );
                                const serviceIcon = serviceTypeObj?.icon || "💼";

                                return (
                                    <Link
                                        key={job.id}
                                        to={route("job-posts.show", job.id)}
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

                                            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors capitalize leading-tight flex items-center gap-2">
                                                <span>{serviceIcon}</span>
                                                {job.service_type?.replace("_", " ")}
                                            </h3>

                                            <div className="space-y-2.5 mb-6">
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                    <span className="text-base">💼</span>
                                                    <span className="font-semibold capitalize">{job.work_type?.replace("_", " ")}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                    <span className="text-base">📍</span>
                                                    <span className="font-semibold truncate">
                                                        {job.city_name || job.city?.name || (typeof job.city === "string" ? job.city : null) || "Location not specified"}
                                                    </span>
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
                                );
                            })}
                        </div>
                    </div>
                </section>
            )
            }

            {/* How It Works */}
            <section className="py-12 bg-white dark:bg-gray-900 relative">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-8">
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
            <section className="py-12 bg-indigo-900 relative overflow-hidden text-white">
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
            <section className="py-12 bg-gray-50 dark:bg-gray-800">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-8">
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
            <section className="py-12">
                <div className="max-w-5xl mx-auto px-6 lg:px-8">
                    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-900 dark:to-purple-900 shadow-2xl">
                        {/* Background Patterns */}
                        <div className="absolute inset-0 opacity-20">
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white rounded-full blur-[80px]"></div>
                            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-pink-500 rounded-full blur-[80px]"></div>
                        </div>

                        <div className="relative z-10 px-8 py-12 md:px-16 text-center">
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
                                        Find Helpers
                                    </Link>
                                </div>
                            )}

                            {user && (
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    {isHelper(user) && (
                                        <Link
                                            to={route("service-listings.create")}
                                            className="inline-block px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors shadow-lg"
                                        >
                                            Offer Service
                                        </Link>
                                    )}
                                    {isBusiness(user) && (
                                        <Link
                                            to={route("business.workers.create")}
                                            className="inline-block px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors shadow-lg"
                                        >
                                            Add Worker
                                        </Link>
                                    )}
                                    {isUser(user) && (
                                        <Link
                                            to={route("job-posts.create")}
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
            {/* Chat Popup */}
            {
                selectedHelper && (
                    <ChatPopup
                        recipientId={selectedHelper.id}
                        recipientName={selectedHelper.name}
                        recipientPhoto={selectedHelper.photo}
                        isOpen={chatOpen}
                        onClose={() => {
                            setChatOpen(false);
                            setSelectedHelper(null);
                        }}
                    />
                )
            }
        </PublicLayout >
    );
}
