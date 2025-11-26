import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PublicLayout from "@/Layouts/PublicLayout";
import { businessesService } from "@/services/businesses";
import { route } from "@/utils/routes";
import api from "@/services/api";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import TextArea from "@/Components/TextArea";

export default function CreateWorker() {
    const navigate = useNavigate();
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
        email: "",
        phone: "",
        password: "",
        password_confirmation: "",
        experience_years: "",
        availability: "full_time",
        bio: "",
        skills: "",
        photo: null,
    });

    const serviceTypes = [
        { value: "maid", label: "Maid", icon: "🧹" },
        { value: "cook", label: "Cook", icon: "👨‍🍳" },
        { value: "babysitter", label: "Babysitter", icon: "👶" },
        { value: "caregiver", label: "Caregiver", icon: "👵" },
        { value: "cleaner", label: "Cleaner", icon: "✨" },
        { value: "all_rounder", label: "All Rounder", icon: "🌟" },
    ];

    const availabilityOptions = [
        { value: "full_time", label: "Full Time" },
        { value: "part_time", label: "Part Time" },
        { value: "available", label: "Available" },
    ];

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
        // Check if location already exists
        const exists = selectedLocations.some(loc => loc.id === location.id);
        if (!exists) {
            setSelectedLocations([...selectedLocations, {
                id: location.id || location.display_text,
                display_text: location.display_text,
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
        formData.append('name', data.name);
        formData.append('email', data.email);
        formData.append('phone', data.phone);
        formData.append('password', data.password);
        formData.append('password_confirmation', data.password_confirmation);
        formData.append('experience_years', data.experience_years);
        formData.append('availability', data.availability);
        formData.append('bio', data.bio);
        formData.append('skills', data.skills);

        if (data.photo) {
            formData.append('photo', data.photo);
        }

        // Add service types as array
        selectedServiceTypes.forEach((type, index) => {
            formData.append(`service_types[${index}]`, type);
        });

        // Add locations as array
        selectedLocations.forEach((location, index) => {
            formData.append(`locations[${index}][city]`, location.city);
            formData.append(`locations[${index}][area]`, location.area);
        });

        try {
            await businessesService.createWorker(formData);
            navigate(route("business.workers.index"));
        } catch (error) {
            if (error.response && error.response.data.errors) {
                setErrors(error.response.data.errors);
            } else {
                console.error("Error creating worker:", error);
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <PublicLayout>
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">Add New Worker</h1>
                    <p className="text-xl text-white/90">Add a new worker to your agency</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Information */}
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                    <InputError message={errors.name} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="email" value="Email *" />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        value={data.email}
                                        onChange={(e) => setData({ ...data, email: e.target.value })}
                                        required
                                    />
                                    <InputError message={errors.email} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="phone" value="Phone *" />
                                    <TextInput
                                        id="phone"
                                        type="tel"
                                        className="mt-1 block w-full"
                                        value={data.phone}
                                        onChange={(e) => setData({ ...data, phone: e.target.value })}
                                        required
                                    />
                                    <InputError message={errors.phone} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="photo" value="Photo" />
                                    <input
                                        id="photo"
                                        type="file"
                                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                        onChange={(e) => setData({ ...data, photo: e.target.files[0] })}
                                        accept="image/*"
                                    />
                                    <InputError message={errors.photo} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="password" value="Password *" />
                                    <TextInput
                                        id="password"
                                        type="password"
                                        className="mt-1 block w-full"
                                        value={data.password}
                                        onChange={(e) => setData({ ...data, password: e.target.value })}
                                        required
                                    />
                                    <InputError message={errors.password} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="password_confirmation" value="Confirm Password *" />
                                    <TextInput
                                        id="password_confirmation"
                                        type="password"
                                        className="mt-1 block w-full"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData({ ...data, password_confirmation: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Service Types Selection */}
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Service Types *</h2>
                            <p className="text-sm text-gray-600 mb-6">Choose the services this worker can provide. You can select multiple.</p>

                            {/* Selected Service Types as Tags */}
                            {selectedServiceTypes.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex flex-wrap gap-2">
                                        {selectedServiceTypes.map((serviceType) => {
                                            const service = serviceTypes.find(st => st.value === serviceType);
                                            return (
                                                <span
                                                    key={serviceType}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-800 rounded-full text-sm font-semibold"
                                                >
                                                    <span>{service?.icon}</span>
                                                    <span>{service?.label}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeServiceType(serviceType)}
                                                        className="ml-1 text-primary-600 hover:text-primary-800 font-bold"
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
                                        className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${selectedServiceTypes.includes(service.value)
                                                ? "border-primary-500 bg-primary-50 opacity-50 cursor-not-allowed"
                                                : "border-gray-200 hover:border-primary-300 hover:bg-primary-50 cursor-pointer"
                                            }`}
                                    >
                                        <div className="text-3xl mb-2">{service.icon}</div>
                                        <div className="font-semibold text-gray-900">{service.label}</div>
                                    </button>
                                ))}
                            </div>
                            <InputError message={errors.service_types} className="mt-2" />
                        </div>

                        {/* Locations Selection */}
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Locations *</h2>
                            <p className="text-sm text-gray-600 mb-6">Add locations where this worker can provide services. You can add multiple locations.</p>

                            {/* Selected Locations as Tags */}
                            {selectedLocations.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex flex-wrap gap-2">
                                        {selectedLocations.map((location) => (
                                            <span
                                                key={location.id}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold"
                                            >
                                                <span>📍</span>
                                                <span>{location.display_text}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeLocation(location.id)}
                                                    className="ml-1 text-green-600 hover:text-green-800 font-bold"
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
                                    className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500 px-4 py-3"
                                    placeholder="Search location (e.g., Karachi, Clifton or type area name)..."
                                />
                                {showLocationSuggestions && locationSuggestions.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                                        {locationSuggestions
                                            .filter(suggestion => !selectedLocations.some(loc => loc.id === (suggestion.id || suggestion.display_text)))
                                            .map((suggestion, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => handleLocationSelect(suggestion)}
                                                    className="px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                >
                                                    {suggestion.display_text}
                                                </div>
                                            ))}
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 mt-2">
                                    Type to search and select locations. Each location will be added as a tag.
                                </p>
                            </div>
                            <InputError message={errors.locations} className="mt-2" />
                        </div>

                        {/* Professional Details */}
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Professional Details</h2>

                            <div className="grid md:grid-cols-2 gap-6">
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
                                    <InputError message={errors.experience_years} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="availability" value="Availability *" />
                                    <select
                                        id="availability"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
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
                                    <InputError message={errors.availability} className="mt-2" />
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
                                    <InputError message={errors.skills} className="mt-2" />
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
                                    <InputError message={errors.bio} className="mt-2" />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <div className="flex items-center justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={() => navigate(route("business.workers.index"))}
                                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-300 font-semibold"
                                >
                                    Cancel
                                </button>
                                <PrimaryButton disabled={processing}>
                                    {processing ? "Adding Worker..." : "Add Worker"}
                                </PrimaryButton>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </PublicLayout>
    );
}
