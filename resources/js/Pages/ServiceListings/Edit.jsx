import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/Layouts/DashboardLayout";
import api from "@/services/api";
import { serviceListingsService } from "@/services/serviceListings";
import { route } from "@/utils/routes";
import { useServiceTypes } from "@/hooks/useServiceTypes";
import toast from "react-hot-toast";

export default function ServiceListingEdit() {
    const { listingId } = useParams();
    const navigate = useNavigate();
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedServiceTypes, setSelectedServiceTypes] = useState([]);
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    // Location fields removed - now managed at profile level
    const [data, setData] = useState({
        work_type: "",
        monthly_rate: "",
        description: "",
        status: "active",
    });

    // Fetch service types from API
    const { serviceTypes } = useServiceTypes();

    const addServiceType = (serviceType) => {
        if (!selectedServiceTypes.includes(serviceType)) {
            setSelectedServiceTypes([...selectedServiceTypes, serviceType]);
        }
    };

    const removeServiceType = (serviceType) => {
        setSelectedServiceTypes(selectedServiceTypes.filter(st => st !== serviceType));
    };



    // Fetch listing from API
    useEffect(() => {
        if (listingId) {
            // Use the edit endpoint to get listing data
            api.get(`/service-listings/${listingId}/edit`)
                .then((response) => {
                    const listingData = response.data.listing;
                    setListing(listingData);

                    // service_types is an array of objects with {id, name, slug, icon}
                    // Extract just the IDs for selectedServiceTypes (API expects IDs)
                    setSelectedServiceTypes(
                        listingData.service_types && listingData.service_types.length > 0
                            ? listingData.service_types.map(st => typeof st === "number" ? st : st.id)
                            : []
                    );

                    // Location fields removed - now on profile level
                    setData({
                        work_type: listingData.work_type || "",
                        monthly_rate: listingData.monthly_rate || "",
                        description: listingData.description || "",
                        status: listingData.status || "active",
                    });
                    setLoading(false);
                })
                .catch((err) => {
                    console.error("Error fetching listing:", err);
                    setError(err.response?.data?.message || "Failed to load listing");
                    setLoading(false);
                });
        }
    }, [listingId]);

    const submit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        // Validation
        if (selectedServiceTypes.length === 0) {
            setErrors({ service_types: "Please select at least one service type." });
            setProcessing(false);
            return;
        }



        // Prepare data for API (city/location fields removed - now on profile)
        const apiData = {
            service_types: selectedServiceTypes,
            work_type: data.work_type,
            monthly_rate: data.monthly_rate || null,
            description: data.description || null,
            status: data.status,
        };

        try {
            await serviceListingsService.updateListing(listingId, apiData);
            toast.success("Service listing updated successfully!");
            // Redirect to my listings
            navigate(route("service-listings.my-listings"));
        } catch (error) {
            if (error.response && error.response.data.errors) {
                setErrors(error.response.data.errors);
            } else {
                toast.error(error.response?.data?.message || "Failed to update listing");
                setErrors({ submit: [error.response?.data?.message || "Failed to update listing"] });
            }
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="flex flex-col items-center gap-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                            <p className="text-gray-600 dark:text-gray-400">Loading listing details...</p>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !listing) {
        return (
            <DashboardLayout>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center border border-gray-100 dark:border-gray-700">
                            <div className="text-6xl mb-6">❌</div>
                            <p className="text-red-600 dark:text-red-400 text-xl mb-6 font-semibold">{error || "Listing not found"}</p>
                            <Link
                                to={route("service-listings.my-listings")}
                                className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-indigo-500/30 font-bold"
                            >
                                Back to My Listings
                            </Link>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-10 relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none">
                    <div className="relative z-10">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">Edit Service Listing</h1>
                        <p className="text-indigo-100 text-lg max-w-2xl mb-6">
                            Update your service listing details and information.
                        </p>
                    </div>
                    {/* Decorative blobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-20 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl transform translate-y-1/2"></div>
                </div>
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={submit} className="space-y-8">
                        {/* Service Types Selection */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <span className="text-2xl">🛠️</span>
                                Select Service Types *
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Choose the services you offer. You can select multiple.</p>
                            {/* Selected Service Types as Tags */}
                            {selectedServiceTypes.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex flex-wrap gap-3">
                                        {selectedServiceTypes.map((serviceType) => {
                                            const service = serviceTypes.find(st => st.value === serviceType);
                                            return (
                                                <span
                                                    key={serviceType}
                                                    className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full text-sm font-bold shadow-md"
                                                >
                                                    <span>{service?.icon}</span>
                                                    <span>{service?.label}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeServiceType(serviceType)}
                                                        className="ml-1 text-white hover:text-red-200 font-bold text-lg"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Service Type Options */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {serviceTypes.map((service) => (
                                    <button
                                        key={service.value}
                                        type="button"
                                        onClick={() => addServiceType(service.value)}
                                        disabled={selectedServiceTypes.includes(service.value)}
                                        className={`p-6 rounded-xl border-2 transition-all duration-300 text-left ${selectedServiceTypes.includes(service.value)
                                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 opacity-50 cursor-not-allowed"
                                            : "border-gray-200 dark:border-gray-600 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer bg-white dark:bg-gray-700"
                                            }`}
                                    >
                                        <div className="text-4xl mb-3">{service.icon}</div>
                                        <div className="font-bold text-gray-900 dark:text-white">{service.label}</div>
                                    </button>
                                ))}
                            </div>
                            {errors.service_types && (
                                <div className="mt-4 text-red-500 dark:text-red-400 text-sm font-medium flex items-center gap-1">
                                    <span>⚠️</span> {errors.service_types}
                                </div>
                            )}
                        </div>

                        {/* Common Fields */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="text-2xl">📝</span>
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Common Details</h2>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">These details will apply to your service listing.</p>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Work Type *</label>
                                    <select
                                        value={data.work_type}
                                        onChange={(e) => setData({ ...data, work_type: e.target.value })}
                                        className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 shadow-sm transition-all duration-300"
                                        required
                                    >
                                        <option value="">Select Type</option>
                                        <option value="full_time">Full Time</option>
                                        <option value="part_time">Part Time</option>
                                    </select>
                                    {errors.work_type && (
                                        <div className="mt-2 text-red-500 dark:text-red-400 text-sm font-medium flex items-center gap-1">
                                            <span>⚠️</span> {errors.work_type}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Monthly Rate (PKR)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.monthly_rate}
                                        onChange={(e) => setData({ ...data, monthly_rate: e.target.value })}
                                        className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 shadow-sm transition-all duration-300"
                                        placeholder="e.g., 50000"
                                    />
                                    {errors.monthly_rate && (
                                        <div className="mt-2 text-red-500 dark:text-red-400 text-sm font-medium flex items-center gap-1">
                                            <span>⚠️</span> {errors.monthly_rate}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Status *</label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => setData({ ...data, status: e.target.value })}
                                        className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 shadow-sm transition-all duration-300"
                                        required
                                    >
                                        <option value="active">Active</option>
                                        <option value="paused">Paused</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                    {errors.status && (
                                        <div className="mt-2 text-red-500 dark:text-red-400 text-sm font-medium flex items-center gap-1">
                                            <span>⚠️</span> {errors.status}
                                        </div>
                                    )}
                                </div>



                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Description</label>
                                    <textarea
                                        value={data.description}
                                        onChange={(e) => setData({ ...data, description: e.target.value })}
                                        rows={8}
                                        className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 shadow-sm transition-all duration-300"
                                        placeholder="Describe the services you offer, your experience, etc..."
                                    />
                                    {errors.description && (
                                        <div className="mt-2 text-red-500 dark:text-red-400 text-sm font-medium flex items-center gap-1">
                                            <span>⚠️</span> {errors.description}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-indigo-500/30 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Updating...
                                        </span>
                                    ) : (
                                        "Update Service Listing"
                                    )}
                                </button>
                                <Link
                                    to={route("service-listings.my-listings")}
                                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 font-bold text-lg text-center flex items-center justify-center border-2 border-gray-300 dark:border-gray-600"
                                >
                                    Cancel
                                </Link>
                            </div>
                            {errors.submit && (
                                <div className="mt-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 rounded-xl">
                                    <p className="text-sm text-red-800 dark:text-red-300 font-medium flex items-center gap-2">
                                        <span>⚠️</span> {errors.submit[0]}
                                    </p>
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}

