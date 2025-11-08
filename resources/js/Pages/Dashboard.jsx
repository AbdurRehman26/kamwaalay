import PublicLayout from "@/Layouts/PublicLayout";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";

export default function Dashboard() {
    const { user } = useAuth();

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
                                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300 border-2 border-transparent hover:border-blue-500"
                                >
                                    <div className="text-4xl mb-4">📝</div>
                                    <h3 className="text-xl font-bold mb-2 text-gray-900">Post Service Request</h3>
                                    <p className="text-gray-600">Post a service request and get help from verified helpers</p>
                                </Link>
                                <Link
                                    to={route("job-applications.my-request-applications")}
                                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300 border-2 border-transparent hover:border-blue-500"
                                >
                                    <div className="text-4xl mb-4">📋</div>
                                    <h3 className="text-xl font-bold mb-2 text-gray-900">My Request Applications</h3>
                                    <p className="text-gray-600">View and manage applications to your service requests</p>
                                </Link>
                                <Link
                                    to={route("bookings.index")}
                                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300 border-2 border-transparent hover:border-blue-500"
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
                                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300 border-2 border-transparent hover:border-blue-500"
                                >
                                    <div className="text-4xl mb-4">➕</div>
                                    <h3 className="text-xl font-bold mb-2 text-gray-900">Create Service Listing</h3>
                                    <p className="text-gray-600">Post a service you offer and get clients</p>
                                </Link>
                                <Link
                                    to={route("service-listings.my-listings")}
                                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300 border-2 border-transparent hover:border-blue-500"
                                >
                                    <div className="text-4xl mb-4">📋</div>
                                    <h3 className="text-xl font-bold mb-2 text-gray-900">My Service Listings</h3>
                                    <p className="text-gray-600">Manage your service offerings</p>
                                </Link>
                                {user?.role === "business" && (
                                    <Link
                                        to={route("job-applications.index")}
                                        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300 border-2 border-transparent hover:border-blue-500"
                                    >
                                        <div className="text-4xl mb-4">🔍</div>
                                        <h3 className="text-xl font-bold mb-2 text-gray-900">Browse Job Requests</h3>
                                        <p className="text-gray-600">Browse service requests from users and apply</p>
                                    </Link>
                                )}
                                <Link
                                    to={route("job-applications.my-applications")}
                                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300 border-2 border-transparent hover:border-blue-500"
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
                                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-300 border-2 border-transparent hover:border-blue-500"
                                >
                                    <div className="text-4xl mb-4">⚙️</div>
                                    <h3 className="text-xl font-bold mb-2 text-gray-900">Admin Dashboard</h3>
                                    <p className="text-gray-600">Manage the platform</p>
                                </Link>
                            </>
                        )}

                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
