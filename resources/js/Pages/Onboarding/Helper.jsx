import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import PublicLayout from "@/Layouts/PublicLayout";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import { onboardingService } from "@/services/onboarding";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";

export default function OnboardingHelper() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [offers, setOffers] = useState([{
        selectedServiceTypes: [],
        selectedLocations: [],
        work_type: "",
        monthly_rate: "",
        description: "",
    }]);

    const [locationQueries, setLocationQueries] = useState([""]);
    const [locationSuggestions, setLocationSuggestions] = useState([[]]);
    const [showLocationSuggestions, setShowLocationSuggestions] = useState([false]);
    const locationRefs = useRef([]);
    const searchTimeoutRefs = useRef([]);

    // Helper profile fields
    const [profileData, setProfileData] = useState({
        photo: null,
        nic: null,
        nic_number: "",
        experience_years: user?.experience_years || "",
        bio: user?.bio || "",
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [fieldErrors, setFieldErrors] = useState({
        serviceTypes: "",
        locations: "",
        workType: "",
        nicFileType: "",
        nicFileSize: "",
        photoFileType: "",
        photoFileSize: "",
        locationSelect: "",
    });

    // Update profile data when user loads
    useEffect(() => {
        if (user) {
            setProfileData(prev => ({
                ...prev,
                experience_years: user?.experience_years || prev.experience_years,
                bio: user?.bio || prev.bio,
            }));
        }
    }, [user]);

    const serviceTypes = [
        { value: "maid", label: "Maid", icon: "🧹" },
        { value: "cook", label: "Cook", icon: "👨‍🍳" },
        { value: "babysitter", label: "Babysitter", icon: "👶" },
        { value: "caregiver", label: "Caregiver", icon: "👵" },
        { value: "cleaner", label: "Cleaner", icon: "✨" },
        { value: "all_rounder", label: "All Rounder", icon: "🌟" },
    ];

    // Fetch location suggestions for each offer
    useEffect(() => {
        locationQueries.forEach((query, index) => {
            if (query.length >= 2) {
                if (searchTimeoutRefs.current[index]) {
                    clearTimeout(searchTimeoutRefs.current[index]);
                }
                searchTimeoutRefs.current[index] = setTimeout(() => {
                    axios
                        .get("/api/locations/search", {
                            params: { q: query },
                        })
                        .then((response) => {
                            const newSuggestions = [...locationSuggestions];
                            newSuggestions[index] = response.data;
                            setLocationSuggestions(newSuggestions);
                            const newShow = [...showLocationSuggestions];
                            newShow[index] = true;
                            setShowLocationSuggestions(newShow);
                        })
                        .catch((error) => {
                            console.error("Error fetching locations:", error);
                            const newSuggestions = [...locationSuggestions];
                            newSuggestions[index] = [];
                            setLocationSuggestions(newSuggestions);
                        });
                }, 300);
            } else {
                const newSuggestions = [...locationSuggestions];
                newSuggestions[index] = [];
                setLocationSuggestions(newSuggestions);
                const newShow = [...showLocationSuggestions];
                newShow[index] = false;
                setShowLocationSuggestions(newShow);
            }
        });
    }, [locationQueries]);

    const addOffer = () => {
        setOffers([...offers, {
            selectedServiceTypes: [],
            selectedLocations: [],
            work_type: "",
            monthly_rate: "",
            description: "",
        }]);
        setLocationQueries([...locationQueries, ""]);
        setLocationSuggestions([...locationSuggestions, []]);
        setShowLocationSuggestions([...showLocationSuggestions, false]);
    };

    const removeOffer = (index) => {
        if (offers.length > 1) {
            setOffers(offers.filter((_, i) => i !== index));
            setLocationQueries(locationQueries.filter((_, i) => i !== index));
            setLocationSuggestions(locationSuggestions.filter((_, i) => i !== index));
            setShowLocationSuggestions(showLocationSuggestions.filter((_, i) => i !== index));
        }
    };

    const updateOffer = (index, field, value) => {
        const newOffers = [...offers];
        newOffers[index][field] = value;
        setOffers(newOffers);
    };

    const addServiceTypeToOffer = (offerIndex, serviceType) => {
        const newOffers = [...offers];
        if (!newOffers[offerIndex].selectedServiceTypes.includes(serviceType)) {
            newOffers[offerIndex].selectedServiceTypes.push(serviceType);
            setOffers(newOffers);
        }
    };

    const removeServiceTypeFromOffer = (offerIndex, serviceType) => {
        const newOffers = [...offers];
        newOffers[offerIndex].selectedServiceTypes = newOffers[offerIndex].selectedServiceTypes.filter(st => st !== serviceType);
        setOffers(newOffers);
    };

    const handleLocationSelect = (location, offerIndex) => {
        // Only allow selection if location has an id (actual location from database)
        if (!location.id) {
            setFieldErrors(prev => ({ ...prev, locationSelect: "Please select a specific location (area) from the list, not just a city." }));
            setTimeout(() => setFieldErrors(prev => ({ ...prev, locationSelect: "" })), 5000);
            return;
        }
        // Clear error when valid location is selected
        setFieldErrors(prev => ({ ...prev, locationSelect: "" }));
        // Check if location already exists
        const newOffers = [...offers];
        const exists = newOffers[offerIndex].selectedLocations.some(loc => loc.id === location.id);
        if (!exists) {
            newOffers[offerIndex].selectedLocations.push({
                id: location.id,
                display_text: location.display_text,
                city_name: location.city_name,
                area: location.area || "",
            });
            setOffers(newOffers);
        }
        const newQueries = [...locationQueries];
        newQueries[offerIndex] = "";
        setLocationQueries(newQueries);
        const newShow = [...showLocationSuggestions];
        newShow[offerIndex] = false;
        setShowLocationSuggestions(newShow);
    };

    const removeLocationFromOffer = (offerIndex, locationId) => {
        const newOffers = [...offers];
        newOffers[offerIndex].selectedLocations = newOffers[offerIndex].selectedLocations.filter(loc => loc.id !== locationId);
        setOffers(newOffers);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            locationRefs.current.forEach((ref, index) => {
                if (ref && !ref.contains(event.target)) {
                    const newShow = [...showLocationSuggestions];
                    newShow[index] = false;
                    setShowLocationSuggestions(newShow);
                }
            });
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
        
        // Get the first offer (we'll simplify to single offer structure)
        const offer = offers[0];
        
        // Validate
        const validationErrors = {};
        if (!offer.selectedServiceTypes.length) {
            validationErrors.serviceTypes = "Please select at least one service type.";
        }
        if (!offer.selectedLocations.length) {
            validationErrors.locations = "Please select at least one location.";
        }
        if (!offer.work_type) {
            validationErrors.workType = "Please select a work type.";
        }

        if (Object.keys(validationErrors).length > 0) {
            setFieldErrors(prev => ({ ...prev, ...validationErrors }));
            setProcessing(false);
            // Scroll to first error
            setTimeout(() => {
                const firstErrorElement = document.querySelector('[data-error-field]');
                if (firstErrorElement) {
                    firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
            return;
        }

        // Clear validation errors
        setFieldErrors({
            serviceTypes: "",
            locations: "",
            workType: "",
            nicFileType: "",
            nicFileSize: "",
            photoFileType: "",
            photoFileSize: "",
            locationSelect: "",
        });

        // Prepare data in the expected format
        const services = offer.selectedServiceTypes; // Array of strings
        const locations = offer.selectedLocations.map(loc => loc.id); // Array of location IDs
        const work_type = offer.work_type;
        const monthly_rate = offer.monthly_rate ? parseFloat(offer.monthly_rate) : null;
        const description = offer.description || null;

        // Prepare FormData for file uploads
        const formData = new FormData();
        formData.append("services", JSON.stringify(services));
        formData.append("locations", JSON.stringify(locations));
        formData.append("work_type", work_type);
        if (monthly_rate !== null) {
            formData.append("monthly_rate", monthly_rate);
        }
        if (description) {
            formData.append("description", description);
        }
        formData.append("experience_years", profileData.experience_years || "");
        formData.append("bio", profileData.bio || "");
        formData.append("nic_number", profileData.nic_number || "");
        
        if (profileData.photo) {
            formData.append("photo", profileData.photo);
        }
        if (profileData.nic) {
            formData.append("nic", profileData.nic);
        }

        try {
            await onboardingService.completeHelper(formData);
            // Redirect to home page on success
            navigate(route("home"));
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ submit: [error.response?.data?.message || "Failed to complete onboarding"] });
            }
        } finally {
            setProcessing(false);
        }
    };

    // NIC Dropzone Component
    const NICDropzone = ({ onFileAccepted, file, error }) => {
        const fileInputId = `nic-file-input-${Math.random().toString(36).substr(2, 9)}`;
        const [isDragActive, setIsDragActive] = useState(false);

        const handleFileChange = (e) => {
            const selectedFile = e.target.files?.[0];
            if (selectedFile) {
                // Validate file type
                const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
                if (!validTypes.includes(selectedFile.type)) {
                    setFieldErrors(prev => ({ ...prev, nicFileType: "Invalid file type. Please upload JPG, PNG, or PDF." }));
                    e.target.value = ""; // Reset input
                    setTimeout(() => setFieldErrors(prev => ({ ...prev, nicFileType: "" })), 5000);
                    return;
                }
                // Validate file size (5MB)
                if (selectedFile.size > 5 * 1024 * 1024) {
                    setFieldErrors(prev => ({ ...prev, nicFileSize: "File size exceeds 5MB limit." }));
                    e.target.value = ""; // Reset input
                    setTimeout(() => setFieldErrors(prev => ({ ...prev, nicFileSize: "" })), 5000);
                    return;
                }
                // Clear errors on successful file selection
                setFieldErrors(prev => ({ ...prev, nicFileType: "", nicFileSize: "" }));
                onFileAccepted(selectedFile);
            }
        };

        const handleDragOver = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragActive(true);
        };

        const handleDragLeave = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragActive(false);
        };

        const handleDrop = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragActive(false);
            
            const droppedFile = e.dataTransfer.files?.[0];
            if (droppedFile) {
                // Validate file type
                const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
                if (!validTypes.includes(droppedFile.type)) {
                    setFieldErrors(prev => ({ ...prev, nicFileType: "Invalid file type. Please upload JPG, PNG, or PDF." }));
                    setTimeout(() => setFieldErrors(prev => ({ ...prev, nicFileType: "" })), 5000);
                    return;
                }
                // Validate file size (5MB)
                if (droppedFile.size > 5 * 1024 * 1024) {
                    setFieldErrors(prev => ({ ...prev, nicFileSize: "File size exceeds 5MB limit." }));
                    setTimeout(() => setFieldErrors(prev => ({ ...prev, nicFileSize: "" })), 5000);
                    return;
                }
                // Clear errors on successful file selection
                setFieldErrors(prev => ({ ...prev, nicFileType: "", nicFileSize: "" }));
                onFileAccepted(droppedFile);
            }
        };

        return (
            <div>
                <input
                    id={fileInputId}
                    type="file"
                    accept=".jpeg,.jpg,.png,.pdf"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                />
                <label
                    htmlFor={fileInputId}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors block ${
                        isDragActive
                            ? "border-primary-500 bg-primary-50"
                            : error
                            ? "border-red-300 bg-red-50"
                            : "border-gray-300 hover:border-primary-400 hover:bg-gray-50"
                    }`}
                >
                    <div className="space-y-2">
                        <div className="text-4xl mb-2">📄</div>
                        {file ? (
                            <div>
                                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm font-medium text-gray-700">
                                    {isDragActive ? "Drop the file here" : "Click or drag to upload NIC"}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Supports: JPG, PNG, PDF (Max 5MB)
                                </p>
                            </>
                        )}
                    </div>
                </label>
                {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
            </div>
        );
    };

    // Photo Dropzone Component
    const PhotoDropzone = ({ onFileAccepted, file, error }) => {
        const fileInputId = `photo-file-input-${Math.random().toString(36).substr(2, 9)}`;
        const [isDragActive, setIsDragActive] = useState(false);

        const handleFileChange = (e) => {
            const selectedFile = e.target.files?.[0];
            if (selectedFile) {
                // Validate file type
                const validTypes = ["image/jpeg", "image/jpg", "image/png"];
                if (!validTypes.includes(selectedFile.type)) {
                    setFieldErrors(prev => ({ ...prev, photoFileType: "Invalid file type. Please upload JPG or PNG." }));
                    e.target.value = ""; // Reset input
                    setTimeout(() => setFieldErrors(prev => ({ ...prev, photoFileType: "" })), 5000);
                    return;
                }
                // Validate file size (2MB)
                if (selectedFile.size > 2 * 1024 * 1024) {
                    setFieldErrors(prev => ({ ...prev, photoFileSize: "File size exceeds 2MB limit." }));
                    e.target.value = ""; // Reset input
                    setTimeout(() => setFieldErrors(prev => ({ ...prev, photoFileSize: "" })), 5000);
                    return;
                }
                // Clear errors on successful file selection
                setFieldErrors(prev => ({ ...prev, photoFileType: "", photoFileSize: "" }));
                onFileAccepted(selectedFile);
            }
        };

        const handleDragOver = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragActive(true);
        };

        const handleDragLeave = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragActive(false);
        };

        const handleDrop = (e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragActive(false);
            
            const droppedFile = e.dataTransfer.files?.[0];
            if (droppedFile) {
                // Validate file type
                const validTypes = ["image/jpeg", "image/jpg", "image/png"];
                if (!validTypes.includes(droppedFile.type)) {
                    setFieldErrors(prev => ({ ...prev, photoFileType: "Invalid file type. Please upload JPG or PNG." }));
                    setTimeout(() => setFieldErrors(prev => ({ ...prev, photoFileType: "" })), 5000);
                    return;
                }
                // Validate file size (2MB)
                if (droppedFile.size > 2 * 1024 * 1024) {
                    setFieldErrors(prev => ({ ...prev, photoFileSize: "File size exceeds 2MB limit." }));
                    setTimeout(() => setFieldErrors(prev => ({ ...prev, photoFileSize: "" })), 5000);
                    return;
                }
                // Clear errors on successful file selection
                setFieldErrors(prev => ({ ...prev, photoFileType: "", photoFileSize: "" }));
                onFileAccepted(droppedFile);
            }
        };

        return (
            <div>
                <input
                    id={fileInputId}
                    type="file"
                    accept=".jpeg,.jpg,.png"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                />
                <label
                    htmlFor={fileInputId}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors block ${
                        isDragActive
                            ? "border-primary-500 bg-primary-50"
                            : error
                            ? "border-red-300 bg-red-50"
                            : "border-gray-300 hover:border-primary-400 hover:bg-gray-50"
                    }`}
                >
                    <div className="space-y-2">
                        <div className="text-4xl mb-2">📷</div>
                        {file ? (
                            <div>
                                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm font-medium text-gray-700">
                                    {isDragActive ? "Drop the photo here" : "Click or drag to upload photo"}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Supports: JPG, PNG (Max 2MB)
                                </p>
                            </>
                        )}
                    </div>
                </label>
                {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
            </div>
        );
    };

    return (
        <PublicLayout>
            
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">Complete Your Helper Profile</h1>
                    <p className="text-xl text-white/90">Tell us about the services you offer</p>
                </div>
            </div>
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={submit} className="space-y-8">
                        {offers.map((offer, offerIndex) => (
                            <div key={offerIndex} className="bg-white rounded-lg shadow-md p-8 border-2 border-primary-200">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Service Offer {offerIndex + 1}</h2>
                                    {offers.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeOffer(offerIndex)}
                                            className="text-red-600 hover:text-red-800 font-bold px-4 py-2 border border-red-300 rounded-lg hover:bg-red-50"
                                        >
                                            Remove Offer
                                        </button>
                                    )}
                                </div>

                                {/* Service Types Selection */}
                                <div className="mb-8" data-error-field={fieldErrors.serviceTypes ? "true" : undefined}>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Select Service Types *</h3>
                                    <p className="text-sm text-gray-600 mb-4">Choose the services for this offer. You can select multiple.</p>
                                    {fieldErrors.serviceTypes && (
                                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-sm text-red-600">{fieldErrors.serviceTypes}</p>
                                        </div>
                                    )}
                                    
                                    {/* Selected Service Types as Tags */}
                                    {offer.selectedServiceTypes.length > 0 && (
                                        <div className="mb-4">
                                            <div className="flex flex-wrap gap-2">
                                                {offer.selectedServiceTypes.map((serviceType) => {
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
                                                                onClick={() => removeServiceTypeFromOffer(offerIndex, serviceType)}
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
                                                onClick={() => addServiceTypeToOffer(offerIndex, service.value)}
                                                disabled={offer.selectedServiceTypes.includes(service.value)}
                                                className={`p-4 rounded-lg border-2 transition-all duration-300 text-left ${
                                                    offer.selectedServiceTypes.includes(service.value)
                                                        ? "border-primary-500 bg-primary-50 opacity-50 cursor-not-allowed"
                                                        : "border-gray-200 hover:border-primary-300 hover:bg-primary-50 cursor-pointer"
                                                }`}
                                            >
                                                <div className="text-3xl mb-2">{service.icon}</div>
                                                <div className="font-semibold text-gray-900">{service.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Locations Selection */}
                                <div className="mb-8" data-error-field={fieldErrors.locations || fieldErrors.locationSelect ? "true" : undefined}>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Select Locations *</h3>
                                    <p className="text-sm text-gray-600 mb-4">Add locations for this offer. You can add multiple locations.</p>
                                    {fieldErrors.locations && (
                                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-sm text-red-600">{fieldErrors.locations}</p>
                                        </div>
                                    )}
                                    {fieldErrors.locationSelect && (
                                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-sm text-red-600">{fieldErrors.locationSelect}</p>
                                        </div>
                                    )}
                                    
                                    {/* Selected Locations as Tags */}
                                    {offer.selectedLocations.length > 0 && (
                                        <div className="mb-4">
                                            <div className="flex flex-wrap gap-2">
                                                {offer.selectedLocations.map((location) => (
                                                    <span
                                                        key={location.id}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold"
                                                    >
                                                        <span>📍</span>
                                                        <span>{location.display_text}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeLocationFromOffer(offerIndex, location.id)}
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
                                    <div className="relative" ref={el => locationRefs.current[offerIndex] = el}>
                                        <input
                                            type="text"
                                            value={locationQueries[offerIndex]}
                                            onChange={(e) => {
                                                const newQueries = [...locationQueries];
                                                newQueries[offerIndex] = e.target.value;
                                                setLocationQueries(newQueries);
                                            }}
                                            onFocus={() => {
                                                if (locationSuggestions[offerIndex]?.length > 0) {
                                                    const newShow = [...showLocationSuggestions];
                                                    newShow[offerIndex] = true;
                                                    setShowLocationSuggestions(newShow);
                                                }
                                            }}
                                            className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500 px-4 py-3"
                                            placeholder="Search location (e.g., Karachi, Clifton or type area name)..."
                                        />
                                        {showLocationSuggestions[offerIndex] && locationSuggestions[offerIndex]?.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                                                {locationSuggestions[offerIndex]
                                                    ?.filter(suggestion => suggestion.id && !offer.selectedLocations.some(loc => loc.id === suggestion.id))
                                                    .map((suggestion, idx) => (
                                                        <div
                                                            key={idx}
                                                            onClick={() => handleLocationSelect(suggestion, offerIndex)}
                                                            className="px-4 py-2 hover:bg-primary-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                        >
                                                            {suggestion.display_text}
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Offer Details */}
                                <div className="grid md:grid-cols-2 gap-6 mb-6">
                                    <div data-error-field={fieldErrors.workType ? "true" : undefined}>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Work Type *</label>
                                        <select
                                            value={offer.work_type}
                                            onChange={(e) => {
                                                updateOffer(offerIndex, "work_type", e.target.value);
                                                if (e.target.value) {
                                                    setFieldErrors(prev => ({ ...prev, workType: "" }));
                                                }
                                            }}
                                            className={`w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500 ${
                                                fieldErrors.workType ? "border-red-300" : ""
                                            }`}
                                            required
                                        >
                                            <option value="">Select Type</option>
                                            <option value="full_time">Full Time</option>
                                            <option value="part_time">Part Time</option>
                                        </select>
                                        {fieldErrors.workType && (
                                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                                                <p className="text-sm text-red-600">{fieldErrors.workType}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Rate (PKR)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={offer.monthly_rate}
                                            onChange={(e) => updateOffer(offerIndex, "monthly_rate", e.target.value)}
                                            className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                            placeholder="e.g., 15000"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                        <textarea
                                            value={offer.description}
                                            onChange={(e) => updateOffer(offerIndex, "description", e.target.value)}
                                            rows={4}
                                            className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                            placeholder="Describe this service offer..."
                                        />
                                    </div>
                                </div>

                                {/* Preview for this offer */}
                                {offer.selectedServiceTypes.length > 0 && offer.selectedLocations.length > 0 && offer.work_type && (
                                    <div className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
                                        <p className="text-sm font-semibold text-primary-900 mb-2">
                                            This offer will create 1 service listing with:
                                        </p>
                                        <div className="text-xs text-primary-700 space-y-1">
                                            <div>
                                                <span className="font-semibold">{offer.selectedServiceTypes.length}</span> service type(s): {offer.selectedServiceTypes.map((st) => {
                                                    const service = serviceTypes.find(s => s.value === st);
                                                    return service?.label;
                                                }).join(", ")}
                                            </div>
                                            <div>
                                                <span className="font-semibold">{offer.selectedLocations.length}</span> location(s): {offer.selectedLocations.map(loc => loc.display_text).join(", ")}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Add Another Offer Button */}
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <button
                                type="button"
                                onClick={addOffer}
                                className="w-full border-2 border-dashed border-primary-300 text-primary-600 py-4 rounded-lg hover:bg-primary-50 transition font-semibold"
                            >
                                + Add Another Service Offer
                            </button>
                        </div>

                        {/* Profile Verification Section */}
                        <div className="bg-white rounded-lg shadow-md p-8 border-2 border-primary-200">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Verification</h2>
                            <p className="text-sm text-gray-600 mb-6">Please upload your documents for verification</p>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        National Identity Card (NIC) <span className="text-red-500">*</span>
                                    </label>
                                    <p className="text-xs text-gray-500 mb-2">Upload a clear photo or scan of your NIC (front and back if needed)</p>
                                    <NICDropzone
                                        onFileAccepted={(file) => {
                                            setProfileData({ ...profileData, nic: file });
                                            setFieldErrors(prev => ({ ...prev, nicFileType: "", nicFileSize: "" }));
                                        }}
                                        file={profileData.nic}
                                        error={errors.nic || fieldErrors.nicFileType || fieldErrors.nicFileSize}
                                    />
                                    {(fieldErrors.nicFileType || fieldErrors.nicFileSize) && (
                                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-sm text-red-600">{fieldErrors.nicFileType || fieldErrors.nicFileSize}</p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        NIC Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={profileData.nic_number}
                                        onChange={(e) => setProfileData({ ...profileData, nic_number: e.target.value })}
                                        className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                        placeholder="e.g., 42101-1234567-1"
                                        required
                                    />
                                    {errors.nic_number && <div className="text-red-500 text-sm mt-1">{errors.nic_number}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Photo (Optional)
                                    </label>
                                    <p className="text-xs text-gray-500 mb-2">Upload your profile photo (optional)</p>
                                    <PhotoDropzone
                                        onFileAccepted={(file) => {
                                            setProfileData({ ...profileData, photo: file });
                                            setFieldErrors(prev => ({ ...prev, photoFileType: "", photoFileSize: "" }));
                                        }}
                                        file={profileData.photo}
                                        error={errors.photo || fieldErrors.photoFileType || fieldErrors.photoFileSize}
                                    />
                                    {(fieldErrors.photoFileType || fieldErrors.photoFileSize) && (
                                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-sm text-red-600">{fieldErrors.photoFileType || fieldErrors.photoFileSize}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Helper Profile Section */}
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Profile</h2>
                            <p className="text-sm text-gray-600 mb-6">Optional: Add more details about yourself</p>

                            <div className="space-y-6">

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={profileData.experience_years}
                                        onChange={(e) => setProfileData({ ...profileData, experience_years: e.target.value })}
                                        className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                        placeholder="e.g., 5"
                                    />
                                    {errors.experience_years && <div className="text-red-500 text-sm mt-1">{errors.experience_years}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                                    <textarea
                                        value={profileData.bio}
                                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                        rows={4}
                                        className="w-full border-gray-300 rounded-lg focus:border-primary-500 focus:ring-primary-500"
                                        placeholder="Tell us about yourself..."
                                    />
                                    {errors.bio && <div className="text-red-500 text-sm mt-1">{errors.bio}</div>}
                                </div>
                            </div>
                        </div>

                        {/* General Error Message */}
                        {errors.submit && (
                            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-red-800">
                                            {Array.isArray(errors.submit) ? errors.submit[0] : errors.submit}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition duration-300 font-semibold disabled:opacity-50"
                            >
                                {processing ? "Completing Profile..." : "Complete Profile"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </PublicLayout>
    );
}
