// Head removed
import DashboardLayout from "@/Layouts/DashboardLayout";
import { useState, useEffect } from "react";
import { jobApplicationsService } from "@/services/jobApplications";

export default function MyRequestApplications() {
    const [applications, setApplications] = useState({ data: [], links: [], meta: {} });
    const [loading, setLoading] = useState(true);

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

    const handleAccept = async (applicationId) => {
        if (confirm("Are you sure you want to accept this application? This will reject all other applications.")) {
            try {
                await jobApplicationsService.acceptApplication(applicationId);
                // Refresh applications
                const data = await jobApplicationsService.getMyRequestApplications();
                setApplications(data.applications || { data: [], links: [], meta: {} });
            } catch (error) {
                console.error("Error accepting application:", error);
                alert("Failed to accept application. Please try again.");
            }
        }
    };

    const handleReject = async (applicationId) => {
        if (confirm("Are you sure you want to reject this application?")) {
            try {
                await jobApplicationsService.rejectApplication(applicationId);
                // Refresh applications
                const data = await jobApplicationsService.getMyRequestApplications();
                setApplications(data.applications || { data: [], links: [], meta: {} });
            } catch (error) {
                console.error("Error rejecting application:", error);
                alert("Failed to reject application. Please try again.");
            }
        }
    };

    return (
        <DashboardLayout>
            
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">Applications to My Requests</h1>
                    <p className="text-xl text-white/90">Review and manage applications for your service requests</p>
                </div>
            </div>
            <div className="container mx-auto px-4 py-12">
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600">Loading applications...</p>
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
                                        <p className="text-gray-600 mb-2">
                                            Application from: <span className="font-semibold text-lg">{application.user?.name}</span>
                                        </p>
                                        {application.user?.phone && (
                                            <p className="text-gray-500 text-sm mb-2">📞 {application.user.phone}</p>
                                        )}
                                        {application.user?.email && (
                                            <p className="text-gray-500 text-sm mb-2">✉️ {application.user.email}</p>
                                        )}
                                        {application.message && (
                                            <div className="bg-gray-50 rounded-lg p-4 mt-3 mb-3">
                                                <p className="text-gray-700 text-sm whitespace-pre-wrap">{application.message}</p>
                                            </div>
                                        )}
                                        {application.proposed_rate && (
                                            <p className="text-green-600 font-bold text-lg">Proposed Rate: PKR {application.proposed_rate}/hr</p>
                                        )}
                                    </div>
                                    {application.status === "pending" && (
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => handleAccept(application.id)}
                                                className="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition duration-300 font-medium text-sm font-semibold"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleReject(application.id)}
                                                className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition duration-300 font-medium text-sm font-semibold"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                    {application.status === "accepted" && (
                                        <div className="ml-4">
                                            <Link
                                                to={route("bookings.show", application.booking.id)}
                                                className="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition duration-300 font-medium text-sm font-semibold"
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
                        <p className="text-gray-500 mb-8">Applications to your service requests will appear here</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

