import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { businessesService } from "@/services/businesses";
import { route } from "@/utils/routes";
import api from "@/services/api";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import TextArea from "@/Components/TextArea";
import { useServiceTypes } from "@/hooks/useServiceTypes";
import { useLanguages } from "@/hooks/useLanguages";

export default function EditWorker() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [selectedServiceTypes, setSelectedServiceTypes] = useState([]);
    const [selectedLocations, setSelectedLocations] = useState([]);
    const [locationQuery, setLocationQuery] = useState("");
    const [locationSuggestions, setLocationSuggestions] = useState([]);
    const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
    const locationRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    const [data, setData] = useState({
        name: "",
        phone: "",
        age: "",
        gender: "",
        religion: "",
        experience_years: "",
        availability: "full_time",
        bio: "",
        skills: "",
        photo: null,
        existingPhoto: null,
    });
    const [selectedLanguages, setSelectedLanguages] = useState([]);

    // Fetch service types and languages from API
    const { serviceTypes } = useServiceTypes();
    const { languages } = useLanguages();

    const availabilityOptions = [
        { value: "full_time", label: "Full Time" },
        { value: "part_time", label: "Part Time" },
        { value: "available", label: "Available" },
    ];

    // Fetch worker data
    useEffect(() => {
        if (id) {
            businessesService.getWorkerEdit(id)
                .then((response) => {
                    const worker = response.helper || response.worker;
                    if (worker) {
                        setData({
                            name: worker.name || "",
                            phone: worker.phone || "",
                            age: worker.age || "",
                            gender: worker.gender || "",
                            religion: worker.religion || "",
                            experience_years: worker.experience_years || "",
                            availability: worker.availability || "full_time",
                            bio: worker.bio || "",
                            skills: worker.skills || "",
                            photo: null,
                            existingPhoto: worker.photo || null,
                        });

                        // Load languages
                        if (worker.languages && Array.isArray(worker.languages)) {
                            setSelectedLanguages(worker.languages.map(l => l.id));
                        }

                        // Load service types from service listings
                        if (worker.service_listings && worker.service_listings.length > 0) {
                            const allServiceTypes = new Set();
                            worker.service_listings.forEach(listing => {
                                if (listing.service_types && Array.isArray(listing.service_types)) {
                                    listing.service_types.forEach(st => {
                                        if (typeof st === "string") {
                                            allServiceTypes.add(st);
                                        }
                                    });
                                }
                            });
                            setSelectedServiceTypes(Array.from(allServiceTypes));
                        }

                        // Load locations from service listings
                        if (worker.service_listings && worker.service_listings.length > 0) {
                            const allLocations = [];
                            worker.service_listings.forEach(listing => {
                                if (listing.location_details && Array.isArray(listing.location_details)) {
                                    listing.location_details.forEach(loc => {
                                        if (loc.area) {
                                            allLocations.push({
                                                id: loc.id,
                                                display_text: loc.area,
                                                city: loc.city_name,
                                                area: loc.area,
                                            });
                                        }
                                    });
                                }
                            });
                            // Remove duplicates
                            const uniqueLocations = allLocations.filter((loc, index, self) =>
                                index === self.findIndex(l => l.id === loc.id)
                            );
                            setSelectedLocations(uniqueLocations);
                        }
                    }
                    setLoading(false);
                })
                .catch((err) => {
                    console.error("Error fetching worker:", err);
                    setErrors({ submit: [err.response?.data?.message || "Failed to load worker"] });
                    setLoading(false);
                });
        }
    }, [id]);

    // Fetch location suggestions
    useEffect(() => {
        if (locationQuery.length >= 2) {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
            searchTimeoutRef.current = setTimeout(() => {
                api
                    .get("/locations/search", {
                        params: { q: locationQuery },
                    })
                    .then((response) => {
                        setLocationSuggestions(response.data);
                        setShowLocationSuggestions(true);
                    })
                    .catch((error) => {
                        console.error("Error fetching locations:", error);
                        setLocationSuggestions([]);
                    });
            }, 300);
        } else {
            setLocationSuggestions([]);
            setShowLocationSuggestions(false);
        }
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [locationQuery]);

    const handleLocationSelect = (location) => {
        // Only allow selection if location has an id (actual location from database)
        if (!location.id) {
            alert("Please select a specific location (area) from the list, not just a city.");
            return;
        }
        // Check if location already exists
        const exists = selectedLocations.some(loc => loc.id === location.id);
        if (!exists) {
            setSelectedLocations([...selectedLocations, {
                id: location.id,
                display_text: location.area || location.display_text,
                city: location.city_name,
                area: location.area || "",
            }]);
        }
        setLocationQuery("");
        setShowLocationSuggestions(false);
    };

    const removeServiceType = (serviceType) => {
        setSelectedServiceTypes(selectedServiceTypes.filter(st => st !== serviceType));
    };

    const removeLocation = (locationId) => {
        setSelectedLocations(selectedLocations.filter(loc => loc.id !== locationId));
    };

    const addServiceType = (serviceType) => {
        if (!selectedServiceTypes.includes(serviceType)) {
            setSelectedServiceTypes([...selectedServiceTypes, serviceType]);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (locationRef.current && !locationRef.current.contains(event.target)) {
                setShowLocationSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        // Validation
        if (selectedServiceTypes.length === 0) {
            setErrors({ service_types: "Please select at least one service type." });
            setProcessing(false);
            return;
        }

        if (selectedLocations.length === 0) {
            setErrors({ locations: "Please select at least one location." });
            setProcessing(false);
            return;
        }

        const formData = new FormData();
        formData.append("name", data.name);
        if (data.phone) {
            formData.append("phone", data.phone);
        }
        // Ensure experience_years is an integer and always send it
        const experienceYears = data.experience_years ? parseInt(data.experience_years, 10) : 0;
        if (isNaN(experienceYears) || experienceYears < 0) {
            setErrors({ experience_years: "Experience years must be a valid number." });
            setProcessing(false);
            return;
        }
        formData.append("experience_years", experienceYears.toString());
        formData.append("availability", data.availability || "full_time");
        // Always send bio and skills, even if empty (Laravel nullable handles empty strings)
        formData.append("bio", data.bio || "");
        formData.append("skills", data.skills || "");

        if (data.photo) {
            formData.append("photo", data.photo);
        }

        // Add service types as array
        selectedServiceTypes.forEach((type, index) => {
            formData.append(`service_types[${index}]`, type);
        });

        // Add locations as array
        selectedLocations.forEach((location, index) => {
            // Ensure city and area are set
            const city = location.city || location.city_name || "";
            const area = location.area || location.display_text || "";
            if (!city || !area) {
                console.error("Location missing city or area:", location);
                return;
            }
            formData.append(`locations[${index}][city]`, city);
            formData.append(`locations[${index}][area]`, area);
        });

        // Add optional worker details
        if (data.age) {
            formData.append("age", data.age);
        }
        if (data.gender) {
            formData.append("gender", data.gender);
        }
        if (data.religion) {
            formData.append("religion", data.religion);
        }
        if (selectedLanguages.length > 0) {
            formData.append("languages", JSON.stringify(selectedLanguages));
        }

        try {
            await businessesService.updateWorker(id, formData);
            navigate(route("business.workers.index"));
        } catch (error) {
            if (error.response && error.response.data.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ submit: [error.response?.data?.message || "Failed to update worker"] });
            }
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 text-center">
                        <p className="text-gray-600 dark:text-gray-400">Loading worker data...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {/* Header Section */}
            <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 text-white overflow-hidden rounded-2xl shadow-xl mb-8">
                {/* Abstract Background Shapes */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                </div>

                <div className="relative z-10 p-8">
                    <h2 className="text-indigo-300 dark:text-indigo-400 font-bold tracking-wide uppercase text-sm mb-3">Edit Worker</h2>
                    <h1 className="text-4xl md:text-5xl font-bold mb-2">Edit Worker</h1>
                    <p className="text-xl text-indigo-100/90 dark:text-indigo-200/90">Update worker information</p>
                </div>
            </div>

            <div className="max-w-4xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Submit Error Banner */}
                    {errors.submit && (
                        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
                            <div className="flex items-center gap-2">
                                <span className="text-red-600 dark:text-red-400 font-bold">⚠️</span>
                                <div>
                                    {Array.isArray(errors.submit) ? (
                                        errors.submit.map((error, idx) => (
                                            <p key={idx} className="text-red-600 dark:text-red-400 text-sm font-medium">
                                                {error}
                                            </p>
                                        ))
                                    ) : (
                                        <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                                            {errors.submit}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Basic Information */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">Basic Information</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div>
                                <InputLabel htmlFor="name" value="Full Name *" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.name}
                                    onChange={(e) => setData({ ...data, name: e.target.value })}
                                    required
                                />
                                <InputError message={errors.name} className="mt-1.5" />
                            </div>

                            <div>
                                <InputLabel htmlFor="phone" value="Phone" />
                                <TextInput
                                    id="phone"
                                    type="tel"
                                    className="mt-1 block w-full"
                                    value={data.phone}
                                    onChange={(e) => setData({ ...data, phone: e.target.value })}
                                />
                                <InputError message={errors.phone} className="mt-1.5" />
                            </div>

                            <div>
                                <InputLabel htmlFor="photo" value="Photo" />
                                {data.existingPhoto && !data.photo && (
                                    <div className="mb-2">
                                        <img
                                            src={`/storage/${data.existingPhoto}`}
                                            alt="Current photo"
                                            className="w-20 h-20 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                                        />
                                    </div>
                                )}
                                <input
                                    id="photo"
                                    type="file"
                                    className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50 transition-all"
                                    onChange={(e) => setData({ ...data, photo: e.target.files[0] })}
                                    accept="image/*"
                                />
                                <InputError message={errors.photo} className="mt-1.5" />
                            </div>

                            <div>
                                <InputLabel htmlFor="age" value="Age" />
                                <TextInput
                                    id="age"
                                    type="number"
                                    min="18"
                                    max="100"
                                    className="mt-1 block w-full"
                                    value={data.age}
                                    onChange={(e) => setData({ ...data, age: e.target.value })}
                                />
                                <InputError message={errors.age} className="mt-1.5" />
                            </div>

                            <div>
                                <InputLabel htmlFor="gender" value="Gender" />
                                <select
                                    id="gender"
                                    className="mt-1 block w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 py-2.5 px-4"
                                    value={data.gender}
                                    onChange={(e) => setData({ ...data, gender: e.target.value })}
                                >
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                                <InputError message={errors.gender} className="mt-1.5" />
                            </div>

                            <div>
                                <InputLabel htmlFor="religion" value="Religion" />
                                <select
                                    id="religion"
                                    className="mt-1 block w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 py-2.5 px-4"
                                    value={data.religion}
                                    onChange={(e) => setData({ ...data, religion: e.target.value })}
                                >
                                    <option value="">Select Religion</option>
                                    <option value="sunni_nazar_niyaz">Sunni (Nazar Niyaz)</option>
                                    <option value="sunni_no_nazar_niyaz">Sunni (No Nazar Niyaz)</option>
                                    <option value="shia">Shia</option>
                                    <option value="christian">Christian</option>
                                </select>
                                <InputError message={errors.religion} className="mt-1.5" />
                            </div>
                        </div>
                    </div>

                    {/* Languages Selection */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">Languages</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Select the languages this worker speaks</p>

                        {/* Selected Languages as Tags */}
                        {selectedLanguages.length > 0 && (
                            <div className="mb-6">
                                <div className="flex flex-wrap gap-2">
                                    {selectedLanguages.map((languageId) => {
                                        const language = languages.find(l => l.id === languageId);
                                        return (
                                            <span
                                                key={languageId}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold border-2 border-blue-200 dark:border-blue-700"
                                            >
                                                <span>{language?.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedLanguages(selectedLanguages.filter(id => id !== languageId));
                                                    }}
                                                    className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-bold"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Language Options */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {languages.map((language) => (
                                <button
                                    key={language.id}
                                    type="button"
                                    onClick={() => {
                                        if (!selectedLanguages.includes(language.id)) {
                                            setSelectedLanguages([...selectedLanguages, language.id]);
                                        }
                                    }}
                                    disabled={selectedLanguages.includes(language.id)}
                                    className={`p-3 rounded-xl border-2 transition-all duration-300 text-left ${selectedLanguages.includes(language.id)
                                            ? "border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 opacity-50 cursor-not-allowed"
                                            : "border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer bg-white dark:bg-gray-700"
                                        }`}
                                >
                                    <div className="font-semibold text-gray-900 dark:text-white">{language.name}</div>
                                </button>
                            ))}
                        </div>
                        <InputError message={errors.languages} className="mt-1.5" />
                    </div>

                    {/* Service Types Selection */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">Select Service Types *</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Choose the services this worker can provide. You can select multiple.</p>

                        {/* Selected Service Types as Tags */}
                        {selectedServiceTypes.length > 0 && (
                            <div className="mb-6">
                                <div className="flex flex-wrap gap-2">
                                    {selectedServiceTypes.map((serviceType) => {
                                        const service = serviceTypes.find(st => st.value === serviceType);
                                        return (
                                            <span
                                                key={serviceType}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-semibold border-2 border-indigo-200 dark:border-indigo-700"
                                            >
                                                <span>{service?.icon}</span>
                                                <span>{service?.label}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeServiceType(serviceType)}
                                                    className="ml-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 font-bold"
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
                                    className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${selectedServiceTypes.includes(service.value)
                                            ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 opacity-50 cursor-not-allowed"
                                            : "border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer bg-white dark:bg-gray-700"
                                        }`}
                                >
                                    <div className="text-3xl mb-2">{service.icon}</div>
                                    <div className="font-semibold text-gray-900 dark:text-white">{service.label}</div>
                                </button>
                            ))}
                        </div>
                        <InputError message={errors.service_types} className="mt-1.5" />
                    </div>

                    {/* Locations Selection */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">Select Locations *</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Add locations where this worker can provide services. You can add multiple locations.</p>

                        {/* Selected Locations as Tags */}
                        {selectedLocations.length > 0 && (
                            <div className="mb-6">
                                <div className="flex flex-wrap gap-2">
                                    {selectedLocations.map((location) => (
                                        <span
                                            key={location.id}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold border-2 border-green-200 dark:border-green-700"
                                        >
                                            <span>📍</span>
                                            <span>{location.area || location.display_text}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeLocation(location.id)}
                                                className="ml-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 font-bold"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Location Search */}
                        <div className="relative" ref={locationRef}>
                            <input
                                type="text"
                                value={locationQuery}
                                onChange={(e) => setLocationQuery(e.target.value)}
                                onFocus={() => {
                                    if (locationSuggestions.length > 0) {
                                        setShowLocationSuggestions(true);
                                    }
                                }}
                                className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 shadow-sm"
                                placeholder="Search location (e.g., Karachi, Clifton or type area name)..."
                            />
                            {showLocationSuggestions && locationSuggestions.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-lg max-h-60 overflow-auto">
                                    {locationSuggestions
                                        .filter(suggestion => suggestion.id && !selectedLocations.some(loc => loc.id === suggestion.id))
                                        .map((suggestion, index) => (
                                            <div
                                                key={index}
                                                onClick={() => handleLocationSelect(suggestion)}
                                                className="px-4 py-2 hover:bg-indigo-50 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0 text-gray-900 dark:text-gray-200"
                                            >
                                                {suggestion.area || suggestion.display_text}
                                            </div>
                                        ))}
                                </div>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Type to search and select locations. Each location will be added as a tag.
                            </p>
                        </div>
                        <InputError message={errors.locations} className="mt-1.5" />
                    </div>

                    {/* Professional Details */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">Professional Details</h2>

                        <div className="grid md:grid-cols-2 gap-6 mt-6">
                            <div>
                                <InputLabel htmlFor="experience_years" value="Experience (Years) *" />
                                <TextInput
                                    id="experience_years"
                                    type="number"
                                    className="mt-1 block w-full"
                                    value={data.experience_years}
                                    onChange={(e) => setData({ ...data, experience_years: e.target.value })}
                                    required
                                    min="0"
                                />
                                <InputError message={errors.experience_years} className="mt-1.5" />
                            </div>

                            <div>
                                <InputLabel htmlFor="availability" value="Availability *" />
                                <select
                                    id="availability"
                                    className="mt-1 block w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 py-2.5 px-4"
                                    value={data.availability}
                                    onChange={(e) => setData({ ...data, availability: e.target.value })}
                                    required
                                >
                                    {availabilityOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.availability} className="mt-1.5" />
                            </div>

                            <div className="md:col-span-2">
                                <InputLabel htmlFor="skills" value="Skills" />
                                <TextInput
                                    id="skills"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.skills}
                                    onChange={(e) => setData({ ...data, skills: e.target.value })}
                                    placeholder="e.g., Cooking, Cleaning, Child Care"
                                />
                                <InputError message={errors.skills} className="mt-1.5" />
                            </div>

                            <div className="md:col-span-2">
                                <InputLabel htmlFor="bio" value="Bio / Description" />
                                <TextArea
                                    id="bio"
                                    className="mt-1 block w-full"
                                    value={data.bio}
                                    onChange={(e) => setData({ ...data, bio: e.target.value })}
                                    rows="4"
                                    placeholder="Describe the worker's experience, skills, and qualifications..."
                                />
                                <InputError message={errors.bio} className="mt-1.5" />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => navigate(route("business.workers.index"))}
                                className="px-6 py-3.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 font-bold shadow-md hover:shadow-lg"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Updating Worker...
                                    </span>
                                ) : (
                                    "Update Worker"
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}

