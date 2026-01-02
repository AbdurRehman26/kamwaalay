import { Link } from "react-router-dom";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { route } from "@/utils/routes";
import { useState, useEffect } from "react";
import { jobPostsService } from "@/services/jobPosts";

export default function BookingsIndex() {
    const [bookings, setBookings] = useState({ data: [], links: [], meta: {} });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        jobPostsService.getBookings()
            .then((data) => {
                setBookings(data.job_posts || data.bookings || { data: [], links: [], meta: {} });
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching job posts:", error);
                setLoading(false);
            });
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
            case "confirmed":
                return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
            case "in_progress":
                return "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300";
            case "completed":
                return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
            case "cancelled":
                return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
            default:
                return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-10 relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">My Job Postings</h1>
                            <p className="text-indigo-100 text-lg max-w-2xl">
                                Manage and track your service requests and job postings.
                            </p>
                        </div>
                        <Link
                            to={route("job-posts.create")}
                            className="inline-flex items-center justify-center px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-all duration-300 shadow-lg group whitespace-nowrap"
                        >
                            <span className="mr-2 text-xl group-hover:rotate-90 transition-transform">➕</span>
                            Post New Job
                        </Link>
                    </div>
                    {/* Decorative blobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-20 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl transform translate-y-1/2"></div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <p className="text-gray-500 animate-pulse">Loading jobs...</p>
                        </div>
                    </div>
                ) : bookings.data && bookings.data.length > 0 ? (
                    <div className="grid gap-6">
                        {bookings.data.map((booking) => (
                            <div
                                key={booking.id}
                                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all duration-300"
                            >
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center flex-wrap gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white capitalize group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {booking.service_type?.replace("_", " ") || "N/A"}
                                            </h3>
                                            {/* Status - Hidden */}
                                            {false && (
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(booking.status)}`}>
                                                    {booking.status?.replace("_", " ") || "N/A"}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4 gap-4 flex-wrap">
                                            <span className="flex items-center gap-1">
                                                💼 <span className="capitalize">{booking.work_type?.replace("_", " ") || "N/A"}</span>
                                            </span>
                                            {booking.estimated_salary && (
                                                <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
                                                    💰 <span>PKR {parseInt(booking.estimated_salary).toLocaleString()}</span>
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                📍 <span>{booking.city_name || booking.city?.name || (typeof booking.city === "string" ? booking.city : null) || "N/A"}</span>
                                            </span>
                                            {booking.start_date && (
                                                <span className="flex items-center gap-1">
                                                    📅 <span>{new Date(booking.start_date).toLocaleDateString()}</span>
                                                </span>
                                            )}
                                        </div>

                                        {booking.address && (
                                            <div className="mb-3">
                                                <div className="flex items-start gap-1 text-sm text-gray-600 dark:text-gray-300">
                                                    <span className="mt-0.5">🏠</span>
                                                    <span>{booking.address}</span>
                                                </div>
                                                {booking.address_privacy_note && (
                                                    <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-1 ml-5 italic">
                                                        ℹ️ {booking.address_privacy_note}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-4 mt-2">
                                            {booking.job_applications_count !== undefined && (
                                                <div className={`flex items-center px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 ${booking.job_applications_count > 0
                                                    ? "text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30 bg-indigo-50 dark:bg-indigo-900/20"
                                                    : "text-gray-500 dark:text-gray-400"
                                                    }`}>
                                                    <span className="mr-2 text-lg">👥</span>
                                                    <span className="font-semibold">
                                                        {booking.job_applications_count} Applicant{booking.job_applications_count !== 1 ? "s" : ""}
                                                    </span>
                                                </div>
                                            )}

                                            {booking.assigned_user && (
                                                <div className="flex items-center px-4 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-green-700 dark:text-green-400">
                                                    <span className="mr-2 text-lg">✅</span>
                                                    <span className="font-semibold">Assigned: {booking.assigned_user?.name || booking.helper?.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-700">
                                        <Link
                                            to={route("job-posts.show", booking.id)}
                                            className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                                        >
                                            View Details
                                        </Link>
                                        <Link
                                            to={route("job-posts.edit", booking.id)}
                                            className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            Edit
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Pagination */}
                        {bookings.links && bookings.links.length > 3 && (
                            <div className="mt-8 flex justify-center">
                                <div className="flex flex-wrap justify-center gap-2">
                                    {bookings.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            to={link.url || "#"}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center min-w-[40px] ${link.active
                                                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-700"
                                                } ${!link.url && "cursor-not-allowed opacity-50"}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
                        <div className="text-7xl mb-6 opacity-80">📝</div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No job postings yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
                            Ready to get help? Post your first job request today and connect with skilled helpers.
                        </p>
                        <Link
                            to={route("job-posts.create")}
                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-1"
                        >
                            <span className="mr-2 text-xl">✨</span> Post Your First Job
                        </Link>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
