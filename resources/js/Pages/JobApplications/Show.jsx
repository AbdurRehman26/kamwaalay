import { Link, useParams, useNavigate } from "react-router-dom";
import PublicLayout from "@/Layouts/PublicLayout";
import { useState, useEffect } from "react";
import { jobApplicationsService } from "@/services/jobApplications";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";
import PrimaryButton from "@/Components/PrimaryButton";
import DangerButton from "@/Components/DangerButton";
import SecondaryButton from "@/Components/SecondaryButton";
import ChatPopup from "@/Components/ChatPopup";

export default function JobApplicationShow() {
    const { applicationId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);

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

    // Format phone number for WhatsApp (add +92 if needed)
    const formatPhoneForWhatsApp = (phone) => {
        if (!phone) return "";
        
        // Check if it starts with +92 (with or without spaces)
        const trimmed = phone.trim();
        if (trimmed.startsWith("+92") || trimmed.startsWith("+ 92")) {
            // Remove all non-digit characters, which will keep 92 at the start
            return trimmed.replace(/\D/g, "");
        }
        
        // Remove all non-digit characters
        let cleaned = phone.replace(/\D/g, "");
        
        // If starts with 0, replace with 92
        if (cleaned.startsWith("0")) {
            cleaned = "92" + cleaned.substring(1);
        }
        // If doesn't start with 92, add it
        else if (!cleaned.startsWith("92")) {
            cleaned = "92" + cleaned;
        }
        
        return cleaned;
    };

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
                                    
                                    {/* Contact Options */}
                                    {isBookingOwner && application.user?.phone && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <p className="text-sm text-gray-600 mb-3 font-medium">Contact Applicant:</p>
                                            <div className="flex items-center gap-3">
                                                {/* In-app Message Icon */}
                                                {user ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setChatOpen(true);
                                                        }}
                                                        className="flex items-center justify-center w-12 h-12 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-all duration-300 shadow-md hover:shadow-lg"
                                                        title="Send Message"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                        </svg>
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            navigate(route("login"));
                                                        }}
                                                        className="flex items-center justify-center w-12 h-12 bg-gray-400 text-white rounded-full cursor-not-allowed opacity-60 hover:bg-gray-500 transition-all duration-300 shadow-md"
                                                        title="Please login to send message"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                        </svg>
                                                    </button>
                                                )}
                                                
                                                {/* Call Icon */}
                                                <a
                                                    href={`tel:${application.user.phone}`}
                                                    className="flex items-center justify-center w-12 h-12 bg-green-600 text-white rounded-full hover:bg-green-700 transition-all duration-300 shadow-md hover:shadow-lg"
                                                    title="Call"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                </a>
                                                
                                                {/* WhatsApp Icon */}
                                                <a
                                                    href={`https://wa.me/${formatPhoneForWhatsApp(application.user.phone)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center w-12 h-12 bg-[#25D366] text-white rounded-full hover:bg-[#20BA5A] transition-all duration-300 shadow-md hover:shadow-lg"
                                                    title="WhatsApp"
                                                >
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                                    </svg>
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Job Information */}
                            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-gray-900">Job</h2>
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
                                        Accepting this application will automatically reject all other pending applications for this job.
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
            
            {/* Chat Popup */}
            {application?.user && (
                <ChatPopup
                    recipientId={application.user.id}
                    recipientName={application.user.name}
                    recipientPhoto={application.user.photo}
                    isOpen={chatOpen}
                    onClose={() => setChatOpen(false)}
                />
            )}
        </PublicLayout>
    );
}
