import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { businessesService } from "@/services/businesses";
import { route } from "@/utils/routes";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import TextArea from "@/Components/TextArea";
import { useServiceTypes } from "@/hooks/useServiceTypes";
import { useLanguages } from "@/hooks/useLanguages";
import toast from "react-hot-toast";

export default function EditWorker() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [selectedServiceTypes, setSelectedServiceTypes] = useState([]);

    // Pin Location State
    const [locationData, setLocationData] = useState({
        pin_address: "",
        pin_latitude: "",
        pin_longitude: ""
    });
    const [gettingLocation, setGettingLocation] = useState(false);
    const pinAddressInputRef = useRef(null);
    const autocompleteRef = useRef(null);

    const [data, setData] = useState({
        name: "",
        phone: "",
        age: "",
        gender: "",
        religion: "",
        experience_years: "",
        availability: "full_time",
        bio: "",
        photo: null,
        existingPhoto: null,
        monthly_rate: "",
    });
    const [selectedLanguages, setSelectedLanguages] = useState([]);
    const [photoPreview, setPhotoPreview] = useState(null);

    // Photo Preview Handler
    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData({ ...data, photo: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Fetch service types and languages from API
    const { serviceTypes, loading: serviceTypesLoading } = useServiceTypes();
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
                            religion: typeof worker.religion === "object" ? worker.religion?.value : (worker.religion || ""),
                            experience_years: worker.experience_years || "",
                            availability: worker.availability || "full_time",
                            bio: worker.bio || "",
                            photo: null,
                            existingPhoto: worker.photo || null,
                            monthly_rate: worker.service_listings?.[0]?.monthly_rate || "",
                        });

                        // Load languages
                        if (worker.languages && Array.isArray(worker.languages)) {
                            setSelectedLanguages(worker.languages.map(l => l.id));
                        }

                        // Load service types from service listings
                        if (worker.service_listings && worker.service_listings.length > 0) {
                            const allServiceTypeIds = new Set();
                            worker.service_listings.forEach(listing => {
                                if (listing.service_types && Array.isArray(listing.service_types)) {
                                    listing.service_types.forEach(st => {
                                        // Service types can come as objects with id, or as integers
                                        if (typeof st === "object" && st.id) {
                                            allServiceTypeIds.add(st.id);
                                        } else if (typeof st === "number") {
                                            allServiceTypeIds.add(st);
                                        }
                                    });
                                }
                            });
                            setSelectedServiceTypes(Array.from(allServiceTypeIds));

                            // Load pin location from profile
                            if (worker.profile) {
                                setLocationData({
                                    pin_address: worker.profile.pin_address || "",
                                    pin_latitude: worker.profile.pin_latitude || "",
                                    pin_longitude: worker.profile.pin_longitude || ""
                                });
                            }
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

    // Google Places Autocomplete Effect
    useEffect(() => {
        if (pinAddressInputRef.current && window.google && window.google.maps && window.google.maps.places) {
            try {
                const autocomplete = new window.google.maps.places.Autocomplete(
                    pinAddressInputRef.current,
                    {
                        componentRestrictions: { country: "pk" },
                        fields: ["formatted_address", "geometry", "name"],
                        types: ["address"]
                    }
                );

                autocompleteRef.current = autocomplete;

                autocomplete.addListener("place_changed", () => {
                    const place = autocomplete.getPlace();
                    if (place.formatted_address) {
                        const lat = place.geometry?.location?.lat();
                        const lng = place.geometry?.location?.lng();
                        setLocationData({
                            pin_address: place.formatted_address,
                            pin_latitude: lat ? lat.toString() : "",
                            pin_longitude: lng ? lng.toString() : ""
                        });
                    }
                });

                return () => {
                    if (autocompleteRef.current) {
                        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
                    }
                };
            } catch (error) {
                console.error("Error initializing Google Places Autocomplete:", error);
            }
        }
    }, [loading]); // Re-init when loading completes

    // Get Current Location Handler
    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            setErrors({ ...errors, pin_address: "Geolocation is not supported by your browser." });
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocationData(prev => ({ ...prev, pin_latitude: latitude, pin_longitude: longitude }));

                if (window.google && window.google.maps && window.google.maps.Geocoder) {
                    const geocoder = new window.google.maps.Geocoder();
                    geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
                        if (status === "OK" && results[0]) {
                            setLocationData(prev => ({
                                ...prev,
                                pin_address: results[0].formatted_address,
                                pin_latitude: latitude,
                                pin_longitude: longitude
                            }));
                            if (pinAddressInputRef.current) {
                                pinAddressInputRef.current.value = results[0].formatted_address;
                            }
                        } else {
                            setLocationData(prev => ({ ...prev, pin_address: `${latitude}, ${longitude}` }));
                            if (pinAddressInputRef.current) {
                                pinAddressInputRef.current.value = `${latitude}, ${longitude}`;
                            }
                        }
                        setGettingLocation(false);
                    });
                } else {
                    setLocationData(prev => ({ ...prev, pin_address: `${latitude}, ${longitude}` }));
                    if (pinAddressInputRef.current) {
                        pinAddressInputRef.current.value = `${latitude}, ${longitude}`;
                    }
                    setGettingLocation(false);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                setErrors({ ...errors, pin_address: "Unable to retrieve your location" });
                setGettingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const removeServiceType = (serviceType) => {
        setSelectedServiceTypes(selectedServiceTypes.filter(st => st !== serviceType));
    };

    const addServiceType = (serviceType) => {
        if (!selectedServiceTypes.includes(serviceType)) {
            setSelectedServiceTypes([...selectedServiceTypes, serviceType]);
        }
    };

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

        if (!locationData.pin_address) {
            setErrors({ pin_address: "Please select a location." });
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
        // Always send bio, even if empty (Laravel nullable handles empty strings)
        formData.append("bio", data.bio || "");
        if (data.monthly_rate) formData.append("monthly_rate", data.monthly_rate);

        if (data.photo) {
            formData.append("photo", data.photo);
        }

        // Add service types as array
        selectedServiceTypes.forEach((type, index) => {
            formData.append(`service_types[${index}]`, type);
        });

        // Add pin location
        formData.append("pin_address", locationData.pin_address);
        if (locationData.pin_latitude) formData.append("pin_latitude", locationData.pin_latitude);
        if (locationData.pin_longitude) formData.append("pin_longitude", locationData.pin_longitude);

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
            toast.success("Worker updated successfully!");
            navigate(route("business.workers.index"));
        } catch (error) {
            if (error.response && error.response.data.errors) {
                setErrors(error.response.data.errors);
            } else {
                toast.error(error.response?.data?.message || "Failed to update worker");
                setErrors({ submit: [error.response?.data?.message || "Failed to update worker"] });
            }
        } finally {
            setProcessing(false);
        }
    };

    if (loading || serviceTypesLoading) {
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
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="relative w-24 h-24">
                                        {photoPreview ? (
                                            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover rounded-full border-4 border-indigo-100 dark:border-indigo-900" />
                                        ) : data.existingPhoto ? (
                                            <img src={`/storage/${data.existingPhoto}`} alt="Current photo" className="w-full h-full object-cover rounded-full border-4 border-gray-200 dark:border-gray-700" />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                                                <span className="text-3xl">📷</span>
                                            </div>
                                        )}
                                        <label htmlFor="photo" className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 shadow-lg transition-all">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                            <input id="photo" type="file" className="hidden" onChange={handlePhotoChange} accept="image/*" />
                                        </label>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Upload a new photo to replace the current one.</p>
                                    </div>
                                </div>
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
                                    {selectedServiceTypes.map((serviceTypeId) => {
                                        const service = serviceTypes.find(st => st.id === serviceTypeId);
                                        return (
                                            <span
                                                key={serviceTypeId}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-semibold border-2 border-indigo-200 dark:border-indigo-700"
                                            >
                                                <span>{service?.icon}</span>
                                                <span>{service?.label}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeServiceType(serviceTypeId)}
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
                                    key={service.id}
                                    type="button"
                                    onClick={() => addServiceType(service.id)}
                                    disabled={selectedServiceTypes.includes(service.id)}
                                    className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${selectedServiceTypes.includes(service.id)
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

                    {/* Location (Pin Address) */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">Location *</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Set the worker's service location using Google Places or your current location.</p>

                        <div className="relative">
                            <InputLabel htmlFor="pin_address" value="Pin Address" />
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">📍</span>
                                </div>

                                <input
                                    ref={pinAddressInputRef}
                                    type="text"
                                    id="pin_address"
                                    className="block w-full pl-10 pr-12 border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-3 bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                                    placeholder="Use the location button..."
                                    value={locationData.pin_address}
                                    onChange={(e) => setLocationData({ ...locationData, pin_address: e.target.value })}
                                    readOnly={false}
                                />

                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <button
                                        type="button"
                                        onClick={handleGetCurrentLocation}
                                        disabled={gettingLocation}
                                        className="p-2 rounded-full text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 focus:outline-none transition-colors"
                                        title="Use current location"
                                    >
                                        {gettingLocation ? (
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                            {gettingLocation && <p className="text-xs text-indigo-500 mt-1">Getting current location...</p>}
                            <InputError message={errors.pin_address} className="mt-1.5" />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Start typing to search for an address, or click the location icon to use your current location.
                            </p>
                        </div>
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

                            <div>
                                <InputLabel htmlFor="monthly_rate" value="Monthly Rate (PKR)" />
                                <TextInput
                                    id="monthly_rate"
                                    type="number"
                                    className="mt-1 block w-full"
                                    value={data.monthly_rate}
                                    onChange={(e) => setData({ ...data, monthly_rate: e.target.value })}
                                    placeholder="e.g. 25000"
                                    min="0"
                                />
                                <InputError message={errors.monthly_rate} className="mt-1.5" />
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

