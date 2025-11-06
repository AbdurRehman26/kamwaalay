import { useParams, useNavigate } from 'react-router-dom';
import PublicLayout from '@/Layouts/PublicLayout';
import { useState, useEffect } from 'react';
import { jobApplicationsService } from '@/services/jobApplications';
import { route } from '@/utils/routes';

export default function JobApplicationCreate() {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        message: '',
        proposed_rate: '',
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (bookingId) {
            jobApplicationsService.getApplicationCreate(bookingId)
                .then((response) => {
                    setBooking(response.booking);
                    setLoading(false);
                })
                .catch((error) => {
                    console.error('Error fetching booking:', error);
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
            router.visit(route('job-applications.index'), {
                method: 'get',
            });
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ submit: [error.response?.data?.message || 'Failed to create application'] });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <PublicLayout>
            
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">Apply for Service Request</h1>
                    <p className="text-xl text-white/90">Submit your application to this service request</p>
                </div>
            </div>
            <div className="container mx-auto px-4 py-12">
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600">Loading booking details...</p>
                    </div>
                ) : !booking ? (
                    <div className="text-center py-12">
                        <p className="text-red-600">Booking not found</p>
                        <button
                            onClick={() => router.visit(route('job-applications.index'))}
                            className="mt-4 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition duration-300 font-semibold"
                        >
                            Back to Job Requests
                        </button>
                    </div>
                ) : (
                <div className="max-w-4xl mx-auto">
                    {/* Booking Details */}
                    <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900">Service Request Details</h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Service Type</h3>
                                <p className="text-gray-900 capitalize">{booking.service_type?.replace('_', ' ') || 'N/A'}</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Work Type</h3>
                                <p className="text-gray-900 capitalize">{booking.work_type?.replace('_', ' ') || 'N/A'}</p>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Location</h3>
                                <p className="text-gray-900">{booking.city}, {booking.area}</p>
                            </div>
                            {booking.start_date && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Start Date</h3>
                                    <p className="text-gray-900">{booking.start_date}</p>
                                </div>
                            )}
                            {booking.special_requirements && (
                                <div className="md:col-span-2">
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Special Requirements</h3>
                                    <p className="text-gray-900">{booking.special_requirements}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Application Form */}
                    <form onSubmit={submit} className="bg-white rounded-lg shadow-md p-8">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900">Your Application</h2>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Application Message
                            </label>
                            <textarea
                                value={data.message}
                                onChange={(e) => setData(prev => ({ ...prev, message: e.target.value }))}
                                rows={6}
                                className="w-full border-gray-300 rounded-lg focus:border-purple-500 focus:ring-purple-500"
                                placeholder="Tell the client why you're perfect for this job. Mention your experience, skills, and availability..."
                            />
                            {errors.message && <div className="text-red-500 text-sm mt-1">{errors.message}</div>}
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Proposed Monthly Rate (PKR) <span className="text-gray-500">(Optional)</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={data.proposed_rate}
                                onChange={(e) => setData(prev => ({ ...prev, proposed_rate: e.target.value }))}
                                className="w-full border-gray-300 rounded-lg focus:border-purple-500 focus:ring-purple-500"
                                placeholder="e.g., 500"
                            />
                            {errors.proposed_rate && <div className="text-red-500 text-sm mt-1">{errors.proposed_rate}</div>}
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
                            >
                                {processing ? 'Submitting...' : 'Submit Application'}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.visit(route('job-applications.index'))}
                                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition duration-300 font-semibold"
                            >
                                Cancel
                            </button>
                        </div>
                        {errors.submit && (
                            <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                                <p className="text-sm text-red-800">{errors.submit[0]}</p>
                            </div>
                        )}
                    </form>
                </div>
                )}
            </div>
        </PublicLayout>
    );
}

