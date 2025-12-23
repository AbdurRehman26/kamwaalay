import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import axios from "axios";
import { jobPostsService } from "@/services/jobPosts";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";
import { useServiceTypes } from "@/hooks/useServiceTypes";
import MapPicker from "@/Components/MapPicker";

export default function BookingCreate() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [prefill, setPrefill] = useState({});
    const [loading, setLoading] = useState(true);

    const [data, setData] = useState({
        service_type: "",
        work_type: "",
        estimated_salary: "",
        city_id: "",
        start_date: "",
        start_time: "",
        name: user?.name || "",
        phone: user?.phone || "",
        address: user?.address || "",
        latitude: null,
        longitude: null,
        special_requirements: "",
        assigned_user_id: null,
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [cities, setCities] = useState([]);

    // City search state
    const [citySearch, setCitySearch] = useState("");
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const cityDropdownRef = useRef(null);

    // Fetch prefill data from API
    useEffect(() => {
        jobPostsService.getBookingCreatePrefill()
            .then((response) => {
                if (response.prefill) {
                    setPrefill(response.prefill);
                    setData(prev => ({
                        ...prev,
                        service_type: response.prefill.service_type || prev.service_type,
                        work_type: response.prefill.work_type || prev.work_type,
                        city: response.prefill.city || prev.city,
                        name: response.prefill.name || prev.name || user?.name || "",
                        phone: response.prefill.phone || prev.phone || user?.phone || "",
                        address: response.prefill.address || prev.address || user?.address || "",
                        latitude: response.prefill.latitude || prev.latitude || null,
                        longitude: response.prefill.longitude || prev.longitude || null,
                    }));
                    // Set city search text if city prefilled (assuming we can get city name, but here response.prefill.city is likely an ID or object?
                    // Usually API returns city_id in prefill response for job posts?
                    // The original code used response.prefill.city. If it's the ID, we need to match name after cities load.
                    // Let's defer setting citySearch until cities are loaded if we only have ID.
                    // But looking at existing code: city: response.prefill.city

                }
                if (response.user) {
                    setData(prev => ({
                        ...prev,
                        name: prev.name || response.user.name || "",
                        phone: prev.phone || response.user.phone || "",
                        address: prev.address || response.user.address || "",
                    }));
                }
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching prefill data:", error);
                setLoading(false);
            });
    }, [user]);

    // Fetch active cities
    useEffect(() => {
        axios.get("/api/cities")
            .then((response) => {
                setCities(response.data || []);
            })
            .catch((error) => {
                console.error("Error fetching cities:", error);
            });
    }, []);

    // Sync city search text when city_id changes (e.g. from prefill)
    useEffect(() => {
        if (data.city_id && cities.length > 0) {
            // Use == for loose equality in case one is string and other is number
            const city = cities.find(c => c.id == data.city_id);
            if (city) {
                setCitySearch(city.name);
            }
        }
    }, [data.city_id, cities]);

    // Fetch service types from API
    const { serviceTypes } = useServiceTypes();

    // Handle outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
            if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) {
                setShowCityDropdown(false);
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

        const submitData = {
            ...data,
        };

        try {
            const response = await jobPostsService.createBooking(submitData);
            // Redirect to job postings index or show success message
            navigate(route("job-posts.index"));
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ submit: [error.response?.data?.message || "Failed to create job post"] });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <DashboardLayout>
            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-10 relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none">
                    <div className="relative z-10">
                        <h1 className="text-3xl md:text-4xl font-bold mb-3">Create Job Posting</h1>
                        <p className="text-indigo-100 text-lg max-w-xl">
                            Fill in the form below to create your job posting and find the perfect helper for your needs.
                        </p>
                    </div>
                    {/* Decorative blobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-20 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl transform translate-y-1/2"></div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto">
                        {/* Notice about Karachi only */}
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 mb-6 rounded-xl p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                        <strong>Note:</strong> We are currently serving <strong>Karachi, Lahore, and Islamabad</strong>. More cities coming soon!
                                    </p>
                                </div>
                            </div>
                        </div>
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
                                    <div className="relative" ref={cityDropdownRef}>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">City *</label>
                                        <div
                                            className="relative"
                                        >
                                            <input
                                                type="text"
                                                value={citySearch}
                                                onChange={(e) => {
                                                    setCitySearch(e.target.value);
                                                    setShowCityDropdown(true);
                                                    // Clear ID if user changes text manually, forcing re-selection
                                                    if (data.city_id) {
                                                        setData(prev => ({ ...prev, city_id: "" }));
                                                    }
                                                }}
                                                onFocus={() => setShowCityDropdown(true)}
                                                className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 py-2.5 px-4 shadow-sm"
                                                placeholder="Search or select city..."
                                                required={!data.city_id} // Required if no ID selected
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>

                                        {showCityDropdown && (
                                            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-lg max-h-60 overflow-auto">
                                                {cities.filter(city => city.name.toLowerCase().includes(citySearch.toLowerCase())).length > 0 ? (
                                                    cities
                                                        .filter(city => city.name.toLowerCase().includes(citySearch.toLowerCase()))
                                                        .map((city) => (
                                                            <div
                                                                key={city.id}
                                                                onClick={() => {
                                                                    setData(prev => ({ ...prev, city_id: city.id }));
                                                                    setCitySearch(city.name);
                                                                    setShowCityDropdown(false);
                                                                    setSearchQuery("");
                                                                }}
                                                                className={`px-4 py-2 hover:bg-indigo-50 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0 text-gray-900 dark:text-gray-200 ${data.city_id === city.id ? "bg-indigo-50 dark:bg-gray-600 font-medium" : ""}`}
                                                            >
                                                                {city.name}
                                                            </div>
                                                        ))
                                                ) : (
                                                    <div className="px-4 py-2 text-gray-500 dark:text-gray-400">No cities found</div>
                                                )}
                                            </div>
                                        )}
                                        {errors.city_id && <div className="text-red-500 dark:text-red-400 text-sm mt-1.5">{errors.city_id}</div>}
                                    </div>
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

                                    <div className="mb-4">
                                        <MapPicker
                                            latitude={data.latitude}
                                            longitude={data.longitude}
                                            onChange={(lat, lng, address) => setData(prev => ({
                                                ...prev,
                                                latitude: lat,
                                                longitude: lng,
                                                address: address || prev.address
                                            }))}
                                        />
                                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                            Click on the map, dragon the marker, or use the "Locate Me" button to pin your exact location.
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase">Address (Auto-detected)</label>
                                        <p className="text-gray-900 dark:text-gray-200 font-medium">
                                            {data.address || "No location selected"}
                                        </p>
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
                                            Submitting...
                                        </span>
                                    ) : (
                                        "Submit Job Post"
                                    )}
                                </button>
                                <Link
                                    to={route("helpers.index")}
                                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3.5 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 text-center shadow-md hover:shadow-lg"
                                >
                                    Browse Helpers First
                                </Link>
                            </div>
                            {errors.submit && (
                                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-600 p-4 rounded-xl">
                                    <p className="text-sm font-medium text-red-800 dark:text-red-300">{errors.submit[0]}</p>
                                </div>
                            )}
                        </form>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

