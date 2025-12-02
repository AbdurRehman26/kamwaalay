import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import PublicLayout from "@/Layouts/PublicLayout";
import axios from "axios";
import { bookingsService } from "@/services/bookings";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";

export default function BookingCreate() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [prefill, setPrefill] = useState({});
    const [loading, setLoading] = useState(true);
    
    const [data, setData] = useState({
        service_type: "",
        work_type: "",
        city: "Karachi",
        area: "",
        start_date: "",
        start_time: "",
        name: user?.name || "",
        phone: user?.phone || "",
        email: user?.email || "",
        address: user?.address || "",
        special_requirements: "",
        assigned_user_id: null,
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchTimeoutRef = useRef(null);
    const suggestionsRef = useRef(null);

    // Fetch prefill data from API
    useEffect(() => {
        bookingsService.getBookingCreatePrefill()
            .then((response) => {
                if (response.prefill) {
                    setPrefill(response.prefill);
                    setData(prev => ({
                        ...prev,
                        service_type: response.prefill.service_type || prev.service_type,
                        work_type: response.prefill.work_type || prev.work_type,
                        city: response.prefill.city || prev.city,
                        area: response.prefill.area || prev.area,
                        name: response.prefill.name || prev.name || user?.name || "",
                        phone: response.prefill.phone || prev.phone || user?.phone || "",
                        email: response.prefill.email || prev.email || user?.email || "",
                        address: response.prefill.address || prev.address || user?.address || "",
                    }));
                    setSearchQuery(response.prefill.area || "");
                }
                if (response.user) {
                    setData(prev => ({
                        ...prev,
                        name: prev.name || response.user.name || "",
                        phone: prev.phone || response.user.phone || "",
                        email: prev.email || response.user.email || "",
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

    const serviceTypes = [
        { value: "maid", label: "Maid" },
        { value: "cook", label: "Cook" },
        { value: "babysitter", label: "Babysitter" },
        { value: "caregiver", label: "Caregiver" },
        { value: "cleaner", label: "Cleaner" },
        { value: "all_rounder", label: "All Rounder" },
    ];

    // Fetch location suggestions for area
    useEffect(() => {
        if (searchQuery.length >= 2) {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            searchTimeoutRef.current = setTimeout(() => {
                axios
                    .get("/api/karachi-locations/search", {
                        params: { q: searchQuery },
                    })
                    .then((response) => {
                        setSuggestions(response.data);
                        setShowSuggestions(true);
                    })
                    .catch((error) => {
                        console.error("Error fetching locations:", error);
                        setSuggestions([]);
                    });
            }, 300);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery]);

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

    // Handle area selection
    const handleAreaSelect = (area) => {
        setSearchQuery(area);
        setData(prev => ({ ...prev, area }));
        setShowSuggestions(false);
    };

    const submit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        
        // Always set city to Karachi
        const submitData = {
            ...data,
            city: "Karachi",
        };

        try {
            const response = await bookingsService.createBooking(submitData);
            // Redirect to bookings index or show success message
            router.visit(route("bookings.index"), {
                method: "get",
            });
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ submit: [error.response?.data?.message || "Failed to create booking"] });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <PublicLayout>
            
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">Post Job</h1>
                    <p className="text-xl text-white/90">Fill in the form below to post your job</p>
                </div>
            </div>
            <div className="container mx-auto px-4 py-12">
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600">Loading...</p>
                    </div>
                ) : (
                <div className="max-w-2xl mx-auto">
                    {/* Notice about Karachi only */}
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 mb-8 rounded-lg p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    <strong>Note:</strong> We are currently serving <strong>Karachi</strong> only. We will be going live in different cities soon!
                                </p>
                            </div>
                        </div>
                    </div>
                    <form onSubmit={submit} className="bg-white rounded-lg shadow-md p-8">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Service Type *</label>
                                <select
                                    value={data.service_type}
                                    onChange={(e) => setData(prev => ({ ...prev, service_type: e.target.value }))}
                                    className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                    required
                                >
                                    <option value="">Select Service</option>
                                    {serviceTypes.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.service_type && <div className="text-red-500 text-sm mt-1">{errors.service_type}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Work Type *</label>
                                <select
                                    value={data.work_type}
                                    onChange={(e) => setData(prev => ({ ...prev, work_type: e.target.value }))}
                                    className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                    required
                                >
                                    <option value="">Select Type</option>
                                    <option value="full_time">Full Time</option>
                                    <option value="part_time">Part Time</option>
                                </select>
                                {errors.work_type && <div className="text-red-500 text-sm mt-1">{errors.work_type}</div>}
                            </div>

                            <div className="relative" ref={suggestionsRef}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Area *</label>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setData(prev => ({ ...prev, area: e.target.value }));
                                    }}
                                    onFocus={() => {
                                        if (suggestions.length > 0) {
                                            setShowSuggestions(true);
                                        }
                                    }}
                                    className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                    placeholder="Type to search area..."
                                    required
                                />
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                                        {suggestions.map((suggestion, index) => (
                                            <div
                                                key={index}
                                                onClick={() => handleAreaSelect(suggestion)}
                                                className="px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                            >
                                                {suggestion}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {errors.area && <div className="text-red-500 text-sm mt-1">{errors.area}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                <input
                                    type="date"
                                    value={data.start_date}
                                    onChange={(e) => setData(prev => ({ ...prev, start_date: e.target.value }))}
                                    className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                />
                                {errors.start_date && <div className="text-red-500 text-sm mt-1">{errors.start_date}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                                <input
                                    type="time"
                                    value={data.start_time}
                                    onChange={(e) => setData(prev => ({ ...prev, start_time: e.target.value }))}
                                    className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                />
                                {errors.start_time && <div className="text-red-500 text-sm mt-1">{errors.start_time}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name *</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
                                    disabled={!!user}
                                    className={`w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500 ${
                                        user ? "bg-gray-100 cursor-not-allowed" : ""
                                    }`}
                                    required
                                />
                                {errors.name && <div className="text-red-500 text-sm mt-1">{errors.name}</div>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                                <input
                                    type="tel"
                                    value={data.phone}
                                    onChange={(e) => setData(prev => ({ ...prev, phone: e.target.value }))}
                                    disabled={!!user}
                                    className={`w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500 ${
                                        user ? "bg-gray-100 cursor-not-allowed" : ""
                                    }`}
                                    required
                                />
                                {errors.phone && <div className="text-red-500 text-sm mt-1">{errors.phone}</div>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData(prev => ({ ...prev, email: e.target.value }))}
                                    disabled={!!user}
                                    className={`w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500 ${
                                        user ? "bg-gray-100 cursor-not-allowed" : ""
                                    }`}
                                    required
                                />
                                {errors.email && <div className="text-red-500 text-sm mt-1">{errors.email}</div>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                <textarea
                                    value={data.address}
                                    onChange={(e) => setData(prev => ({ ...prev, address: e.target.value }))}
                                    rows={3}
                                    className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                />
                                {errors.address && <div className="text-red-500 text-sm mt-1">{errors.address}</div>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Special Requirements</label>
                                <textarea
                                    value={data.special_requirements}
                                    onChange={(e) => setData(prev => ({ ...prev, special_requirements: e.target.value }))}
                                    rows={4}
                                    className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                    placeholder="Any special requirements or preferences..."
                                />
                                {errors.special_requirements && <div className="text-red-500 text-sm mt-1">{errors.special_requirements}</div>}
                            </div>
                        </div>

                        <div className="mt-8 flex gap-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition duration-300 font-semibold"
                            >
                                {processing ? "Submitting..." : "Submit Booking"}
                            </button>
                            <Link
                                to={route("helpers.index")}
                                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition duration-300 font-semibold text-center"
                            >
                                Browse Helpers First
                            </Link>
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

