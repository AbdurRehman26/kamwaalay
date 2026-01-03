import DashboardLayout from "@/Layouts/DashboardLayout";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { route } from "@/utils/routes";
import { jobApplicationsService } from "@/services/jobApplications";
import ChatPopup from "@/Components/ChatPopup";
import Modal from "@/Components/Modal";

export default function MyRequestApplications() {
    const [applications, setApplications] = useState({ data: [], links: [], meta: {} });
    const [loading, setLoading] = useState(true);
    const [chatOpen, setChatOpen] = useState(false);
    const [selectedRecipient, setSelectedRecipient] = useState(null);
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        jobApplicationsService.getMyRequestApplications()
            .then((data) => {
                setApplications(data.applications || { data: [], links: [], meta: {} });
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching applications:", error);
                setLoading(false);
            });
    }, []);
    const getStatusColor = (status) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
            case "accepted":
                return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
            case "rejected":
                return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
            case "withdrawn":
                return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
            default:
                return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
        }
    };

    const handleAcceptClick = (application) => {
        setSelectedApplication(application);
        setShowAcceptModal(true);
    };

    const handleRejectClick = (application) => {
        setSelectedApplication(application);
        setShowRejectModal(true);
    };

    const handleAccept = async () => {
        if (!selectedApplication) return;

        setProcessing(true);
        try {
            await jobApplicationsService.acceptApplication(selectedApplication.id);
            // Refresh applications
            const data = await jobApplicationsService.getMyRequestApplications();
            setApplications(data.applications || { data: [], links: [], meta: {} });
            setShowAcceptModal(false);
            setSelectedApplication(null);
        } catch (error) {
            console.error("Error accepting application:", error);
            alert("Failed to accept application. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedApplication) return;

        setProcessing(true);
        try {
            await jobApplicationsService.rejectApplication(selectedApplication.id);
            // Refresh applications
            const data = await jobApplicationsService.getMyRequestApplications();
            setApplications(data.applications || { data: [], links: [], meta: {} });
            setShowRejectModal(false);
            setSelectedApplication(null);
        } catch (error) {
            console.error("Error rejecting application:", error);
            alert("Failed to reject application. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    const handleOpenChat = (user) => {
        setSelectedRecipient({
            id: user.id,
            name: user.name,
            photo: user.photo
        });
        setChatOpen(true);
    };

    const formatPhoneForWhatsApp = (phone) => {
        // Remove any non-digit characters
        let cleaned = phone.replace(/\D/g, "");
        // If it starts with 0, replace with 92 (Pakistan country code)
        if (cleaned.startsWith("0")) {
            cleaned = "92" + cleaned.substring(1);
        }
        // If it doesn't start with country code, add 92
        if (!cleaned.startsWith("92")) {
            cleaned = "92" + cleaned;
        }
        return cleaned;
    };

    const formatPhoneForCall = (phone) => {
        // Remove any non-digit characters
        let cleaned = phone.replace(/\D/g, "");
        // If it starts with 0, keep it (local format)
        // If it doesn't start with 0, add 0
        if (!cleaned.startsWith("0")) {
            cleaned = "0" + cleaned;
        }
        return cleaned;
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-10 relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">My Job Applications</h1>
                            <p className="text-indigo-100 text-lg max-w-2xl">
                                Review and manage applications for your job postings.
                            </p>
                        </div>
                    </div>
                    {/* Decorative blobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-20 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl transform translate-y-1/2"></div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <p className="text-gray-500 animate-pulse">Loading applications...</p>
                        </div>
                    </div>
                ) : applications.data && applications.data.length > 0 ? (
                    <div className="space-y-6">
                        {applications.data.map((application) => (
                            <div key={application.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        {/* Job Post Details */}
                                        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex flex-col gap-1">
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {(application.job_post || application.booking)?.service_type_label ||
                                                            (application.job_post || application.booking)?.service_type?.replace("_", " ") ||
                                                            "Service Request"}
                                                    </h3>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded capitalize">
                                                            {(application.job_post || application.booking)?.work_type?.replace("_", " ") || "Work Type N/A"}
                                                        </span>
                                                        <Link
                                                            to={route("job-posts.show", (application.job_post || application.booking)?.id)}
                                                            className="text-primary-600 hover:text-primary-700 text-sm font-medium hover:underline flex items-center gap-1"
                                                        >
                                                            View Job Post →
                                                        </Link>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(application.status)}`}>
                                                    {application.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Applicant Details */}
                                        <div className="flex items-start gap-4 mb-4">
                                            {application.user?.photo ? (
                                                <img
                                                    src={`/storage/${application.user.photo}`}
                                                    alt={application.user?.name}
                                                    className="w-16 h-16 rounded-full object-cover border-2 border-primary-200 dark:border-primary-600 shadow-sm"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center text-white font-bold text-xl border-2 border-primary-200 dark:border-primary-600 shadow-sm">
                                                    {application.user?.name?.charAt(0)?.toUpperCase() || "U"}
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Link
                                                        to={application.user?.role === "helper"
                                                            ? route("helpers.show", application.user.id)
                                                            : application.user?.role === "business"
                                                                ? route("businesses.show", application.user.id)
                                                                : "#"
                                                        }
                                                        className="hover:underline"
                                                    >
                                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                                                            {application.user?.name}
                                                        </h4>
                                                    </Link>
                                                    {application.user?.profile?.is_verified && (
                                                        <span className="text-blue-500" title="Verified Profile">
                                                            <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 space-y-1">
                                                    <div className="flex flex-wrap gap-x-3 items-center">
                                                        <span className="capitalize font-medium text-gray-700 dark:text-gray-300">{application.user?.role || "User"}</span>

                                                        {(application.user?.address || application.user?.city) && (
                                                            <span className="flex items-center gap-1">
                                                                <span>📍</span>
                                                                <span className="truncate max-w-[200px]" title={application.user.address || application.user.city?.name}>
                                                                    {application.user.address || application.user.city?.name}
                                                                </span>
                                                            </span>
                                                        )}

                                                        {application.user?.role === "helper" && (
                                                            <>
                                                                {application.user?.age && <span>• {application.user.age} Years Old</span>}
                                                                {application.user?.gender && <span className="capitalize">• {application.user.gender}</span>}
                                                            </>
                                                        )}

                                                        {application.user?.role === "business" && (
                                                            <span className="flex items-center gap-1">
                                                                <span>👥</span>
                                                                <span>{application.user.helpers?.length || 0} Workers</span>
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Services List for Helpers */}
                                                    {application.user?.role === "helper" && application.user?.service_listings?.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {application.user.service_listings.slice(0, 3).map((listing, index) => (
                                                                <span key={index} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 rounded text-xs capitalize">
                                                                    {listing.service_type_label || listing.service_type?.replace("_", " ")}
                                                                </span>
                                                            ))}
                                                            {application.user.service_listings.length > 3 && (
                                                                <span className="px-2 py-0.5 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-600 rounded text-xs">
                                                                    +{application.user.service_listings.length - 3} more
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Contact Buttons */}
                                                {application.user?.phone && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        <a
                                                            href={`tel:${formatPhoneForCall(application.user.phone)}`}
                                                            className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition duration-300 text-sm font-medium"
                                                        >
                                                            <span>📞</span>
                                                            <span>Call</span>
                                                        </a>
                                                        <a
                                                            href={`https://wa.me/${formatPhoneForWhatsApp(application.user.phone)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition duration-300 text-sm font-medium"
                                                        >
                                                            <span>💬</span>
                                                            <span>WhatsApp</span>
                                                        </a>
                                                        <button
                                                            onClick={() => handleOpenChat(application.user)}
                                                            className="flex items-center gap-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 px-3 py-1.5 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition duration-300 text-sm font-medium"
                                                        >
                                                            <span>✉️</span>
                                                            <span>Message</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Application Message */}
                                        {application.message && (
                                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-3 border border-gray-100 dark:border-gray-600">
                                                <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Cover Letter</h5>
                                                <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{application.message}</p>
                                            </div>
                                        )}

                                        {/* Proposed Rate */}
                                        {application.proposed_rate && (
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm text-gray-500 dark:text-gray-400">Proposed Rate:</span>
                                                <span className="text-green-600 dark:text-green-400 font-bold text-lg">PKR {Number(application.proposed_rate).toLocaleString()}</span>
                                                <span className="text-xs text-gray-400 dark:text-gray-500">/month</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    {application.status === "pending" && (
                                        <div className="flex flex-col gap-2 ml-4">
                                            <button
                                                onClick={() => handleAcceptClick(application)}
                                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-md hover:shadow-lg transition-all duration-300 font-medium text-sm w-24"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleRejectClick(application)}
                                                className="bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 font-medium text-sm w-24"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {/* Pagination */}
                        {applications.links && applications.links.length > 3 && (
                            <div className="mt-8 flex justify-center">
                                <div className="flex space-x-2">
                                    {applications.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            to={link.url || "#"}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${link.active
                                                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-md border border-gray-200 dark:border-gray-700"
                                                } ${!link.url && "cursor-not-allowed opacity-50"}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
                        <div className="text-7xl mb-6 opacity-80">📋</div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No applications yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">Applications to your job postings will appear here.</p>
                    </div>
                )}
            </div>
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
                    setSelectedApplication(null);
                }
            }}>
                <div className="p-6">
                    <div className="flex items-center mb-4">
                        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="ml-4 text-xl font-semibold text-gray-900 dark:text-white">
                            Accept Application
                        </h2>
                    </div>

                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 mb-6">
                        Are you sure you want to accept this application from <span className="font-semibold">{selectedApplication?.user?.name}</span>?
                        This will automatically reject all other pending applications for this job posting.
                    </p>

                    {selectedApplication?.proposed_rate && (
                        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                                <span className="font-semibold">Proposed Rate:</span> PKR {selectedApplication.proposed_rate}/hr
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => {
                                if (!processing) {
                                    setShowAcceptModal(false);
                                    setSelectedApplication(null);
                                }
                            }}
                            disabled={processing}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAccept}
                            disabled={processing}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
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
                    setSelectedApplication(null);
                }
            }}>
                <div className="p-6">
                    <div className="flex items-center mb-4">
                        <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="ml-4 text-xl font-semibold text-gray-900 dark:text-white">
                            Reject Application
                        </h2>
                    </div>

                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 mb-6">
                        Are you sure you want to reject this application from <span className="font-semibold">{selectedApplication?.user?.name}</span>?
                        This action cannot be undone.
                    </p>

                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => {
                                if (!processing) {
                                    setShowRejectModal(false);
                                    setSelectedApplication(null);
                                }
                            }}
                            disabled={processing}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReject}
                            disabled={processing}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
                        >
                            {processing ? "Rejecting..." : "Reject Application"}
                        </button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
