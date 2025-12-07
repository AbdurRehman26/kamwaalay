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
            
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-800 dark:to-primary-900 text-white py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">Applications to My Job Postings</h1>
                    <p className="text-xl text-white/90">Review and manage applications for your job postings</p>
                </div>
            </div>
            <div className="container mx-auto px-4 py-12">
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400">Loading applications...</p>
                    </div>
                ) : applications.data && applications.data.length > 0 ? (
                    <div className="space-y-6">
                        {applications.data.map((application) => (
                            <div key={application.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                {(application.job_post || application.booking)?.service_type_label || 
                                                 (application.job_post || application.booking)?.service_type?.replace("_", " ") || 
                                                 "Service Request"}
                                            </h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(application.status)}`}>
                                                {application.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mb-3">
                                            {application.user?.photo ? (
                                                <img
                                                    src={`/storage/${application.user.photo}`}
                                                    alt={application.user?.name}
                                                    className="w-16 h-16 rounded-full object-cover border-2 border-primary-200 dark:border-primary-600"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center text-white font-bold text-xl border-2 border-primary-200 dark:border-primary-600">
                                                    {application.user?.name?.charAt(0)?.toUpperCase() || "U"}
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <Link
                                                    to={application.user?.role === "helper" 
                                                        ? route("helpers.show", application.user.id)
                                                        : application.user?.role === "business"
                                                        ? route("businesses.show", application.user.id)
                                                        : "#"
                                                    }
                                                    className="block"
                                                >
                                                    <p className="text-gray-900 dark:text-white font-semibold text-lg hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                                                        {application.user?.name}
                                                    </p>
                                                </Link>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm capitalize">
                                                    {application.user?.role || "User"}
                                                </p>
                                            </div>
                                        </div>
                                        {application.user?.phone && (
                                            <div className="mb-3">
                                                <p className="text-gray-700 dark:text-gray-300 text-sm mb-2 font-medium">📞 {application.user.phone}</p>
                                                <div className="flex gap-2">
                                                    <a
                                                        href={`tel:${formatPhoneForCall(application.user.phone)}`}
                                                        className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-4 py-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition duration-300 font-medium text-sm"
                                                    >
                                                        <span>📞</span>
                                                        <span>Call</span>
                                                    </a>
                                                    <a
                                                        href={`https://wa.me/${formatPhoneForWhatsApp(application.user.phone)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-4 py-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition duration-300 font-medium text-sm"
                                                    >
                                                        <span>💬</span>
                                                        <span>WhatsApp</span>
                                                    </a>
                                                    <button
                                                        onClick={() => handleOpenChat(application.user)}
                                                        className="flex items-center gap-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 px-4 py-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition duration-300 font-medium text-sm"
                                                    >
                                                        <span>💬</span>
                                                        <span>Message</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {application.message && (
                                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mt-3 mb-3">
                                                <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{application.message}</p>
                                            </div>
                                        )}
                                        {application.proposed_rate && (
                                            <p className="text-green-600 dark:text-green-400 font-bold text-lg">Proposed Rate: PKR {application.proposed_rate}/hr</p>
                                        )}
                                    </div>
                                    {application.status === "pending" && (
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => handleAcceptClick(application)}
                                                className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-2 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition duration-300 font-medium text-sm font-semibold"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleRejectClick(application)}
                                                className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition duration-300 font-medium text-sm font-semibold"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                    {application.status === "accepted" && (
                                        <div className="ml-4">
                                            <Link
                                                to={route("bookings.show", (application.job_post || application.booking)?.id)}
                                                className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-2 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition duration-300 font-medium text-sm font-semibold"
                                            >
                                                View Booking
                                            </Link>
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
                                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                                                link.active
                                                    ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg"
                                                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-md"
                                            } ${!link.url && "cursor-not-allowed opacity-50"}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
                        <div className="text-6xl mb-4">📋</div>
                        <p className="text-gray-600 dark:text-gray-300 text-xl mb-6">No applications yet</p>
                        <p className="text-gray-500 dark:text-gray-400 mb-8">Applications to your job postings will appear here</p>
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

