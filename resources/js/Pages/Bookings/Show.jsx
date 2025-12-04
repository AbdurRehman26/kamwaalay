import { Link, useParams, useNavigate } from "react-router-dom";
import PublicLayout from "@/Layouts/PublicLayout";
import { useState, useEffect } from "react";
import { bookingsService } from "@/services/bookings";
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
            bookingsService.getBooking(bookingId)
                .then((data) => {
                    setBooking(data.booking);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error("Error fetching booking:", err);
                    setError(err.response?.data?.message || "Failed to load booking");
                    setLoading(false);
                });
        }
    }, [bookingId]);

    if (loading) {
        return (
            <PublicLayout>
                
                <div className="container mx-auto px-4 py-12 text-center">
                    <p className="text-gray-600">Loading booking details...</p>
                </div>
            </PublicLayout>
        );
    }

    if (error || !booking) {
        return (
            <PublicLayout>
                
                <div className="container mx-auto px-4 py-12 text-center">
                    <p className="text-red-600">{error || "Booking not found"}</p>
                    <Link
                        to={route("bookings.index")}
                        className="mt-4 inline-block bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition duration-300 font-semibold"
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
                return "bg-yellow-100 text-yellow-800";
            case "confirmed":
                return "bg-green-100 text-green-800";
            case "in_progress":
                return "bg-primary-100 text-primary-800";
            case "completed":
                return "bg-gray-100 text-gray-800";
            case "cancelled":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <PublicLayout>
            
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">Service Request Details</h1>
                </div>
            </div>
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="bg-primary-100 text-primary-800 px-4 py-2 rounded-full font-semibold capitalize">
                                {booking.service_type?.replace("_", " ") || "N/A"}
                            </span>
                            <span className={`px-4 py-2 rounded-full font-semibold ${getStatusColor(booking.status)}`}>
                                {booking.status?.replace("_", " ") || "N/A"}
                            </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Service Type</h3>
                                <p className="text-gray-900 capitalize">{booking.service_type?.replace("_", " ") || "N/A"}</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Work Type</h3>
                                <p className="text-gray-900 capitalize">{booking.work_type?.replace("_", " ") || "N/A"}</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Location</h3>
                                <p className="text-gray-900">{booking.city}, {booking.area}</p>
                            </div>
                            {booking.start_date && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Start Date</h3>
                                    <p className="text-gray-900">{booking.start_date}</p>
                                </div>
                            )}
                            {booking.special_requirements && (
                                <div className="md:col-span-2">
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Special Requirements</h3>
                                    <p className="text-gray-900 whitespace-pre-wrap">{booking.special_requirements}</p>
                                </div>
                            )}
                        </div>

                        {booking.assigned_user_id && booking.helper && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                                <h3 className="text-lg font-semibold text-green-800 mb-2">Assigned Helper</h3>
                                <p className="text-green-900 font-bold text-xl">{booking.helper.name}</p>
                                {booking.helper.phone && (
                                    <p className="text-green-700">📞 {booking.helper.phone}</p>
                                )}
                            </div>
                        )}

                        {!booking.assigned_user_id && isOwner && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                <p className="text-yellow-800 mb-4">No helper assigned yet. Check applications to your request.</p>
                                <Link
                                    to={route("job-applications.my-request-applications")}
                                    className="inline-block bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 transition duration-300 font-semibold"
                                >
                                    View Applications
                                </Link>
                            </div>
                        )}

                        {!booking.assigned_user_id && isHelper && booking.status === "pending" && (
                            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
                                <p className="text-primary-800 mb-4">This service request is open for applications.</p>
                                <Link
                                    to={route("job-applications.create", booking.id)}
                                    className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition duration-300 font-semibold"
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
                                    to={route("bookings.index")}
                                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition duration-300 font-semibold text-center"
                                >
                                    Back to My Requests
                                </Link>
                                {isHelper && !booking.assigned_user_id && booking.status === "pending" && (
                                    <Link
                                        to={route("job-applications.create", booking.id)}
                                        className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg font-semibold text-center"
                                    >
                                        Apply to This Request
                                    </Link>
                                )}
                            </>
                        ) : (
                            <>
                                <Link
                                    to={route("service-requests.browse")}
                                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition duration-300 font-semibold text-center"
                                >
                                    Back to Search Jobs
                                </Link>
                                <Link
                                    to={route("login")}
                                    className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg font-semibold text-center"
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

