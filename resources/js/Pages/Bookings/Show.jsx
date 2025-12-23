import { Link, useParams, useNavigate } from "react-router-dom";
import PublicLayout from "@/Layouts/PublicLayout";
import { useState, useEffect } from "react";
import { jobPostsService } from "@/services/jobPosts";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";

export default function BookingShow() {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (bookingId) {
            jobPostsService.getBooking(bookingId)
                .then((data) => {
                    setBooking(data.job_post || data.booking);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error("Error fetching job post:", err);
                    setError(err.response?.data?.message || "Failed to load job post");
                    setLoading(false);
                });
        }
    }, [bookingId]);

    if (loading) {
        return (
            <PublicLayout>

                <div className="container mx-auto px-4 py-12 text-center">
                    <p className="text-gray-600 dark:text-gray-400">Loading booking details...</p>
                </div>
            </PublicLayout>
        );
    }

    if (error || !booking) {
        return (
            <PublicLayout>

                <div className="container mx-auto px-4 py-12 text-center">
                    <p className="text-red-600 dark:text-red-400">{error || "Booking not found"}</p>
                    <Link
                        to={route("job-posts.index")}
                        className="mt-4 inline-block bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-300 font-semibold"
                    >
                        Back to My Requests
                    </Link>
                </div>
            </PublicLayout>
        );
    }

    const isOwner = user?.id === booking.user_id;
    const isHelper = user?.role === "helper" || user?.role === "business";

    const getStatusColor = (status) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
            case "confirmed":
                return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
            case "in_progress":
                return "bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300";
            case "completed":
                return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
            case "cancelled":
                return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
        }
    };

    return (
        <PublicLayout>

            <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-800 dark:to-primary-900 text-white py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">Job Detail</h1>
                </div>
            </div>
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 p-8 mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 px-4 py-2 rounded-full font-semibold capitalize">
                                {booking.service_type?.replace("_", " ") || "N/A"}
                            </span>
                            <span className={`px-4 py-2 rounded-full font-semibold ${getStatusColor(booking.status)}`}>
                                {booking.status?.replace("_", " ") || "N/A"}
                            </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Service Type</h3>
                                <p className="text-gray-900 dark:text-white capitalize">{booking.service_type?.replace("_", " ") || "N/A"}</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Work Type</h3>
                                <p className="text-gray-900 dark:text-white capitalize">{booking.work_type?.replace("_", " ") || "N/A"}</p>
                            </div>
                            {booking.estimated_salary && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Estimated Salary</h3>
                                    <p className="text-green-600 dark:text-green-400 font-bold">PKR {parseInt(booking.estimated_salary).toLocaleString()}</p>
                                </div>
                            )}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Location</h3>
                                <p className="text-gray-900 dark:text-white mb-2">{booking.city || "N/A"}</p>
                                {booking.address && (
                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                            <span className="mt-0.5">🏠</span>
                                            <span>{booking.address}</span>
                                        </div>
                                        {booking.address_privacy_note && (
                                            <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-2 italic flex items-start gap-1">
                                                <span className="mt-0.5">ℹ️</span>
                                                <span>{booking.address_privacy_note}</span>
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                            {booking.start_date && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Start Date</h3>
                                    <p className="text-gray-900 dark:text-white">{booking.start_date}</p>
                                </div>
                            )}
                            {booking.special_requirements && (
                                <div className="md:col-span-2">
                                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Special Requirements</h3>
                                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{booking.special_requirements}</p>
                                </div>
                            )}
                        </div>

                        {booking.assigned_user_id && booking.helper && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                                <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">Assigned Helper</h3>
                                <p className="text-green-900 dark:text-green-200 font-bold text-xl">{booking.helper.name}</p>
                                {booking.helper.phone && (
                                    <p className="text-green-700 dark:text-green-300">📞 {booking.helper.phone}</p>
                                )}
                            </div>
                        )}

                        {!booking.assigned_user_id && isOwner && booking.job_applications && booking.job_applications.length > 0 && (
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6 mb-6">
                                <h3 className="text-xl font-bold text-indigo-800 dark:text-indigo-300 mb-4">
                                    📥 Applications ({booking.job_applications.length})
                                </h3>
                                <div className="space-y-4">
                                    {booking.job_applications.map((application) => (
                                        <div
                                            key={application.id}
                                            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900/50 shadow-sm"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    {application.user?.photo ? (
                                                        <img
                                                            src={application.user.photo.startsWith("http") ? application.user.photo : `/storage/${application.user.photo}`}
                                                            alt={application.user?.name}
                                                            className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-700"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                                                            {application.user?.name?.charAt(0) || "?"}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white">{application.user?.name || "Unknown"}</p>
                                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                            {application.user?.experience_years && (
                                                                <span>🏆 {application.user.experience_years} yrs exp</span>
                                                            )}
                                                            {application.user?.area && (
                                                                <span>📍 {application.user.area}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {application.proposed_rate && (
                                                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                                            PKR {application.proposed_rate}
                                                        </p>
                                                    )}
                                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${application.status === "pending" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300" :
                                                        application.status === "accepted" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" :
                                                            "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                                        }`}>
                                                        {application.status_label || application.status}
                                                    </span>
                                                </div>
                                            </div>
                                            {application.message && (
                                                <p className="mt-3 text-gray-600 dark:text-gray-300 text-sm bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                                    "{application.message}"
                                                </p>
                                            )}
                                            {application.status === "pending" && (
                                                <div className="mt-4 flex gap-2">
                                                    <Link
                                                        to={route("helpers.show", application.user?.id)}
                                                        className="text-sm px-4 py-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors font-semibold"
                                                    >
                                                        View Profile
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!booking.assigned_user_id && isOwner && (!booking.job_applications || booking.job_applications.length === 0) && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                                <p className="text-yellow-800 dark:text-yellow-300">No applications yet. Helpers will be able to apply to your job post.</p>
                            </div>
                        )}

                        {!booking.assigned_user_id && isHelper && booking.status === "pending" && (
                            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 mb-6">
                                <p className="text-primary-800 dark:text-primary-300 mb-4">This service request is open for applications.</p>
                                <Link
                                    to={route("job-applications.create", booking.id)}
                                    className="inline-block bg-primary-600 dark:bg-primary-700 text-white px-6 py-2 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition duration-300 font-semibold"
                                >
                                    Apply Now
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4">
                        {user ? (
                            <>
                                <Link
                                    to={route("job-posts.index")}
                                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-300 font-semibold text-center"
                                >
                                    Back to My Requests
                                </Link>
                                {isOwner && (
                                    <Link
                                        to={route("job-posts.edit", booking.id)}
                                        className="flex-1 bg-indigo-600 dark:bg-indigo-700 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition duration-300 font-semibold text-center"
                                    >
                                        ✏️ Edit Job Post
                                    </Link>
                                )}
                                {isHelper && !booking.assigned_user_id && booking.status === "pending" && (
                                    <Link
                                        to={route("job-applications.create", booking.id)}
                                        className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 dark:hover:from-primary-600 dark:hover:to-primary-700 transition-all duration-300 shadow-lg font-semibold text-center"
                                    >
                                        Apply to This Request
                                    </Link>
                                )}
                            </>
                        ) : (
                            <>
                                <Link
                                    to={route("job-posts.browse")}
                                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-300 font-semibold text-center"
                                >
                                    Back to Search Jobs
                                </Link>
                                <Link
                                    to={route("login")}
                                    className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 dark:hover:from-primary-600 dark:hover:to-primary-700 transition-all duration-300 shadow-lg font-semibold text-center"
                                >
                                    Login to Apply
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
