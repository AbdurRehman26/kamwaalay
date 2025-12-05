import { Link, useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { useState, useEffect } from "react";
import { jobApplicationsService } from "@/services/jobApplications";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";
import ChatPopup from "@/Components/ChatPopup";
import Modal from "@/Components/Modal";

export default function JobApplicationShow() {
    const { applicationId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [chatOpen, setChatOpen] = useState(false);
    const [selectedRecipient, setSelectedRecipient] = useState(null);
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
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

    const formatPhoneForCall = (phone) => {
        return phone.replace(/[^0-9+]/g, "");
    };

    const formatPhoneForWhatsApp = (phone) => {
        let cleaned = phone.replace(/[^0-9]/g, "");
        if (cleaned.startsWith("92")) {
            cleaned = cleaned.substring(2);
        } else if (cleaned.startsWith("0092")) {
            cleaned = cleaned.substring(4);
        } else if (cleaned.startsWith("+92")) {
            cleaned = cleaned.substring(3);
        }
        return cleaned;
    };

    const handleOpenChat = (recipient) => {
        setSelectedRecipient(recipient);
        setChatOpen(true);
    };

    const handleAccept = async () => {
        setProcessing(true);
        try {
            await jobApplicationsService.acceptApplication(application.id);
            const data = await jobApplicationsService.getApplication(application.id);
            setApplication(data.application);
            setShowAcceptModal(false);
        } catch (error) {
            console.error("Error accepting application:", error);
            alert("Failed to accept application. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        setProcessing(true);
        try {
            await jobApplicationsService.rejectApplication(application.id);
            const data = await jobApplicationsService.getApplication(application.id);
            setApplication(data.application);
            setShowRejectModal(false);
        } catch (error) {
            console.error("Error rejecting application:", error);
            alert("Failed to reject application. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    const handleWithdraw = async () => {
        if (confirm("Are you sure you want to withdraw this application?")) {
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
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="container mx-auto px-4 py-12 text-center">
                    <p className="text-gray-600">Loading application details...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !application) {
        return (
            <DashboardLayout>
                <div className="container mx-auto px-4 py-12 text-center">
                    <p className="text-red-600">{error || "Application not found"}</p>
                    <Link
                        to={route("job-applications.index")}
                        className="mt-4 inline-block bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition duration-300 font-semibold"
                    >
                        Back to Applications
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    const jobPost = application.job_post || application.booking;
    const isBookingOwner = user?.id === jobPost?.user_id;
    const isApplicant = user?.id === application.user_id;
    // For job owner: show applicant info. For applicant: show job owner info
    const displayUser = isBookingOwner ? application.user : (jobPost?.user || {});
    // Job poster can always see contact info and initiate contact
    // Applicants can only see contact info if their application is accepted
    const canSeeContactInfo = isBookingOwner || (isApplicant && application.status === "accepted");
    // Job poster can always initiate contact (call, WhatsApp, message)
    // Applicants can only initiate contact if application is accepted
    const canInitiateContact = isBookingOwner || (isApplicant && application.status === "accepted");

    return (
        <DashboardLayout>
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold mb-4">Application Details</h1>
                            <p className="text-xl text-white/90">View and manage application information</p>
                        </div>
                        <Link
                            to={route("job-applications.index")}
                            className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg transition duration-300 font-semibold backdrop-blur-sm"
                        >
                            ← Back to Applications
                        </Link>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="max-w-5xl mx-auto">
                    {/* Status Badge */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(application.status)}`}>
                                    {application.status.toUpperCase()}
                                </span>
                                <span className="text-gray-500 text-sm">
                                    Applied on {new Date(application.applied_at).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric"
                                    })}
                                </span>
                            </div>
                            {isApplicant && application.status === "pending" && (
                                <button
                                    onClick={handleWithdraw}
                                    disabled={processing}
                                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition duration-300 font-semibold disabled:opacity-50"
                                >
                                    Withdraw Application
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        {/* Applicant/Job Owner Info */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                {isBookingOwner ? "Applicant Information" : "Job Owner Information"}
                            </h2>
                            
                            <div className="flex items-center gap-4 mb-4">
                                {displayUser?.photo ? (
                                    <img
                                        src={`/storage/${displayUser.photo}`}
                                        alt={displayUser?.name}
                                        className="w-20 h-20 rounded-full object-cover border-2 border-primary-200"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center text-white font-bold text-2xl border-2 border-primary-200">
                                        {displayUser?.name?.charAt(0)?.toUpperCase() || "U"}
                                    </div>
                                )}
                                <div className="flex-1">
                                    <Link
                                        to={displayUser?.role === "helper" 
                                            ? route("helpers.show", displayUser.id)
                                            : displayUser?.role === "business"
                                            ? route("businesses.show", displayUser.id)
                                            : "#"
                                        }
                                        className="block"
                                    >
                                        <h3 className="text-xl font-bold text-gray-900 hover:text-primary-600 transition-colors">
                                            {displayUser?.name || "N/A"}
                                        </h3>
                                    </Link>
                                    <p className="text-gray-500 text-sm capitalize">
                                        {displayUser?.role || "User"}
                                    </p>
                                </div>
                            </div>

                            {canSeeContactInfo && displayUser?.phone ? (
                                <div className="mt-4">
                                    <p className="text-gray-700 text-sm mb-3 font-medium">📞 {displayUser.phone}</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {canInitiateContact ? (
                                            <>
                                                <a
                                                    href={`tel:${formatPhoneForCall(displayUser.phone)}`}
                                                    className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 transition duration-300 font-medium text-sm"
                                                >
                                                    <span>📞</span>
                                                    <span>Call</span>
                                                </a>
                                                <a
                                                    href={`https://wa.me/${formatPhoneForWhatsApp(displayUser.phone)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 transition duration-300 font-medium text-sm"
                                                >
                                                    <span>💬</span>
                                                    <span>WhatsApp</span>
                                                </a>
                                            </>
                                        ) : null}
                                        {/* Job poster can always initiate in-app messages, applicants only if accepted */}
                                        {(isBookingOwner || (isApplicant && application.status === "accepted")) ? (
                                            <button
                                                onClick={() => handleOpenChat(displayUser)}
                                                className="flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-lg hover:bg-primary-100 transition duration-300 font-medium text-sm"
                                            >
                                                <span>💬</span>
                                                <span>Message</span>
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            ) : isApplicant && application.status !== "accepted" ? (
                                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-yellow-800 text-sm">
                                        <span className="font-semibold">Contact information will be available</span> once your application is accepted.
                                    </p>
                                </div>
                            ) : null}
                        </div>

                        {/* Job Post Information */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Job Posting Details</h2>
                            
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Service Type</p>
                                    <p className="text-gray-900 font-semibold capitalize">
                                        {jobPost?.service_type?.replace("_", " ") || "N/A"}
                                    </p>
                                </div>
                                
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Work Type</p>
                                    <p className="text-gray-900 font-semibold capitalize">
                                        {jobPost?.work_type?.replace("_", " ") || "N/A"}
                                    </p>
                                </div>
                                
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Location</p>
                                    <p className="text-gray-900 font-semibold">
                                        {jobPost?.city || "N/A"}{jobPost?.area ? `, ${jobPost.area}` : ""}
                                    </p>
                                    {jobPost?.address && (
                                        <p className="text-gray-600 text-sm mt-1">{jobPost.address}</p>
                                    )}
                                </div>

                                {jobPost?.start_date && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Start Date</p>
                                        <p className="text-gray-900 font-semibold">
                                            {new Date(jobPost.start_date).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric"
                                            })}
                                        </p>
                                    </div>
                                )}

                                {jobPost?.start_time && (
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Start Time</p>
                                        <p className="text-gray-900 font-semibold">
                                            {new Date(jobPost.start_time).toLocaleTimeString("en-US", {
                                                hour: "numeric",
                                                minute: "2-digit",
                                                hour12: true
                                            })}
                                        </p>
                                    </div>
                                )}

                                {jobPost && (
                                    <div className="pt-3 border-t border-gray-200">
                                        <Link
                                            to={route("bookings.show", jobPost.id)}
                                            className="text-primary-600 hover:text-primary-700 font-semibold text-sm"
                                        >
                                            View Full Job Details →
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Application Message */}
                    {application.message && (
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Application Message</h2>
                            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary-500">
                                <p className="text-gray-700 whitespace-pre-wrap">{application.message}</p>
                            </div>
                        </div>
                    )}

                    {/* Proposed Rate */}
                    {application.proposed_rate && (
                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Proposed Rate</h2>
                            <p className="text-3xl font-bold text-green-600">PKR {application.proposed_rate}/hr</p>
                        </div>
                    )}

                    {/* Actions */}
                    {isBookingOwner && application.status === "pending" && (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowAcceptModal(true)}
                                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-300 font-semibold"
                                >
                                    Accept Application
                                </button>
                                <button
                                    onClick={() => setShowRejectModal(true)}
                                    className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition duration-300 font-semibold"
                                >
                                    Reject Application
                                </button>
                            </div>
                        </div>
                    )}

                    {application.status === "accepted" && jobPost && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                            <div className="flex items-center justify-center mb-4">
                                <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-green-800 font-semibold text-xl mb-4">Application Accepted!</p>
                            <Link
                                to={route("bookings.show", jobPost.id)}
                                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-300 font-semibold"
                            >
                                View Booking Details
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Popup */}
            {selectedRecipient && (
                <ChatPopup
                    recipientId={selectedRecipient.id}
                    recipientName={selectedRecipient.name}
                    recipientPhoto={selectedRecipient.photo}
                    isOpen={chatOpen}
                    onClose={() => {
                        setChatOpen(false);
                        setSelectedRecipient(null);
                    }}
                />
            )}

            {/* Accept Modal */}
            <Modal show={showAcceptModal} onClose={() => {
                if (!processing) {
                    setShowAcceptModal(false);
                }
            }}>
                <div className="p-6">
                    <div className="flex items-center mb-4">
                        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="ml-4 text-xl font-semibold text-gray-900">
                            Accept Application
                        </h2>
                    </div>

                    <p className="mt-2 text-sm text-gray-600 mb-4">
                        Are you sure you want to accept this application from <span className="font-semibold">{application?.user?.name}</span>? 
                        This will automatically reject all other pending applications for this job posting.
                    </p>

                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="text-sm font-semibold text-blue-900 mb-1">Information Sharing Notice</p>
                                <p className="text-sm text-blue-800">
                                    By accepting this application, your contact information (phone number) will be shared with <span className="font-semibold">{application?.user?.name}</span>. 
                                    They will be able to contact you via phone, WhatsApp, or in-app messaging.
                                </p>
                            </div>
                        </div>
                    </div>

                    {application?.proposed_rate && (
                        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-sm text-gray-700 mb-1">
                                <span className="font-semibold">Proposed Rate:</span> PKR {application.proposed_rate}/hr
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => {
                                if (!processing) {
                                    setShowAcceptModal(false);
                                }
                            }}
                            disabled={processing}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAccept}
                            disabled={processing}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                        >
                            {processing ? "Accepting..." : "Accept Application"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Reject Modal */}
            <Modal show={showRejectModal} onClose={() => {
                if (!processing) {
                    setShowRejectModal(false);
                }
            }}>
                <div className="p-6">
                    <div className="flex items-center mb-4">
                        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="ml-4 text-xl font-semibold text-gray-900">
                            Reject Application
                        </h2>
                    </div>

                    <p className="mt-2 text-sm text-gray-600 mb-6">
                        Are you sure you want to reject this application from <span className="font-semibold">{application?.user?.name}</span>? 
                        This action cannot be undone.
                    </p>

                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => {
                                if (!processing) {
                                    setShowRejectModal(false);
                                }
                            }}
                            disabled={processing}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReject}
                            disabled={processing}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                        >
                            {processing ? "Rejecting..." : "Reject Application"}
                        </button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
