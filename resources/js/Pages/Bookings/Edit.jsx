import { Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import axios from "axios";
import { jobPostsService } from "@/services/jobPosts";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";
import { useServiceTypes } from "@/hooks/useServiceTypes";
import MapPicker from "@/Components/MapPicker";
import toast from "react-hot-toast";

export default function BookingEdit() {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    const [data, setData] = useState({
        service_type: "",
        work_type: "",
        estimated_salary: "",

        start_date: "",
        start_time: "",
        name: user?.name || "",
        phone: user?.phone || "",
        address: user?.address || "",
        latitude: null,
        longitude: null,
        special_requirements: "",
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    // Fetch service types from API
    const { serviceTypes } = useServiceTypes();

    // Fetch booking data
    useEffect(() => {
        if (bookingId) {
            jobPostsService.getBooking(bookingId)
                .then((response) => {
                    const bookingData = response.job_post || response.booking;
                    setBooking(bookingData);
                    setData({
                        service_type: bookingData.service_type_id || "",
                        work_type: bookingData.work_type || "",
                        estimated_salary: bookingData.estimated_salary || "",

                        start_date: bookingData.start_date || "",
                        start_time: bookingData.start_time || "",
                        name: bookingData.name || user?.name || "",
                        phone: bookingData.phone || user?.phone || "",
                        address: bookingData.address || user?.address || "",
                        latitude: bookingData.latitude || null,
                        longitude: bookingData.longitude || null,
                        special_requirements: bookingData.special_requirements || "",
                    });
                    setLoading(false);
                })
                .catch((error) => {
                    console.error("Error fetching booking:", error);
                    setLoading(false);
                });
        }
    }, [bookingId, user]);



    // Handle outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    const submit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        // Always set city to Karachi
        const submitData = {
            ...data,

        };

        try {
            await jobPostsService.updateBooking(bookingId, submitData);
            toast.success("Job post updated successfully!");
            navigate(route("job-posts.index"));
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                toast.error(error.response?.data?.message || "Failed to update job post");
                setErrors({ submit: [error.response?.data?.message || "Failed to update service request"] });
            }
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!booking) {
        return (
            <DashboardLayout>
                <div className="text-center py-12">
                    <p className="text-red-600 dark:text-red-400">Service request not found</p>
                    <Link
                        to={route("job-posts.index")}
                        className="mt-4 inline-block bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-300 font-semibold"
                    >
                        Back to Service Requests
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-10 relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none">
                    <div className="relative z-10">
                        <h1 className="text-3xl md:text-4xl font-bold mb-3">Edit Job Posting</h1>
                        <p className="text-indigo-100 text-lg max-w-xl">
                            Update your job posting details and find the perfect helper for your needs.
                        </p>
                    </div>
                    {/* Decorative blobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-20 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl transform translate-y-1/2"></div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-3xl mx-auto">
                    <form onSubmit={submit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 relative z-20 -mt-10 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Service Type *</label>
                                <select
                                    value={data.service_type}
                                    onChange={(e) => setData(prev => ({ ...prev, service_type: e.target.value }))}
                                    className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 py-2.5 px-4 shadow-sm"
                                    required
                                >
                                    <option value="">Select Service</option>
                                    {serviceTypes.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.service_type && <div className="text-red-500 dark:text-red-400 text-sm mt-1.5">{errors.service_type}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Work Type *</label>
                                <select
                                    value={data.work_type}
                                    onChange={(e) => setData(prev => ({ ...prev, work_type: e.target.value }))}
                                    className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 py-2.5 px-4 shadow-sm"
                                    required
                                >
                                    <option value="">Select Type</option>
                                    <option value="full_time">Full Time</option>
                                    <option value="part_time">Part Time</option>
                                </select>
                                {errors.work_type && <div className="text-red-500 dark:text-red-400 text-sm mt-1.5">{errors.work_type}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Estimated Salary (PKR/month)</label>
                                <input
                                    type="number"
                                    value={data.estimated_salary}
                                    onChange={(e) => setData(prev => ({ ...prev, estimated_salary: e.target.value }))}
                                    className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 py-2.5 px-4 shadow-sm"
                                    placeholder="e.g., 25000"
                                    min="0"
                                />
                                {errors.estimated_salary && <div className="text-red-500 dark:text-red-400 text-sm mt-1.5">{errors.estimated_salary}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Your Name *</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
                                    disabled={!!user}
                                    className={`w-full border-2 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 py-2.5 px-4 shadow-sm ${user ? "border-gray-200 bg-gray-100 dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed dark:text-gray-300" : "border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        }`}
                                    required
                                />
                                {errors.name && <div className="text-red-500 dark:text-red-400 text-sm mt-1.5">{errors.name}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Phone *</label>
                                <input
                                    type="tel"
                                    value={data.phone}
                                    onChange={(e) => setData(prev => ({ ...prev, phone: e.target.value }))}
                                    disabled={!!user}
                                    className={`w-full border-2 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 py-2.5 px-4 shadow-sm ${user ? "border-gray-200 bg-gray-100 dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed dark:text-gray-300" : "border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        }`}
                                    required
                                />
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <span>Your phone number will not be visible to helpers unless you accept their application.</span>
                                </p>
                                {errors.phone && <div className="text-red-500 dark:text-red-400 text-sm mt-1.5">{errors.phone}</div>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Location & Address</label>

                                <div className="flex gap-2 mb-4">
                                    <div className="flex-grow">
                                        <input
                                            type="text"
                                            value={data.address || ""}
                                            readOnly
                                            className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-xl py-2.5 px-4 shadow-sm bg-gray-50 focus:outline-none cursor-default"
                                            placeholder="No location selected"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (navigator.geolocation) {
                                                const loadingToast = toast.loading("Getting your location...");
                                                navigator.geolocation.getCurrentPosition(
                                                    (pos) => {
                                                        const { latitude, longitude } = pos.coords;

                                                        // Update coordinates
                                                        setData(prev => ({
                                                            ...prev,
                                                            latitude: latitude,
                                                            longitude: longitude
                                                        }));

                                                        // Reverse geocode
                                                        if (window.google && window.google.maps) {
                                                            const geocoder = new window.google.maps.Geocoder();
                                                            geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
                                                                if (status === "OK" && results[0]) {
                                                                    setData(prev => ({
                                                                        ...prev,
                                                                        address: results[0].formatted_address
                                                                    }));
                                                                    toast.success("Location updated", { id: loadingToast });
                                                                } else {
                                                                    toast.dismiss(loadingToast);
                                                                }
                                                            });
                                                        } else {
                                                            toast.success("Location updated (Address fetch pending)", { id: loadingToast });
                                                        }
                                                    },
                                                    (error) => {
                                                        console.error("Error getting location:", error);
                                                        toast.error("Could not get your location", { id: loadingToast });
                                                    }
                                                );
                                            } else {
                                                toast.error("Geolocation is not supported by this browser.");
                                            }
                                        }}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition-colors duration-200 flex items-center gap-2"
                                        title="Use Current Location"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span className="hidden sm:inline">Locate Me</span>
                                    </button>
                                </div>

                                <div className="h-[300px] w-full bg-gray-100 rounded-xl overflow-hidden mb-4 border-2 border-gray-200 dark:border-gray-600">
                                    <MapPicker
                                        latitude={data.latitude}
                                        longitude={data.longitude}
                                        height="100%"
                                        onChange={(lat, lng, address) => setData(prev => ({
                                            ...prev,
                                            latitude: lat,
                                            longitude: lng,
                                            address: address || prev.address
                                        }))}
                                    />
                                </div>

                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <span>Your address will not be visible to helpers unless you accept their application.</span>
                                </p>
                                {errors.address && <div className="text-red-500 dark:text-red-400 text-sm mt-1.5">{errors.address}</div>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Special Requirements</label>
                                <textarea
                                    value={data.special_requirements}
                                    onChange={(e) => setData(prev => ({ ...prev, special_requirements: e.target.value }))}
                                    rows={4}
                                    className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 py-2.5 px-4 shadow-sm"
                                    placeholder="Any special requirements or preferences..."
                                />
                                {errors.special_requirements && <div className="text-red-500 dark:text-red-400 text-sm mt-1.5">{errors.special_requirements}</div>}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700 flex gap-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Updating...
                                    </span>
                                ) : (
                                    "Update Job Post"
                                )}
                            </button>
                            <Link
                                to={route("job-posts.index")}
                                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3.5 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 text-center shadow-md hover:shadow-lg"
                            >
                                Cancel
                            </Link>
                        </div>
                        {errors.submit && (
                            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-600 p-4 rounded-xl">
                                <p className="text-sm font-medium text-red-800 dark:text-red-300">{errors.submit[0]}</p>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}

