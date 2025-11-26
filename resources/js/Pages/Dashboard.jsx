import PublicLayout from "@/Layouts/PublicLayout";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";
import { useState, useEffect } from "react";
import { jobApplicationsService } from "@/services/jobApplications";
import { profileService } from "@/services/profile";

export default function Dashboard() {
    const { user } = useAuth();
    const [applications, setApplications] = useState({ data: [], links: [], meta: {} });
    const [loadingApplications, setLoadingApplications] = useState(false);
    const [documents, setDocuments] = useState([]);
    const [loadingDocuments, setLoadingDocuments] = useState(false);

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

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Service Requests (Users) */}
                        {user && user.role === "user" && (
                            <>
                                <Link
                                    to={route("bookings.create")}
                                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300 border-2 border-transparent hover:border-primary-500"
                                >
                                    <div className="text-4xl mb-4">📝</div>
                                    <h3 className="text-xl font-bold mb-2 text-gray-900">Post Service Request</h3>
                                    <p className="text-gray-600">Post a service request and get help from verified helpers</p>
                                </Link>
                                <Link
                                    to={route("job-applications.my-request-applications")}
                                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300 border-2 border-transparent hover:border-primary-500"
                                >
                                    <div className="text-4xl mb-4">📋</div>
                                    <h3 className="text-xl font-bold mb-2 text-gray-900">My Request Applications</h3>
                                    <p className="text-gray-600">View and manage applications to your service requests</p>
                                </Link>
                                <Link
                                    to={route("bookings.index")}
                                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300 border-2 border-transparent hover:border-primary-500"
                                >
                                    <div className="text-4xl mb-4">📅</div>
                                    <h3 className="text-xl font-bold mb-2 text-gray-900">My Bookings</h3>
                                    <p className="text-gray-600">View all your service requests and bookings</p>
                                </Link>
                            </>
                        )}

                        {/* Service Offerings (Helpers/Businesses) */}
                        {(user?.role === "helper" || user?.role === "business") && (
                            <>
                                <Link
                                    to={route("service-listings.create")}
                                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300 border-2 border-transparent hover:border-primary-500"
                                >
                                    <div className="text-4xl mb-4">➕</div>
                                    <h3 className="text-xl font-bold mb-2 text-gray-900">Create Service Listing</h3>
                                    <p className="text-gray-600">Post a service you offer and get clients</p>
                                </Link>
                                <Link
                                    to={route("service-listings.my-listings")}
                                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300 border-2 border-transparent hover:border-primary-500"
                                >
                                    <div className="text-4xl mb-4">📋</div>
                                    <h3 className="text-xl font-bold mb-2 text-gray-900">My Service Listings</h3>
                                    <p className="text-gray-600">Manage your service offerings</p>
                                </Link>
                                {user?.role === "business" && (
                                    <Link
                                        to={route("job-applications.index")}
                                        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300 border-2 border-transparent hover:border-primary-500"
                                    >
                                        <div className="text-4xl mb-4">🔍</div>
                                        <h3 className="text-xl font-bold mb-2 text-gray-900">Browse Job Requests</h3>
                                        <p className="text-gray-600">Browse service requests from users and apply</p>
                                    </Link>
                                )}
                                <Link
                                    to={route("job-applications.my-applications")}
                                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300 border-2 border-transparent hover:border-primary-500"
                                >
                                    <div className="text-4xl mb-4">📝</div>
                                    <h3 className="text-xl font-bold mb-2 text-gray-900">My Applications</h3>
                                    <p className="text-gray-600">Track your job applications</p>
                                </Link>
                            </>
                        )}

                        {/* Admin */}
                        {user?.role === "admin" && (
                            <>
                                <Link
                                    to={route("admin.dashboard")}
                                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300 border-2 border-transparent hover:border-primary-500"
                                >
                                    <div className="text-4xl mb-4">⚙️</div>
                                    <h3 className="text-xl font-bold mb-2 text-gray-900">Admin Dashboard</h3>
                                    <p className="text-gray-600">Manage the platform</p>
                                </Link>
                            </>
                        )}

                    </div>

                    {/* Documents & Verification Status Section (Helpers/Businesses) */}
                    {(user?.role === "helper" || user?.role === "business") && (
                        <div className="mt-12">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Verification Status</h2>
                            
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                {/* Onboarding Status */}
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Onboarding Status</h3>
                                    <div className="flex items-center gap-3">
                                        {user.onboarding_complete ? (
                                            <>
                                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                                    <span className="text-2xl">✓</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-green-700">Completed</p>
                                                    <p className="text-sm text-gray-600">Your profile is complete</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                                    <span className="text-2xl">⏳</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-yellow-700">In Progress</p>
                                                    <p className="text-sm text-gray-600">Complete your onboarding</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Verification Status */}
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
                                    <div className="flex items-center gap-3">
                                        {user.verification_status === "verified" ? (
                                            <>
                                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                                    <span className="text-2xl">✓</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-green-700">Verified</p>
                                                    <p className="text-sm text-gray-600">Your documents are verified</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                                                    <span className="text-2xl">⏳</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-yellow-700">Pending</p>
                                                    <p className="text-sm text-gray-600">Awaiting verification</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Documents Section */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
                                {loadingDocuments ? (
                                    <p className="text-gray-600">Loading documents...</p>
                                ) : documents.length > 0 ? (
                                    <div className="space-y-4">
                                        {documents.map((document) => (
                                            <div key={document.id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h4 className="font-semibold text-gray-900">
                                                                {document.document_type_label || document.document_type}
                                                            </h4>
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                                document.status === "verified" 
                                                                    ? "bg-green-100 text-green-800"
                                                                    : document.status === "rejected"
                                                                    ? "bg-red-100 text-red-800"
                                                                    : "bg-yellow-100 text-yellow-800"
                                                            }`}>
                                                                {document.status}
                                                            </span>
                                                        </div>
                                                        {document.document_number && (
                                                            <p className="text-sm text-gray-600 mb-1">
                                                                Number: {document.document_number}
                                                            </p>
                                                        )}
                                                        {document.admin_notes && (
                                                            <p className="text-sm text-gray-600 italic">
                                                                Note: {document.admin_notes}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            Uploaded: {new Date(document.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    {document.file_path && (
                                                        <a
                                                            href={`/storage/${document.file_path}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                                                        >
                                                            View →
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>No documents uploaded yet.</p>
                                        <p className="text-sm mt-2">Documents will appear here after you complete onboarding.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Applications Section */}
                    {user && (user.role === "helper" || user.role === "business" || user.role === "user") && (
                        <div className="mt-12">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {user.role === "user" ? "Applications for My Requests" : "My Applications"}
                                </h2>
                                <Link
                                    to={user.role === "user" 
                                        ? route("job-applications.my-request-applications")
                                        : route("job-applications.my-applications")
                                    }
                                    className="text-primary-600 hover:text-primary-800 font-semibold"
                                >
                                    View All →
                                </Link>
                            </div>
                            
                            {loadingApplications ? (
                                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                    <p className="text-gray-600">Loading applications...</p>
                                </div>
                            ) : applications.data && applications.data.length > 0 ? (
                                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="divide-y divide-gray-200">
                                        {applications.data.slice(0, 5).map((application) => (
                                            <Link
                                                key={application.id}
                                                to={route("job-applications.show", application.id)}
                                                className="block p-6 hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <h3 className="text-lg font-semibold text-gray-900">
                                                                {application.booking?.service_type_label || application.booking?.service_type || "Service Request"}
                                                            </h3>
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(application.status)}`}>
                                                                {application.status}
                                                            </span>
                                                        </div>
                                                        {application.booking && (
                                                            <div className="text-sm text-gray-600 space-y-1">
                                                                <p>
                                                                    <span className="font-semibold">Location:</span> {application.booking.city}{application.booking.area ? `, ${application.booking.area}` : ""}
                                                                </p>
                                                                {user.role === "user" ? (
                                                                    <p>
                                                                        <span className="font-semibold">Applied by:</span> {application.user?.name || "N/A"}
                                                                    </p>
                                                                ) : (
                                                                    <p>
                                                                        <span className="font-semibold">Requested by:</span> {application.booking.user?.name || "N/A"}
                                                                    </p>
                                                                )}
                                                                {application.proposed_rate && (
                                                                    <p>
                                                                        <span className="font-semibold">Proposed Rate:</span> PKR {application.proposed_rate}/month
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                        {application.message && (
                                                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                                                {application.message}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="ml-4 text-sm text-gray-500">
                                                        {application.applied_at && (
                                                            <p>{new Date(application.applied_at).toLocaleDateString()}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                    {applications.meta?.total > 5 && (
                                        <div className="bg-gray-50 px-6 py-4 text-center">
                                            <Link
                                                to={user.role === "user" 
                                                    ? route("job-applications.my-request-applications")
                                                    : route("job-applications.my-applications")
                                                }
                                                className="text-primary-600 hover:text-primary-800 font-semibold"
                                            >
                                                View all {applications.meta.total} applications →
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                                    {user.role === "user" ? (
                                        <>
                                            <p className="text-gray-600 mb-4">You haven't received any applications for your service requests yet.</p>
                                            <Link
                                                to={route("bookings.create")}
                                                className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition duration-300 font-semibold"
                                            >
                                                Post a Service Request
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-gray-600 mb-4">You haven't applied to any service requests yet.</p>
                                            <Link
                                                to={route("job-applications.index")}
                                                className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition duration-300 font-semibold"
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
        </PublicLayout>
    );
}
