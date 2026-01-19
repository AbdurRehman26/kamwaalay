import { useParams, useNavigate } from "react-router-dom";
import PublicLayout from "@/Layouts/PublicLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { jobApplicationsService } from "@/services/jobApplications";
import { route } from "@/utils/routes";
import toast from "react-hot-toast";

export default function JobApplicationCreate() {
    const { bookingId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [hasApplied, setHasApplied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        message: "",
        proposed_rate: "",
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [errorMessage, setErrorMessage] = useState(null);

    useEffect(() => {
        if (bookingId) {
            jobApplicationsService.getApplicationCreate(bookingId)
                .then((response) => {
                    setBooking(response.job_post || response.booking);
                    setHasApplied(response.has_applied || false);
                    setLoading(false);
                })
                .catch((error) => {
                    console.error("Error fetching booking:", error);
                    if (error.response) {
                        if (error.response.status === 404) {
                            setErrorMessage("Service request not found.");
                        } else if (error.response.status === 403) {
                            setErrorMessage("You are not authorized to apply for this service request. Only helpers and businesses can apply.");
                        } else if (error.response.status === 422) {
                            // Check if it's an onboarding issue or already applied
                            const message = error.response.data.message || "Please complete your onboarding first.";
                            if (message.includes("already applied")) {
                                // If it's the old API response, try to fetch job details differently
                                // But for now, just show the error
                                setErrorMessage(message);
                            } else {
                                setErrorMessage(message);
                                if (error.response.data.redirect) {
                                    // Optional: Auto redirect or show button
                                }
                            }
                        } else {
                            setErrorMessage("Failed to load job details.");
                        }
                    } else {
                        setErrorMessage("Network error. Please try again.");
                    }
                    setLoading(false);
                });
        }
    }, [bookingId]);

    const submit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            const response = await jobApplicationsService.createApplication(bookingId, data);
            toast.success("Application submitted successfully!");
            // Redirect to my applications dashboard
            navigate(route("job-applications.my-applications"));
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                toast.error(error.response?.data?.message || "Failed to submit application");
                setErrors({ submit: [error.response?.data?.message || "Failed to create application"] });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <PublicLayout>
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 text-white overflow-hidden py-16 md:py-24">
                {/* Abstract Background Shapes */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Apply for Job</h1>
                    <p className="text-xl text-indigo-100/90 max-w-2xl mx-auto leading-relaxed">
                        Submit your application and showcase why you're the perfect fit for this opportunity.
                    </p>
                </div>
            </div>

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : errorMessage ? (
                        <div className="max-w-2xl mx-auto">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center border border-gray-100 dark:border-gray-700">
                                <div className="text-6xl mb-6">⚠️</div>
                                <div className="text-red-600 dark:text-red-400 text-xl mb-6 font-semibold">{errorMessage}</div>
                                <button
                                    onClick={() => navigate(route("job-applications.index"))}
                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-indigo-500/30 font-bold"
                                >
                                    Back to Jobs
                                </button>
                            </div>
                        </div>
                    ) : !booking ? (
                        <div className="max-w-2xl mx-auto">
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center border border-gray-100 dark:border-gray-700">
                                <div className="text-6xl mb-6">❌</div>
                                <p className="text-red-600 dark:text-red-400 text-xl mb-6 font-semibold">Job not found</p>
                                <button
                                    onClick={() => navigate(route("job-applications.index"))}
                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-indigo-500/30 font-bold"
                                >
                                    Back to Jobs
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto">
                            {/* Job Details Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 border border-gray-100 dark:border-gray-700 relative z-20 -mt-16">
                                {hasApplied && (
                                    <div className="mb-6 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-400 px-6 py-4 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <svg className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <div>
                                                <p className="text-sm font-semibold text-green-800 dark:text-green-300">You have already applied to this job</p>
                                                <p className="text-xs text-green-700 dark:text-green-400 mt-1">You can view the job details below, but you cannot submit another application.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="text-2xl">📋</span>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Job Details</h2>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-5 border border-indigo-100 dark:border-indigo-800">
                                        <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-2">Service Type</h3>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">{booking.service_type?.replace("_", " ") || "N/A"}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-5 border border-indigo-100 dark:border-indigo-800">
                                        <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-2">Work Type</h3>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">{booking.work_type?.replace("_", " ") || "N/A"}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-5 border border-indigo-100 dark:border-indigo-800">
                                        <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-2">📍 Location</h3>
                                        {user && (user.role === "helper" || user.role === "business") ? (
                                            <div>
                                                <p className="text-lg font-semibold text-gray-900 dark:text-white">{booking.city_name || booking.city?.name || booking.city}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">Location will be visible once your application is accepted</p>
                                            </div>
                                        ) : (
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{booking.city_name || booking.city?.name || booking.city}, {booking.area}</p>
                                        )}
                                    </div>
                                    {booking.special_requirements && (
                                        <div className="md:col-span-2 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-5 border border-indigo-100 dark:border-indigo-800">
                                            <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-2">💬 Special Requirements</h3>
                                            <p className="text-base text-gray-900 dark:text-white leading-relaxed">{booking.special_requirements}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Application Form */}
                            {!hasApplied ? (
                                <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-3 mb-8">
                                        <span className="text-2xl">✍️</span>
                                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Your Application</h2>
                                    </div>

                                    <div className="mb-8">
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                                            Application Message <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={data.message}
                                            onChange={(e) => setData(prev => ({ ...prev, message: e.target.value }))}
                                            rows={8}
                                            className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 py-4 px-5 shadow-sm transition-all duration-300 text-gray-900 dark:text-gray-100"
                                            placeholder="Tell the client why you're perfect for this job. Mention your experience, skills, and availability..."
                                        />
                                        {errors.message && (
                                            <div className="mt-2 text-red-500 dark:text-red-400 text-sm font-medium flex items-center gap-1">
                                                <span>⚠️</span> {errors.message}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-8">
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                                            Proposed Monthly Rate (PKR) <span className="text-gray-500 dark:text-gray-400 font-normal">(Optional)</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={data.proposed_rate}
                                            onChange={(e) => setData(prev => ({ ...prev, proposed_rate: e.target.value }))}
                                            className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 py-4 px-5 shadow-sm transition-all duration-300 text-gray-900 dark:text-gray-100"
                                            placeholder="e.g., 50000"
                                        />
                                        {errors.proposed_rate && (
                                            <div className="mt-2 text-red-500 dark:text-red-400 text-sm font-medium flex items-center gap-1">
                                                <span>⚠️</span> {errors.proposed_rate}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-indigo-500/30 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {processing ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                    Submitting...
                                                </span>
                                            ) : (
                                                "Submit Application"
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => navigate(route("job-applications.index"))}
                                            className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 font-bold text-lg border-2 border-gray-300 dark:border-gray-600"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                    {errors.submit && (
                                        <div className="mt-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 rounded-xl">
                                            <p className="text-sm text-red-800 dark:text-red-300 font-medium flex items-center gap-2">
                                                <span>⚠️</span> {errors.submit[0]}
                                            </p>
                                        </div>
                                    )}
                                </form>
                            ) : (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                                    <div className="text-center py-12">
                                        <div className="text-6xl mb-6">✅</div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Application Already Submitted</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-8">
                                            You have already applied for this job. You can view your application status from your applications page.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => navigate(route("job-applications.my-applications"))}
                                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-indigo-500/30 font-bold"
                                        >
                                            View My Applications
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}

