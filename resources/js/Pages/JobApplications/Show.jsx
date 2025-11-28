import { Link, useParams, useNavigate } from "react-router-dom";
import PublicLayout from "@/Layouts/PublicLayout";
import { useState, useEffect } from "react";
import { jobApplicationsService } from "@/services/jobApplications";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";
import PrimaryButton from "@/Components/PrimaryButton";
import DangerButton from "@/Components/DangerButton";
import SecondaryButton from "@/Components/SecondaryButton";

export default function JobApplicationShow() {
    const { applicationId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

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

    const handleAccept = async () => {
        if (!confirm("Are you sure you want to accept this application? This will reject all other applications.")) {
            return;
        }
        setProcessing(true);
        try {
            await jobApplicationsService.acceptApplication(application.id);
            const data = await jobApplicationsService.getApplication(application.id);
            setApplication(data.application);
        } catch (error) {
            console.error("Error accepting application:", error);
            alert("Failed to accept application. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!confirm("Are you sure you want to reject this application?")) {
            return;
        }
        setProcessing(true);
        try {
            await jobApplicationsService.rejectApplication(application.id);
            const data = await jobApplicationsService.getApplication(application.id);
            setApplication(data.application);
        } catch (error) {
            console.error("Error rejecting application:", error);
            alert("Failed to reject application. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    const handleWithdraw = async () => {
        if (!confirm("Are you sure you want to withdraw this application?")) {
            return;
        }
        setProcessing(true);
        try {
            await jobApplicationsService.withdrawApplication(application.id);
            const data = await jobApplicationsService.getApplication(application.id);
            setApplication(data.application);
        } catch (error) {
            console.error("Error withdrawing application:", error);
            alert("Failed to withdraw application. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <PublicLayout>
                <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-8">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="bg-white rounded-xl shadow-md p-8 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                            <p className="text-gray-600">Loading application details...</p>
                        </div>
                    </div>
                </div>
            </PublicLayout>
        );
    }

    if (error || !application) {
        return (
            <PublicLayout>
                <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-8">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="bg-white rounded-xl shadow-md p-8 text-center">
                            <p className="text-red-600 mb-4">{error || "Application not found"}</p>
                            <Link
                                to={route("job-applications.index")}
                                className="inline-block bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 transition duration-300 font-semibold shadow-md hover:shadow-lg"
                            >
                                Back to Applications
                            </Link>
                        </div>
                    </div>
                </div>
            </PublicLayout>
        );
    }

    const isBookingOwner = user?.id === application.booking.user_id;
    const isApplicant = user?.id === application.user_id;
    const statusLabel = application.status.charAt(0).toUpperCase() + application.status.slice(1);

    return (
        <PublicLayout>
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">Application Details</h1>
                            <p className="text-sm text-gray-600">View and manage application information</p>
                        </div>
                        <Link
                            to={isBookingOwner ? route("job-applications.my-request-applications") : route("job-applications.my-applications")}
                            className="px-4 py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors text-sm"
                        >
                            ← Back
                        </Link>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Status Card */}
                            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-gray-900">Application Status</h2>
                                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                        <span className="text-lg">📋</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(application.status)}`}>
                                        {statusLabel}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        Applied on {new Date(application.applied_at).toLocaleDateString("en-US", { 
                                            year: "numeric", 
                                            month: "long", 
                                            day: "numeric" 
                                        })}
                                    </span>
                                </div>
                            </div>

                            {/* Applicant Information */}
                            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-gray-900">Applicant Information</h2>
                                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                        <span className="text-lg">👤</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Name</p>
                                        <p className="text-base font-bold text-gray-900">{application.user?.name}</p>
                                    </div>
                                    {application.user?.phone && (
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Phone</p>
                                            <p className="text-base text-gray-900 flex items-center gap-2">
                                                <span>📞</span>
                                                {application.user.phone}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Service Request Information */}
                            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-gray-900">Service Request</h2>
                                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                        <span className="text-lg">🔧</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Service Type</p>
                                        <p className="text-base font-semibold text-gray-900 capitalize">
                                            {application.booking?.service_type?.replace("_", " ") || "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Work Type</p>
                                        <p className="text-base font-semibold text-gray-900 capitalize">
                                            {application.booking?.work_type?.replace("_", " ") || "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Location</p>
                                        <p className="text-base text-gray-900 flex items-center gap-2">
                                            <span>📍</span>
                                            {application.booking.city}, {application.booking.area}
                                        </p>
                                    </div>
                                    {application.booking?.start_date && (
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Start Date</p>
                                            <p className="text-base text-gray-900">
                                                {new Date(application.booking.start_date).toLocaleDateString("en-US", { 
                                                    year: "numeric", 
                                                    month: "long", 
                                                    day: "numeric" 
                                                })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Application Message */}
                            {application.message && (
                                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-bold text-gray-900">Application Message</h2>
                                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                            <span className="text-lg">💬</span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{application.message}</p>
                                    </div>
                                </div>
                            )}

                            {/* Proposed Rate */}
                            {application.proposed_rate && (
                                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-bold text-gray-900">Proposed Rate</h2>
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                            <span className="text-lg">💰</span>
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-green-600">PKR {application.proposed_rate.toLocaleString()}/month</p>
                                </div>
                            )}
                        </div>

                        {/* Sidebar - Actions */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Actions Card */}
                            {isBookingOwner && application.status === "pending" && (
                                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 sticky top-6">
                                    <h3 className="text-base font-bold text-gray-900 mb-4">Actions</h3>
                                    <div className="space-y-3">
                                        <PrimaryButton
                                            onClick={handleAccept}
                                            disabled={processing}
                                            className="w-full"
                                        >
                                            {processing ? "Processing..." : "Accept Application"}
                                        </PrimaryButton>
                                        <DangerButton
                                            onClick={handleReject}
                                            disabled={processing}
                                            className="w-full"
                                        >
                                            {processing ? "Processing..." : "Reject Application"}
                                        </DangerButton>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-4">
                                        Accepting this application will automatically reject all other pending applications for this service request.
                                    </p>
                                </div>
                            )}

                            {isApplicant && application.status === "pending" && (
                                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 sticky top-6">
                                    <h3 className="text-base font-bold text-gray-900 mb-4">Actions</h3>
                                    <SecondaryButton
                                        onClick={handleWithdraw}
                                        disabled={processing}
                                        className="w-full"
                                    >
                                        {processing ? "Processing..." : "Withdraw Application"}
                                    </SecondaryButton>
                                </div>
                            )}

                            {application.status === "accepted" && (
                                <div className="bg-green-50 border-2 border-green-200 rounded-xl shadow-md p-6">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <span className="text-3xl">✓</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-green-800 mb-2">Application Accepted!</h3>
                                        <p className="text-sm text-green-700 mb-4">This application has been accepted and the helper has been assigned.</p>
                                        <Link
                                            to={route("bookings.show", application.booking.id)}
                                            className="inline-block bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition duration-300 font-semibold shadow-md hover:shadow-lg text-sm"
                                        >
                                            View Booking Details
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {application.status === "rejected" && (
                                <div className="bg-red-50 border-2 border-red-200 rounded-xl shadow-md p-6">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <span className="text-3xl">✗</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-red-800 mb-2">Application Rejected</h3>
                                        <p className="text-sm text-red-700">This application has been rejected.</p>
                                    </div>
                                </div>
                            )}

                            {application.status === "withdrawn" && (
                                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl shadow-md p-6">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <span className="text-3xl">↩️</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800 mb-2">Application Withdrawn</h3>
                                        <p className="text-sm text-gray-700">This application has been withdrawn.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
