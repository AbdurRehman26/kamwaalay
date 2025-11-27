import { useParams, useNavigate } from "react-router-dom";
import PublicLayout from "@/Layouts/PublicLayout";
import { useState, useEffect } from "react";
import { jobApplicationsService } from "@/services/jobApplications";
import { route } from "@/utils/routes";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";

export default function JobApplicationCreate() {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
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
                    setBooking(response.booking);
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
                            setErrorMessage(error.response.data.message || "Please complete your onboarding first.");
                            if (error.response.data.redirect) {
                                // Optional: Auto redirect or show button
                            }
                        } else {
                            setErrorMessage("Failed to load service request details.");
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
            // Redirect to applications index or show success message
            navigate(route("job-applications.my-applications"));
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ submit: [error.response?.data?.message || "Failed to create application"] });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <PublicLayout>
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">Apply for Service Request</h1>
                            <p className="text-sm text-gray-600">Submit your application to this service request</p>
                        </div>
                        <button
                            onClick={() => navigate(route("service-requests.browse"))}
                            className="px-4 py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors text-sm"
                        >
                            ← Back
                        </button>
                    </div>

                    {loading ? (
                        <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
                            <p className="text-gray-600">Loading booking details...</p>
                        </div>
                    ) : errorMessage ? (
                        <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">⚠️</span>
                            </div>
                            <div className="text-red-600 text-lg font-semibold mb-4">{errorMessage}</div>
                            <SecondaryButton
                                onClick={() => navigate(route("service-requests.browse"))}
                            >
                                Back to Service Requests
                            </SecondaryButton>
                        </div>
                    ) : !booking ? (
                        <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">❌</span>
                            </div>
                            <p className="text-red-600 font-semibold mb-4">Booking not found</p>
                            <SecondaryButton
                                onClick={() => navigate(route("service-requests.browse"))}
                            >
                                Back to Service Requests
                            </SecondaryButton>
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Service Request Details */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Client Information */}
                                {booking.user && (
                                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-lg font-bold text-gray-900">Client Information</h2>
                                            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                                <span className="text-lg">👤</span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            {booking.user.photo ? (
                                                <img
                                                    src={booking.user.photo.startsWith('http') ? booking.user.photo : `/storage/${booking.user.photo}`}
                                                    alt={booking.user.name}
                                                    className="w-16 h-16 rounded-full object-cover border-2 border-primary-200"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center border-2 border-primary-200">
                                                    <span className="text-2xl">👤</span>
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div>
                                                    <p className="text-xs text-gray-600 mb-1">Name</p>
                                                    <p className="text-base font-bold text-gray-900">{booking.user.name}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-bold text-gray-900">Service Request Details</h2>
                                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                            <span className="text-lg">📋</span>
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-600 mb-1">Service Type</p>
                                            <p className="text-base font-semibold text-gray-900 capitalize">
                                                {booking.service_type?.replace("_", " ") || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600 mb-1">Work Type</p>
                                            <p className="text-base font-semibold text-gray-900 capitalize">
                                                {booking.work_type?.replace("_", " ") || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600 mb-1">Location</p>
                                            <p className="text-base text-gray-900 flex items-center gap-2">
                                                <span>📍</span>
                                                {booking.city}, {booking.area}
                                            </p>
                                        </div>
                                        {booking.start_date && (
                                            <div>
                                                <p className="text-xs text-gray-600 mb-1">Start Date</p>
                                                <p className="text-base text-gray-900">
                                                    {new Date(booking.start_date).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    {booking.special_requirements && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <p className="text-xs text-gray-600 mb-2">Special Requirements</p>
                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                                    {booking.special_requirements}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Application Form */}
                                <form onSubmit={submit} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-lg font-bold text-gray-900">Your Application</h2>
                                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                            <span className="text-lg">✍️</span>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Application Message <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={data.message}
                                            onChange={(e) => setData(prev => ({ ...prev, message: e.target.value }))}
                                            rows={6}
                                            className={`w-full border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                                                errors.message ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                            placeholder="Tell the client why you're perfect for this job. Mention your experience, skills, and availability..."
                                        />
                                        {errors.message && (
                                            <div className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                                <span>⚠️</span>
                                                <span>{Array.isArray(errors.message) ? errors.message[0] : errors.message}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Proposed Monthly Rate (PKR) <span className="text-gray-500 text-xs font-normal">(Optional)</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">PKR</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={data.proposed_rate}
                                                onChange={(e) => setData(prev => ({ ...prev, proposed_rate: e.target.value }))}
                                                className={`w-full pl-12 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                                                    errors.proposed_rate ? 'border-red-300' : 'border-gray-300'
                                                }`}
                                                placeholder="e.g., 5000"
                                            />
                                        </div>
                                        {errors.proposed_rate && (
                                            <div className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                                <span>⚠️</span>
                                                <span>{Array.isArray(errors.proposed_rate) ? errors.proposed_rate[0] : errors.proposed_rate}</span>
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1.5">Leave blank if you want to discuss the rate later</p>
                                    </div>

                                    {errors.submit && (
                                        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                                            <p className="text-sm text-red-800 flex items-center gap-2">
                                                <span>⚠️</span>
                                                <span>{Array.isArray(errors.submit) ? errors.submit[0] : errors.submit}</span>
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <PrimaryButton
                                            type="submit"
                                            disabled={processing}
                                            className="flex-1"
                                        >
                                            {processing ? "Submitting..." : "Submit Application"}
                                        </PrimaryButton>
                                        <SecondaryButton
                                            type="button"
                                            onClick={() => navigate(route("service-requests.browse"))}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </SecondaryButton>
                                    </div>
                                </form>
                            </div>

                            {/* Sidebar - Tips */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 sticky top-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-base font-bold text-gray-900">Application Tips</h3>
                                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                            <span className="text-lg">💡</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex gap-3">
                                            <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <span className="text-xs">1</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 mb-1">Be Specific</p>
                                                <p className="text-xs text-gray-600">Mention your relevant experience and skills for this job.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <span className="text-xs">2</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 mb-1">Show Availability</p>
                                                <p className="text-xs text-gray-600">Let the client know when you can start and your availability.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <span className="text-xs">3</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 mb-1">Competitive Rate</p>
                                                <p className="text-xs text-gray-600">Propose a fair rate that reflects your skills and experience.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}
