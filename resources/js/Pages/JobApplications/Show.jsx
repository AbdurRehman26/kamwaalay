import { Link, useParams, useNavigate } from "react-router-dom";
import PublicLayout from "@/Layouts/PublicLayout";
import { useState, useEffect } from "react";
import { jobApplicationsService } from "@/services/jobApplications";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";

export default function JobApplicationShow() {
    const { applicationId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (applicationId) {
            jobApplicationsService.getApplication(applicationId)
                .then((data) => {
                    setApplication(data.application);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error("Error fetching application:", err);
                    setError(err.response?.data?.message || "Failed to load application");
                    setLoading(false);
                });
        }
    }, [applicationId]);

    if (loading) {
        return (
            <PublicLayout>
                
                <div className="container mx-auto px-4 py-12 text-center">
                    <p className="text-gray-600">Loading application details...</p>
                </div>
            </PublicLayout>
        );
    }

    if (error || !application) {
        return (
            <PublicLayout>
                
                <div className="container mx-auto px-4 py-12 text-center">
                    <p className="text-red-600">{error || "Application not found"}</p>
                    <Link
                        to={route("job-applications.index")}
                        className="mt-4 inline-block bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition duration-300 font-semibold"
                    >
                        Back to Applications
                    </Link>
                </div>
            </PublicLayout>
        );
    }
    const getStatusColor = (status) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "accepted":
                return "bg-green-100 text-green-800";
            case "rejected":
                return "bg-red-100 text-red-800";
            case "withdrawn":
                return "bg-gray-100 text-gray-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const isBookingOwner = auth?.user?.id === application.booking.user_id;
    const isApplicant = auth?.user?.id === application.user_id;

    return (
        <PublicLayout>
            
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">Application Details</h1>
                </div>
            </div>
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(application.status)}`}>
                                {application.status.toUpperCase()}
                            </span>
                            <span className="text-gray-500 text-sm">Applied on {new Date(application.applied_at).toLocaleDateString()}</span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Applicant</h3>
                                <p className="text-gray-900 font-bold text-xl">{application.user?.name}</p>
                                {application.user?.phone && (
                                    <p className="text-gray-600">📞 {application.user.phone}</p>
                                )}
                                {application.user?.email && (
                                    <p className="text-gray-600">✉️ {application.user.email}</p>
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Service Request</h3>
                                <p className="text-gray-900 capitalize">{application.booking?.service_type?.replace("_", " ") || "N/A"}</p>
                                <p className="text-gray-900 capitalize">{application.booking?.work_type?.replace("_", " ") || "N/A"}</p>
                                <p className="text-gray-900">{application.booking.city}, {application.booking.area}</p>
                            </div>
                        </div>

                        {application.message && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Application Message</h3>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-gray-700 whitespace-pre-wrap">{application.message}</p>
                                </div>
                            </div>
                        )}

                        {application.proposed_rate && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Proposed Rate</h3>
                                <p className="text-2xl font-bold text-green-600">PKR {application.proposed_rate}/hr</p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    {isBookingOwner && application.status === "pending" && (
                        <div className="bg-white rounded-lg shadow-md p-8 flex gap-4">
                            <button
                                onClick={async () => {
                                    if (confirm("Are you sure you want to accept this application? This will reject all other applications.")) {
                                        try {
                                            await jobApplicationsService.acceptApplication(application.id);
                                            // Refresh application data
                                            const data = await jobApplicationsService.getApplication(application.id);
                                            setApplication(data.application);
                                        } catch (error) {
                                            console.error("Error accepting application:", error);
                                            alert("Failed to accept application. Please try again.");
                                        }
                                    }
                                }}
                                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-300 font-semibold"
                            >
                                Accept Application
                            </button>
                            <button
                                onClick={async () => {
                                    if (confirm("Are you sure you want to reject this application?")) {
                                        try {
                                            await jobApplicationsService.rejectApplication(application.id);
                                            // Refresh application data
                                            const data = await jobApplicationsService.getApplication(application.id);
                                            setApplication(data.application);
                                        } catch (error) {
                                            console.error("Error rejecting application:", error);
                                            alert("Failed to reject application. Please try again.");
                                        }
                                    }
                                }}
                                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition duration-300 font-semibold"
                            >
                                Reject Application
                            </button>
                        </div>
                    )}

                    {isApplicant && application.status === "pending" && (
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <button
                                onClick={() => {
                                    if (confirm("Are you sure you want to withdraw this application?")) {
                                        router.post(route("job-applications.withdraw", application.id));
                                    }
                                }}
                                className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition duration-300 font-semibold"
                            >
                                Withdraw Application
                            </button>
                        </div>
                    )}

                    {application.status === "accepted" && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                            <p className="text-green-800 font-semibold text-lg mb-4">✓ Application Accepted!</p>
                            <Link
                                to={route("bookings.show", application.booking.id)}
                                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-300 font-semibold"
                            >
                                View Booking Details
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}

