import PublicLayout from "@/Layouts/PublicLayout";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";
import { useState, useEffect } from "react";
import { jobApplicationsService } from "@/services/jobApplications";
import { profileService } from "@/services/profile";
import { messagesService } from "@/services/messages";
import UploadDocumentModal from "./Dashboard/UploadDocumentModal";

export default function Dashboard() {
    const { user } = useAuth();
    const [applications, setApplications] = useState({ data: [], links: [], meta: {} });
    const [loadingApplications, setLoadingApplications] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [loadingDocuments, setLoadingDocuments] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [loadingConversations, setLoadingConversations] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Fetch applications based on user role
    useEffect(() => {
        if (user) {
            setLoadingApplications(true);
            if (user.role === "helper" || user.role === "business") {
                // Helpers/businesses see applications they submitted
                jobApplicationsService.getMyApplications()
                    .then((data) => {
                        setApplications(data.applications || { data: [], links: [], meta: {} });
                        setLoadingApplications(false);
                    })
                    .catch((error) => {
                        console.error("Error fetching applications:", error);
                        setLoadingApplications(false);
                    });
            } else if (user.role === "user") {
                // Regular users see applications received for their service requests
                jobApplicationsService.getMyRequestApplications()
                    .then((data) => {
                        setApplications(data.applications || { data: [], links: [], meta: {} });
                        setLoadingApplications(false);
                    })
                    .catch((error) => {
                        console.error("Error fetching request applications:", error);
                        setLoadingApplications(false);
                    });
            } else {
                setLoadingApplications(false);
            }
        }
    }, [user]);

    // Fetch documents for helpers/businesses
    useEffect(() => {
        if (user && (user.role === "helper" || user.role === "business")) {
            setLoadingDocuments(true);
            profileService.getDocuments()
                .then((data) => {
                    setDocuments(data.documents || []);
                    setLoadingDocuments(false);
                })
                .catch((error) => {
                    console.error("Error fetching documents:", error);
                    setLoadingDocuments(false);
                });
        }
    }, [user]);

    // Fetch conversations for chat section
    useEffect(() => {
        if (user) {
            setLoadingConversations(true);
            messagesService.getConversations()
                .then((data) => {
                    setConversations(data.conversations || []);
                    setLoadingConversations(false);
                })
                .catch((error) => {
                    console.error("Error fetching conversations:", error);
                    setLoadingConversations(false);
                });
        }
    }, [user]);

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

    return (
        <PublicLayout>

            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Welcome Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">
                            Welcome back, {user?.name || "User"}!
                        </h1>
                        <p className="text-sm text-gray-600">Manage your services and track your activity</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {/* Service Requests (Users) */}
                        {user && user.role === "user" && (
                            <>
                                <Link
                                    to={route("bookings.create")}
                                    className="group relative bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
                                    <div className="relative z-10">
                                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                            <span className="text-2xl">📝</span>
                                        </div>
                                        <h3 className="text-lg font-bold mb-2 text-white">Post Service Request</h3>
                                        <p className="text-primary-100 text-sm leading-relaxed">Post a service request and get help from verified helpers</p>
                                        <div className="mt-4 flex items-center text-white text-sm font-semibold group-hover:translate-x-2 transition-transform duration-300">
                                            Get Started <span className="ml-1">→</span>
                                        </div>
                                    </div>
                                </Link>
                                <Link
                                    to={route("job-applications.my-request-applications")}
                                    className="group relative bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
                                >
                                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors duration-300">
                                        <span className="text-2xl">📋</span>
                                    </div>
                                    <h3 className="text-lg font-bold mb-2 text-gray-900">My Request Applications</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">View and manage applications to your service requests</p>
                                    <div className="mt-4 flex items-center text-primary-600 text-sm font-semibold group-hover:translate-x-2 transition-transform duration-300">
                                        View All <span className="ml-1">→</span>
                                    </div>
                                </Link>
                                <Link
                                    to={route("bookings.index")}
                                    className="group relative bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
                                >
                                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors duration-300">
                                        <span className="text-2xl">📅</span>
                                    </div>
                                    <h3 className="text-lg font-bold mb-2 text-gray-900">My Bookings</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">View all your service requests and bookings</p>
                                    <div className="mt-4 flex items-center text-primary-600 text-sm font-semibold group-hover:translate-x-2 transition-transform duration-300">
                                        View All <span className="ml-1">→</span>
                                    </div>
                                </Link>
                            </>
                        )}

                        {/* Service Offerings (Helpers/Businesses) */}
                        {(user?.role === "helper" || user?.role === "business") && (
                            <>
                                <Link
                                    to={route("service-listings.create")}
                                    className="group relative bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
                                    <div className="relative z-10">
                                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                            <span className="text-2xl">➕</span>
                                        </div>
                                        <h3 className="text-lg font-bold mb-2 text-white">Create Service Listing</h3>
                                        <p className="text-primary-100 text-sm leading-relaxed">Post a service you offer and get clients</p>
                                        <div className="mt-4 flex items-center text-white text-sm font-semibold group-hover:translate-x-2 transition-transform duration-300">
                                            Create Now <span className="ml-1">→</span>
                                        </div>
                                    </div>
                                </Link>
                                <Link
                                    to={route("service-listings.my-listings")}
                                    className="group relative bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
                                >
                                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors duration-300">
                                        <span className="text-2xl">📋</span>
                                    </div>
                                    <h3 className="text-lg font-bold mb-2 text-gray-900">My Service Listings</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">Manage your service offerings</p>
                                    <div className="mt-4 flex items-center text-primary-600 text-sm font-semibold group-hover:translate-x-2 transition-transform duration-300">
                                        Manage <span className="ml-1">→</span>
                                    </div>
                                </Link>
                                {user?.role === "business" && (
                                    <Link
                                        to={route("job-applications.index")}
                                        className="group relative bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
                                    >
                                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors duration-300">
                                            <span className="text-2xl">🔍</span>
                                        </div>
                                        <h3 className="text-lg font-bold mb-2 text-gray-900">Browse Job Requests</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">Browse service requests from users and apply</p>
                                        <div className="mt-4 flex items-center text-primary-600 text-sm font-semibold group-hover:translate-x-2 transition-transform duration-300">
                                            Browse <span className="ml-1">→</span>
                                        </div>
                                    </Link>
                                )}
                                <Link
                                    to={route("job-applications.my-applications")}
                                    className="group relative bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
                                >
                                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors duration-300">
                                        <span className="text-2xl">📝</span>
                                    </div>
                                    <h3 className="text-lg font-bold mb-2 text-gray-900">My Applications</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">Track your job applications</p>
                                    <div className="mt-4 flex items-center text-primary-600 text-sm font-semibold group-hover:translate-x-2 transition-transform duration-300">
                                        Track <span className="ml-1">→</span>
                                    </div>
                                </Link>
                            </>
                        )}

                        {/* Admin */}
                        {user?.role === "admin" && (
                            <>
                                <Link
                                    to={route("admin.dashboard")}
                                    className="group relative bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
                                    <div className="relative z-10">
                                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                            <span className="text-2xl">⚙️</span>
                                        </div>
                                        <h3 className="text-lg font-bold mb-2 text-white">Admin Dashboard</h3>
                                        <p className="text-primary-100 text-sm leading-relaxed">Manage the platform</p>
                                        <div className="mt-4 flex items-center text-white text-sm font-semibold group-hover:translate-x-2 transition-transform duration-300">
                                            Go to Admin <span className="ml-1">→</span>
                                        </div>
                                    </div>
                                </Link>
                            </>
                        )}

                    </div>

                    {/* Recent Conversations / Chat Section */}
                    {user && (
                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-1">Recent Conversations</h2>
                                    <p className="text-sm text-gray-600">Your recent chat messages</p>
                                </div>
                                <Link
                                    to={route("messages")}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition duration-300 font-semibold text-sm shadow-md hover:shadow-lg"
                                >
                                    View All
                                </Link>
                            </div>
                            
                            {loadingConversations ? (
                                <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
                                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mb-3"></div>
                                    <p className="text-gray-600 text-sm">Loading conversations...</p>
                                </div>
                            ) : conversations.length > 0 ? (
                                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                                    <div className="divide-y divide-gray-100">
                                        {conversations.slice(0, 5).map((conversation) => (
                                            <Link
                                                key={conversation.id}
                                                to={route("messages")}
                                                className="block p-4 hover:bg-primary-50 transition-all duration-300 border-l-4 border-transparent hover:border-primary-500"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-shrink-0">
                                                        {conversation.other_user.photo ? (
                                                            <img
                                                                src={`/storage/${conversation.other_user.photo}`}
                                                                alt={conversation.other_user.name}
                                                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                                {conversation.other_user.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <p className="text-base font-bold text-gray-900 truncate">
                                                                {conversation.other_user.name}
                                                            </p>
                                                            {conversation.unread_count > 0 && (
                                                                <span className="flex-shrink-0 bg-primary-600 text-white text-xs font-bold px-2.5 py-1 rounded-full min-w-[20px] text-center">
                                                                    {conversation.unread_count}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {conversation.last_message && (
                                                            <p className="text-sm text-gray-600 truncate">
                                                                {conversation.last_message.message}
                                                            </p>
                                                        )}
                                                        {conversation.last_message && (
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                {new Date(conversation.last_message.created_at).toLocaleDateString() === new Date().toLocaleDateString()
                                                                    ? new Date(conversation.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                                    : new Date(conversation.last_message.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                    {conversations.length > 5 && (
                                        <div className="bg-gradient-to-r from-primary-50 to-primary-100 px-4 py-3 text-center border-t border-primary-200">
                                            <Link
                                                to={route("messages")}
                                                className="inline-flex items-center text-primary-700 hover:text-primary-900 font-bold text-sm transition-colors duration-300"
                                            >
                                                View all {conversations.length} conversations
                                                <span className="ml-1">→</span>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
                                    <div className="text-4xl mb-4">💬</div>
                                    <p className="text-gray-700 font-medium mb-1 text-base">No conversations yet</p>
                                    <p className="text-gray-600 text-sm mb-4">Start a conversation by contacting someone</p>
                                    <Link
                                        to={route("messages")}
                                        className="inline-block bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition duration-300 font-bold text-sm shadow-md hover:shadow-lg"
                                    >
                                        Go to Messages
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Documents & Verification Status Section (Helpers/Businesses) */}
                    {(user?.role === "helper" || user?.role === "business") && (
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Verification Status</h2>
                            
                            <div className="grid md:grid-cols-2 gap-4 mb-6">
                                {/* Onboarding Status */}
                                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-gray-900">Onboarding Status</h3>
                                        {user.onboarding_complete ? (
                                            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-xl flex items-center justify-center shadow-md">
                                                <span className="text-xl text-white">✓</span>
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-md">
                                                <span className="text-xl text-white">⏳</span>
                                            </div>
                                        )}
                                    </div>
                                    {user.onboarding_complete ? (
                                        <div>
                                            <p className="text-lg font-bold text-green-600 mb-1">Completed</p>
                                            <p className="text-sm text-gray-600">Your profile is complete and ready</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-lg font-bold text-yellow-600 mb-1">In Progress</p>
                                            <p className="text-sm text-gray-600">Complete your onboarding to get started</p>
                                        </div>
                                    )}
                                </div>

                                {/* Verification Status */}
                                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-gray-900">Verification Status</h3>
                                        {user.verification_status === "verified" ? (
                                            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-xl flex items-center justify-center shadow-md">
                                                <span className="text-xl text-white">✓</span>
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-md">
                                                <span className="text-xl text-white">⏳</span>
                                            </div>
                                        )}
                                    </div>
                                    {user.verification_status === "verified" ? (
                                        <div>
                                            <p className="text-lg font-bold text-green-600 mb-1">Verified</p>
                                            <p className="text-sm text-gray-600">Your documents are verified</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-lg font-bold text-yellow-600 mb-1">Pending</p>
                                            <p className="text-sm text-gray-600">Awaiting document verification</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Documents Section */}
                            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-gray-900">Uploaded Documents</h3>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setShowUploadModal(true)}
                                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition duration-300 font-semibold text-sm shadow-md hover:shadow-lg flex items-center gap-2"
                                        >
                                            <span>+</span>
                                            <span>Upload Document</span>
                                        </button>
                                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                            <span className="text-lg">📄</span>
                                        </div>
                                    </div>
                                </div>
                                {loadingDocuments ? (
                                    <div className="text-center py-8">
                                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                                        <p className="text-gray-600 mt-3 text-sm">Loading documents...</p>
                                    </div>
                                ) : documents.length > 0 ? (
                                    <div className="space-y-3">
                                        {documents.map((document) => (
                                            <div key={document.id} className="border-2 border-gray-100 rounded-lg p-4 hover:border-primary-200 hover:shadow-md transition-all duration-300">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                                                                <span className="text-lg">📋</span>
                                                            </div>
                                                            <div className="flex-1">
                                                                <h4 className="text-base font-bold text-gray-900 mb-1">
                                                                    {document.document_type_label || document.document_type}
                                                                </h4>
                                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                                                    document.status === "verified" 
                                                                        ? "bg-green-100 text-green-700"
                                                                        : document.status === "rejected"
                                                                        ? "bg-red-100 text-red-700"
                                                                        : "bg-yellow-100 text-yellow-700"
                                                                }`}>
                                                                    {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {document.document_number && (
                                                            <p className="text-xs text-gray-600 mb-1 ml-13">
                                                                <span className="font-semibold">Number:</span> {document.document_number}
                                                            </p>
                                                        )}
                                                        {document.admin_notes && (
                                                            <div className="ml-13 mt-2 p-2 bg-gray-50 rounded-lg border-l-4 border-primary-500">
                                                                <p className="text-xs text-gray-700">
                                                                    <span className="font-semibold">Admin Note:</span> {document.admin_notes}
                                                                </p>
                                                            </div>
                                                        )}
                                                        <p className="text-xs text-gray-500 mt-2 ml-13">
                                                            Uploaded: {new Date(document.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    {document.file_path && (
                                                        <a
                                                            href={`/storage/${document.file_path}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="ml-3 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-300 font-semibold text-xs shadow-md hover:shadow-lg"
                                                        >
                                                            View
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                        <div className="text-4xl mb-3">📄</div>
                                        <p className="text-gray-600 font-medium mb-1 text-sm">No documents uploaded yet.</p>
                                        <p className="text-xs text-gray-500 mb-4">Upload verification documents to get verified.</p>
                                        <button
                                            onClick={() => setShowUploadModal(true)}
                                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition duration-300 font-semibold text-sm shadow-md hover:shadow-lg"
                                        >
                                            Upload Your First Document
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Applications Section */}
                    {user && (user.role === "helper" || user.role === "business" || user.role === "user") && (
                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                                        {user.role === "user" ? "Applications for My Requests" : "My Applications"}
                                    </h2>
                                    <p className="text-sm text-gray-600">Track and manage your job applications</p>
                                </div>
                                <Link
                                    to={user.role === "user" 
                                        ? route("job-applications.my-request-applications")
                                        : route("job-applications.my-applications")
                                    }
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition duration-300 font-semibold text-sm shadow-md hover:shadow-lg"
                                >
                                    View All
                                </Link>
                            </div>
                            
                            {loadingApplications ? (
                                <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
                                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mb-3"></div>
                                    <p className="text-gray-600 text-sm">Loading applications...</p>
                                </div>
                            ) : applications.data && applications.data.length > 0 ? (
                                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                                    <div className="divide-y divide-gray-100">
                                        {applications.data.slice(0, 5).map((application) => (
                                            <Link
                                                key={application.id}
                                                to={route("job-applications.show", application.id)}
                                                className="block p-4 hover:bg-primary-50 transition-all duration-300 border-l-4 border-transparent hover:border-primary-500"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="text-base font-bold text-gray-900">
                                                                {application.booking?.service_type_label || application.booking?.service_type || "Service Request"}
                                                            </h3>
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(application.status)}`}>
                                                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                                            </span>
                                                        </div>
                                                        {application.booking && (
                                                            <div className="text-xs text-gray-600 space-y-1 mb-2">
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-primary-600">📍</span>
                                                                    <span><span className="font-semibold">Location:</span> {application.booking.city}{application.booking.area ? `, ${application.booking.area}` : ""}</span>
                                                                </div>
                                                                {user.role === "user" ? (
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-primary-600">👤</span>
                                                                        <span><span className="font-semibold">Applied by:</span> {application.user?.name || "N/A"}</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-primary-600">👤</span>
                                                                        <span><span className="font-semibold">Requested by:</span> {application.booking.user?.name || "N/A"}</span>
                                                                    </div>
                                                                )}
                                                                {application.proposed_rate && (
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-primary-600">💰</span>
                                                                        <span><span className="font-semibold">Proposed Rate:</span> PKR {application.proposed_rate.toLocaleString()}/month</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {application.message && (
                                                            <p className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded-lg line-clamp-2">
                                                                {application.message}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="ml-4 text-right">
                                                        {application.applied_at && (
                                                            <p className="text-xs font-semibold text-gray-900 mb-1">
                                                                {new Date(application.applied_at).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                        <span className="text-primary-600 font-semibold text-xs">View →</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                    {applications.meta?.total > 5 && (
                                        <div className="bg-gradient-to-r from-primary-50 to-primary-100 px-4 py-3 text-center border-t border-primary-200">
                                            <Link
                                                to={user.role === "user" 
                                                    ? route("job-applications.my-request-applications")
                                                    : route("job-applications.my-applications")
                                                }
                                                className="inline-flex items-center text-primary-700 hover:text-primary-900 font-bold text-sm transition-colors duration-300"
                                            >
                                                View all {applications.meta.total} applications
                                                <span className="ml-1">→</span>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
                                    <div className="text-4xl mb-4">📋</div>
                                    {user.role === "user" ? (
                                        <>
                                            <p className="text-gray-700 font-medium mb-1 text-base">No applications yet</p>
                                            <p className="text-gray-600 mb-4 text-sm">You haven't received any applications for your service requests.</p>
                                            <Link
                                                to={route("bookings.create")}
                                                className="inline-block bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition duration-300 font-bold text-sm shadow-md hover:shadow-lg"
                                            >
                                                Post a Service Request
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-gray-700 font-medium mb-1 text-base">No applications yet</p>
                                            <p className="text-gray-600 mb-4 text-sm">You haven't applied to any service requests yet.</p>
                                            <Link
                                                to={route("job-applications.index")}
                                                className="inline-block bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition duration-300 font-bold text-sm shadow-md hover:shadow-lg"
                                            >
                                                Browse Service Requests
                                            </Link>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <UploadDocumentModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onSuccess={() => {
                    // Refresh documents after successful upload
                    if (user && (user.role === "helper" || user.role === "business")) {
                        setLoadingDocuments(true);
                        profileService.getDocuments()
                            .then((data) => {
                                setDocuments(data.documents || []);
                                setLoadingDocuments(false);
                            })
                            .catch((error) => {
                                console.error("Error fetching documents:", error);
                                setLoadingDocuments(false);
                            });
                    }
                }}
            />
        </PublicLayout>
    );
}
