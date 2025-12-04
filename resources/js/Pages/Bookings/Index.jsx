import { Link } from "react-router-dom";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { route } from "@/utils/routes";
import { useState, useEffect } from "react";
import { bookingsService } from "@/services/bookings";

export default function BookingsIndex() {
    const [bookings, setBookings] = useState({ data: [], links: [], meta: {} });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        bookingsService.getBookings()
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
        <DashboardLayout>
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold mb-4">My Job Postings</h1>
                            <p className="text-xl text-white/90">View all your job postings</p>
                        </div>
                        <Link
                            to={route("bookings.create")}
                            className="bg-white text-primary-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition duration-300 font-semibold"
                        >
                            + Post a Job
                        </Link>
                    </div>
                </div>
            </div>
            <div className="container mx-auto px-4 py-12">
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600">Loading jobs...</p>
                    </div>
                ) : bookings.data && bookings.data.length > 0 ? (
                    <div className="space-y-6">
                        {bookings.data.map((booking) => (
                            <div
                                key={booking.id}
                                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <Link
                                        to={route("bookings.show", booking.id)}
                                        className="flex-1"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-gray-900 capitalize">
                                                {booking.service_type?.replace("_", " ") || "N/A"}
                                            </h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                                                {booking.status?.replace("_", " ") || "N/A"}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 mb-2 capitalize">
                                            {booking.work_type?.replace("_", " ") || "N/A"} • {booking.city || "N/A"}, {booking.area || "N/A"}
                                        </p>
                                        {booking.start_date && (
                                            <p className="text-gray-500 text-sm mb-2">📅 Start: {booking.start_date}</p>
                                        )}
                                        {booking.helper && (
                                            <p className="text-green-600 font-semibold mt-2">
                                                ✓ Assigned to: {booking.helper.name}
                                            </p>
                                        )}
                                        {!booking.helper && (
                                            <p className="text-yellow-600 font-semibold mt-2">
                                                ⏳ Waiting for helper assignment
                                            </p>
                                        )}
                                    </Link>
                                    <div className="ml-4 flex gap-2">
                                        <Link
                                            to={route("bookings.edit", booking.id)}
                                            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition duration-300 font-semibold text-sm"
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
                                <div className="flex space-x-2">
                                    {bookings.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            to={link.url || "#"}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                                                link.active
                                                    ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg"
                                                    : "bg-white text-gray-700 hover:bg-gray-100 shadow-md"
                                            } ${!link.url && "cursor-not-allowed opacity-50"}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-xl">
                        <div className="text-6xl mb-4">📝</div>
                        <p className="text-gray-600 text-xl mb-6">No job postings yet</p>
                        <p className="text-gray-500 mb-8">Post your first job posting to get started</p>
                        <Link
                            to={route("bookings.create")}
                            className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg font-semibold inline-block"
                        >
                            Post Service Request
                        </Link>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

