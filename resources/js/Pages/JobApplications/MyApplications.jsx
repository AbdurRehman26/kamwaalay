// Head removed
import DashboardLayout from "@/Layouts/DashboardLayout";
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

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-10 relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">My Applications</h1>
                            <p className="text-indigo-100 text-lg max-w-2xl">
                                Track the status of your job applications.
                            </p>
                        </div>
                        <Link
                            to={route("job-applications.index")}
                            className="inline-flex items-center justify-center px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-all duration-300 shadow-lg group whitespace-nowrap"
                        >
                            <span className="mr-2 text-xl group-hover:rotate-12 transition-transform">🔍</span>
                            Browse Jobs
                        </Link>
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
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                {(application.job_post || application.booking)?.service_type_label ||
                                                    (application.job_post || application.booking)?.service_type?.replace("_", " ") ||
                                                    "Service Request"}
                                            </h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(application.status)}`}>
                                                {application.status}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400 mb-2 capitalize text-sm">
                                            {(application.job_post || application.booking)?.work_type?.replace("_", " ") || "N/A"} • {(application.job_post || application.booking)?.city_name || (application.job_post || application.booking)?.city?.name || (application.job_post || application.booking)?.city || "N/A"}, {(application.job_post || application.booking)?.area || "N/A"}
                                        </p>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                                            Requested by: <span className="font-semibold text-gray-700 dark:text-gray-300">{(application.job_post || application.booking)?.user?.name}</span>
                                        </p>
                                        {application.message && (
                                            <p className="text-gray-600 dark:text-gray-300 text-sm mt-3 line-clamp-2 italic bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">"{application.message}"</p>
                                        )}
                                        {application.proposed_rate && (
                                            <p className="text-green-600 dark:text-green-400 font-bold mt-2">Proposed Rate: PKR {application.proposed_rate}/hr</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <Link
                                            to={route("job-applications.show", application.id)}
                                            className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition duration-300 font-bold text-sm"
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
                                                className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition duration-300 font-bold text-sm"
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
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">Browse jobs and apply to find work.</p>
                        <Link
                            to={route("job-applications.index")}
                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-1"
                        >
                            <span className="mr-2 text-xl">🔍</span> Browse Jobs
                        </Link>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
