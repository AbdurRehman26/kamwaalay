import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import PublicLayout from "@/Layouts/PublicLayout";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import { onboardingService } from "@/services/onboarding";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";
import { useServiceTypes } from "@/hooks/useServiceTypes";

export default function OnboardingBusiness() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 2;

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

    // Business profile fields
    const [profileData, setProfileData] = useState({
        nic: null,
        nic_number: "",
        bio: user?.bio || "",
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [fileError, setFileError] = useState(null);

    // Fetch service types from API
    const { serviceTypes, loading: serviceTypesLoading } = useServiceTypes();


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
            alert("Please select a specific location (area) from the list, not just a city.");
            return;
        }
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

    const validateStep = (step) => {
        if (step === 1) {
            const validOffers = offers.filter(offer =>
                offer.selectedServiceTypes.length > 0 &&
                offer.selectedLocations.length > 0 &&
                offer.work_type
            );
            if (validOffers.length === 0) {
                alert("Please add at least one complete offer with service types, locations, and work type.");
                return false;
            }
            return true;
        }
        // Steps 2 and 3 are optional/skippable
        return true;
    };

    const saveServiceListing = async () => {
        // Validate all offers
        const validOffers = offers.filter(offer =>
            offer.selectedServiceTypes.length > 0 &&
            offer.selectedLocations.length > 0 &&
            offer.work_type
        );

        if (validOffers.length === 0) {
            alert("Please add at least one complete offer with service types, locations, and work type.");
            return false;
        }

        // Collect all unique service types from all offers
        const allServiceTypes = new Set();
        validOffers.forEach(offer => {
            offer.selectedServiceTypes.forEach(serviceType => {
                allServiceTypes.add(serviceType);
            });
        });

        // Collect all unique location IDs from all offers
        const allLocationIds = new Set();
        validOffers.forEach(offer => {
            offer.selectedLocations.forEach(location => {
                allLocationIds.add(location.id);
            });
        });

        // Use the first offer's work_type, monthly_rate, and description
        // (Backend expects a single work_type for all services)
        const firstOffer = validOffers[0];

        // Prepare FormData for service listing (without verification documents)
        const formData = new FormData();
        formData.append("services", JSON.stringify(Array.from(allServiceTypes)));
        formData.append("locations", JSON.stringify(Array.from(allLocationIds)));
        formData.append("work_type", firstOffer.work_type);
        if (firstOffer.monthly_rate) {
            formData.append("monthly_rate", firstOffer.monthly_rate);
        }
        if (firstOffer.description) {
            formData.append("description", firstOffer.description);
        }
        if (profileData.bio) {
            formData.append("bio", profileData.bio);
        }
        // Don't include NIC on step 1 - it's optional

        try {
            await onboardingService.completeBusiness(formData);
            return true;
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ submit: [error.response?.data?.message || "Failed to save service listing"] });
            }
            return false;
        }
    };

    const handleNext = async () => {
        if (currentStep === 1) {
            // Validate and save service listing on step 1
            if (!validateStep(1)) {
                return;
            }
            setProcessing(true);
            const saved = await saveServiceListing();
            setProcessing(false);
            if (saved) {
                setCurrentStep(2);
            }
        } else if (currentStep < totalSteps) {
            // Steps 2 and 3 can be skipped, just move to next step
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        if (currentStep === 2) {
            // Skip verification documents and complete onboarding
            submit(new Event("submit"));
        }
    };

    const submit = async (e) => {
        e.preventDefault();

        // If on step 1, save service listing
        if (currentStep === 1) {
            await handleNext();
            return;
        }

        // Final submission on step 2 - update with verification documents if provided
        setProcessing(true);
        setErrors({});

        // Validate all offers (should already be saved from step 1, but validate again)
        const validOffers = offers.filter(offer =>
            offer.selectedServiceTypes.length > 0 &&
            offer.selectedLocations.length > 0 &&
            offer.work_type
        );

        if (validOffers.length === 0) {
            alert("Please add at least one complete offer with service types, locations, and work type.");
            setProcessing(false);
            return;
        }

        // Collect all unique service types from all offers
        const allServiceTypes = new Set();
        validOffers.forEach(offer => {
            offer.selectedServiceTypes.forEach(serviceType => {
                allServiceTypes.add(serviceType);
            });
        });

        // Collect all unique location IDs from all offers
        const allLocationIds = new Set();
        validOffers.forEach(offer => {
            offer.selectedLocations.forEach(location => {
                allLocationIds.add(location.id);
            });
        });

        // Use the first offer's work_type, monthly_rate, and description
        const firstOffer = validOffers[0];

        // Prepare FormData for final submission (with optional verification documents and profile updates)
        const formData = new FormData();
        formData.append("services", JSON.stringify(Array.from(allServiceTypes)));
        formData.append("locations", JSON.stringify(Array.from(allLocationIds)));
        formData.append("work_type", firstOffer.work_type);
        if (firstOffer.monthly_rate) {
            formData.append("monthly_rate", firstOffer.monthly_rate);
        }
        if (firstOffer.description) {
            formData.append("description", firstOffer.description);
        }
        if (profileData.bio) {
            formData.append("bio", profileData.bio);
        }
        formData.append("nic_number", profileData.nic_number || "");

        // Add verification documents if provided (optional)
        if (profileData.nic) {
            formData.append("nic", profileData.nic);
        }

        try {
            await onboardingService.completeBusiness(formData);
            // Redirect to dashboard on success
            navigate(route("dashboard"));
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
        const { getRootProps, getInputProps, isDragActive } = useDropzone({
            accept: {
                "image/*": [".jpeg", ".jpg", ".png"],
                "application/pdf": [".pdf"]
            },
            maxFiles: 1,
            maxSize: 5 * 1024 * 1024, // 5MB
            noClick: false,
            noKeyboard: false,
            onDropAccepted: (acceptedFiles) => {
                setFileError(null);
                if (acceptedFiles && acceptedFiles.length > 0) {
                    const file = acceptedFiles[0];
                    onFileAccepted(file);
                }
            },
            onDropRejected: (rejectedFiles) => {
                if (rejectedFiles && rejectedFiles.length > 0) {
                    const rejection = rejectedFiles[0];
                    if (rejection.errors) {
                        const errorMessages = rejection.errors.map(err => {
                            if (err.code === "file-too-large") {
                                return "File is too large. Maximum size is 5MB.";
                            } else if (err.code === "file-invalid-type") {
                                return "Invalid file type. Please upload JPG, PNG, or PDF.";
                            } else if (err.code === "too-many-files") {
                                return "Only one file is allowed.";
                            }
                            return err.message;
                        });
                        setFileError(errorMessages[0]);
                    }
                }
            },
        });

        return (
            <div>
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${isDragActive
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                        : error
                            ? "border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                            : "border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                >
                    <input {...getInputProps()} />
                    <div className="space-y-2">
                        <div className="text-4xl mb-2">📄</div>
                        {file ? (
                            <div className="space-y-2">
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onFileAccepted(null);
                                        setFileError(null);
                                    }}
                                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium underline"
                                >
                                    Remove file
                                </button>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {isDragActive ? "Drop the file here" : "Click or drag to upload NIC"}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Supports: JPG, PNG, PDF (Max 5MB)
                                </p>
                            </>
                        )}
                    </div>
                </div>
                {(error || fileError) && (
                    <div className="text-red-500 dark:text-red-400 text-sm mt-1.5">
                        {error || fileError}
                    </div>
                )}
            </div>
        );
    };

    const steps = [
        { number: 1, title: "Service Information", description: "Tell us about the services you offer" },
        { number: 2, title: "Profile Verification", description: "Upload your verification documents" },
    ];

    return (
        <PublicLayout>
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 text-white overflow-hidden">
                {/* Abstract Background Shapes */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                    <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-2000"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 relative z-10">
                    <div className="max-w-3xl">
                        <h2 className="text-indigo-300 dark:text-indigo-400 font-bold tracking-wide uppercase text-sm mb-3">Business Onboarding</h2>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">Complete Your Business Profile</h1>
                        <p className="text-xl text-indigo-100/90 dark:text-indigo-200/90 leading-relaxed">
                            Step {currentStep} of {totalSteps}: {steps[currentStep - 1].title}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stepper Indicator */}
            <div className="bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        {steps.map((step, index) => (
                            <div key={step.number} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${currentStep > step.number
                                        ? "bg-green-500 text-white"
                                        : currentStep === step.number
                                            ? "bg-indigo-600 text-white ring-4 ring-indigo-200 dark:ring-indigo-800"
                                            : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                                        }`}>
                                        {currentStep > step.number ? "✓" : step.number}
                                    </div>
                                    <div className="mt-2 text-center">
                                        <p className={`text-sm font-semibold ${currentStep >= step.number ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
                                            }`}>
                                            {step.title}
                                        </p>
                                    </div>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`flex-1 h-1 mx-4 transition-all ${currentStep > step.number ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={submit} className="space-y-6">
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

                        {/* Step 1: Service Information */}
                        {currentStep === 1 && offers.map((offer, offerIndex) => (
                            <div key={offerIndex} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Service Offer {offerIndex + 1}</h2>
                                    {offers.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeOffer(offerIndex)}
                                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-bold px-4 py-2 border-2 border-red-300 dark:border-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300"
                                        >
                                            Remove Offer
                                        </button>
                                    )}
                                </div>

                                {/* Service Types Selection */}
                                <div className="mb-8">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">Select Service Types *</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Choose the services for this offer. You can select multiple.</p>

                                    {/* Selected Service Types as Tags */}
                                    {offer.selectedServiceTypes.length > 0 && (
                                        <div className="mb-4">
                                            <div className="flex flex-wrap gap-2">
                                                {offer.selectedServiceTypes.map((serviceType) => {
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
                                                                onClick={() => removeServiceTypeFromOffer(offerIndex, serviceType)}
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
                                                onClick={() => addServiceTypeToOffer(offerIndex, service.value)}
                                                disabled={offer.selectedServiceTypes.includes(service.value)}
                                                className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${offer.selectedServiceTypes.includes(service.value)
                                                    ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 opacity-50 cursor-not-allowed"
                                                    : "border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer bg-white dark:bg-gray-700"
                                                    }`}
                                            >
                                                <div className="text-3xl mb-2">{service.icon}</div>
                                                <div className="font-semibold text-gray-900 dark:text-white">{service.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Locations Selection */}
                                <div className="mb-8">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">Select Locations *</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Add locations for this offer. You can add multiple locations.</p>

                                    {/* Selected Locations as Tags */}
                                    {offer.selectedLocations.length > 0 && (
                                        <div className="mb-4">
                                            <div className="flex flex-wrap gap-2">
                                                {offer.selectedLocations.map((location) => (
                                                    <span
                                                        key={location.id}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold border-2 border-green-200 dark:border-green-700"
                                                    >
                                                        <span>📍</span>
                                                        <span>{location.area || location.display_text}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeLocationFromOffer(offerIndex, location.id)}
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
                                            className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 shadow-sm"
                                            placeholder="Search location (e.g., Karachi, Clifton or type area name)..."
                                        />
                                        {showLocationSuggestions[offerIndex] && locationSuggestions[offerIndex]?.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-lg max-h-60 overflow-auto">
                                                {locationSuggestions[offerIndex]
                                                    ?.filter(suggestion => suggestion.id && !offer.selectedLocations.some(loc => loc.id === suggestion.id))
                                                    .map((suggestion, idx) => (
                                                        <div
                                                            key={idx}
                                                            onClick={() => handleLocationSelect(suggestion, offerIndex)}
                                                            className="px-4 py-2 hover:bg-indigo-50 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0 text-gray-900 dark:text-gray-200"
                                                        >
                                                            {suggestion.area || suggestion.display_text}
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Offer Details */}
                                <div className="grid md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Work Type *</label>
                                        <select
                                            value={offer.work_type}
                                            onChange={(e) => updateOffer(offerIndex, "work_type", e.target.value)}
                                            className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 py-2.5 px-4 shadow-sm"
                                            required
                                        >
                                            <option value="">Select Type</option>
                                            <option value="full_time">Full Time</option>
                                            <option value="part_time">Part Time</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Monthly Rate (PKR)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={offer.monthly_rate}
                                            onChange={(e) => updateOffer(offerIndex, "monthly_rate", e.target.value)}
                                            className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 py-2.5 px-4 shadow-sm"
                                            placeholder="e.g., 15000"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Description</label>
                                        <textarea
                                            value={offer.description}
                                            onChange={(e) => updateOffer(offerIndex, "description", e.target.value)}
                                            rows={4}
                                            className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 py-2.5 px-4 shadow-sm"
                                            placeholder="Describe this service offer..."
                                        />
                                    </div>
                                </div>

                                {/* Preview for this offer */}
                                {offer.selectedServiceTypes.length > 0 && offer.selectedLocations.length > 0 && offer.work_type && (
                                    <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-700">
                                        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                                            This offer will create service listings with:
                                        </p>
                                        <div className="text-xs text-indigo-700 dark:text-indigo-400 space-y-1">
                                            <div>
                                                <span className="font-semibold">{offer.selectedServiceTypes.length}</span> service type(s): {offer.selectedServiceTypes.map((st) => {
                                                    const service = serviceTypes.find(s => s.value === st);
                                                    return service?.label;
                                                }).join(", ")}
                                            </div>
                                            <div>
                                                <span className="font-semibold">{offer.selectedLocations.length}</span> location(s): {offer.selectedLocations.map(loc => loc.area || loc.display_text).join(", ")}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Add Another Offer Button */}
                        {currentStep === 1 && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={addOffer}
                                    className="w-full border-2 border-dashed border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 py-4 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-300 font-bold"
                                >
                                    + Add Another Service Offer
                                </button>
                            </div>
                        )}

                        {/* Step 2: Profile Verification Section */}
                        {currentStep === 2 && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">Profile Verification</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Optional: Upload your documents for verification. You can skip this step and complete it later.</p>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                            National Identity Card (NIC) <span className="text-gray-500 dark:text-gray-400 text-xs">(Optional)</span>
                                        </label>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Upload a clear photo or scan of your NIC (front and back if needed)</p>
                                        <NICDropzone
                                            onFileAccepted={(file) => {
                                                if (file === null) {
                                                    setProfileData({ ...profileData, nic: null });
                                                } else {
                                                    setProfileData({ ...profileData, nic: file });
                                                }
                                                setFileError(null);
                                            }}
                                            file={profileData.nic}
                                            error={errors.nic?.[0] || errors.nic}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                            NIC Number <span className="text-gray-500 dark:text-gray-400 text-xs">(Optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={profileData.nic_number}
                                            onChange={(e) => setProfileData({ ...profileData, nic_number: e.target.value })}
                                            className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 py-2.5 px-4 shadow-sm"
                                            placeholder="e.g., 42101-1234567-1"
                                        />
                                        {errors.nic_number && <div className="text-red-500 dark:text-red-400 text-sm mt-1.5">{errors.nic_number}</div>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                            <div className="flex gap-4">
                                {currentStep > 1 && (
                                    <button
                                        type="button"
                                        onClick={handlePrevious}
                                        className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                                    >
                                        ← Previous
                                    </button>
                                )}
                                {currentStep === 1 ? (
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Saving...
                                            </span>
                                        ) : (
                                            "Save & Continue →"
                                        )}
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handleSkip}
                                            className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                                        >
                                            Skip & Complete
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {processing ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    Completing Profile...
                                                </span>
                                            ) : (
                                                "Complete Profile"
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </PublicLayout>
    );
}
