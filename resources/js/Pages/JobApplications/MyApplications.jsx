// Head removed
import PublicLayout from "@/Layouts/PublicLayout";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { route } from "@/utils/routes";
import { jobApplicationsService } from "@/services/jobApplications";

export default function MyApplications() {
    const [applications, setApplications] = useState({ data: [], links: [], meta: {} });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        jobApplicationsService.getMyApplications()
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
            
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">My Applications</h1>
                    <p className="text-xl text-white/90">Track your job applications</p>
                </div>
            </div>
            <div className="container mx-auto px-4 py-12">
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600">Loading your applications...</p>
                    </div>
                ) : applications.data && applications.data.length > 0 ? (
                    <div className="space-y-6">
                        {applications.data.map((application) => (
                            <div key={application.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-gray-900">
                                                {application.booking.service_type_label}
                                            </h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(application.status)}`}>
                                                {application.status}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 mb-2 capitalize">
                                            {application.booking?.work_type?.replace("_", " ") || "N/A"} • {application.booking?.city || "N/A"}, {application.booking?.area || "N/A"}
                                        </p>
                                        <p className="text-gray-500 text-sm mb-2">
                                            Requested by: <span className="font-semibold">{application.booking.user?.name}</span>
                                        </p>
                                        {application.message && (
                                            <p className="text-gray-600 text-sm mt-3 line-clamp-2">{application.message}</p>
                                        )}
                                        {application.proposed_rate && (
                                            <p className="text-green-600 font-bold mt-2">Proposed Rate: PKR {application.proposed_rate}/hr</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <Link
                                            to={route("job-applications.show", application.id)}
                                            className="bg-primary-100 text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-200 transition duration-300 font-medium text-sm"
                                        >
                                            View
                                        </Link>
                                        {application.status === "pending" && (
                                            <button
                                                onClick={async () => {
                                                    if (confirm("Are you sure you want to withdraw this application?")) {
                                                        try {
                                                            await jobApplicationsService.withdrawApplication(application.id);
                                                            // Refresh applications
                                                            const data = await jobApplicationsService.getMyApplications();
                                                            setApplications(data.applications || { data: [], links: [], meta: {} });
                                                        } catch (error) {
                                                            console.error("Error withdrawing application:", error);
                                                            alert("Failed to withdraw application. Please try again.");
                                                        }
                                                    }
                                                }}
                                                className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition duration-300 font-medium text-sm"
                                            >
                                                Withdraw
                                            </button>
                                        )}
                                    </div>
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
                        <div className="text-6xl mb-4">📋</div>
                        <p className="text-gray-600 text-xl mb-6">No applications yet</p>
                        <p className="text-gray-500 mb-8">Browse service requests and apply to find work</p>
                        <Link
                            to={route("job-applications.index")}
                            className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg font-semibold inline-block"
                        >
                            Browse Requests
                        </Link>
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}

