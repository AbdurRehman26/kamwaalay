import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import PublicLayout from "@/Layouts/PublicLayout";
import axios from "axios";
import { onboardingService } from "@/services/onboarding";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";
import { useServiceTypes } from "@/hooks/useServiceTypes";
import { useLanguages } from "@/hooks/useLanguages";

export default function OnboardingHelper() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 3;

    const [offers, setOffers] = useState([{
        selectedServiceTypes: [],
        pin_address: "",
        pin_latitude: "",
        pin_longitude: "",
        work_type: "",
        monthly_rate: "",
        description: "",
    }]);

    const [cities, setCities] = useState([]);
    const [citySearches, setCitySearches] = useState([""]);
    const [showCityDropdowns, setShowCityDropdowns] = useState([false]);
    const [gettingLocation, setGettingLocation] = useState([false]);
    const cityRefs = useRef([]);
    const pinAddressInputRefs = useRef([]);
    const autocompleteRefs = useRef([]);

    // Helper profile fields
    const [profileData, setProfileData] = useState({
        photo: null,
        nic: null,
        nic_number: "",
        city_id: "",
        experience_years: user?.experience_years || "",
        bio: user?.bio || "",
        age: user?.age || "",
        gender: user?.gender || "",
        religion: user?.religion?.value || user?.religion || "",
        selectedLanguages: [],
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [isExplicitSubmit, setIsExplicitSubmit] = useState(false);
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

    // Fetch service types from API
    const { serviceTypes, loading: serviceTypesLoading } = useServiceTypes();

    // Fetch languages from API
    const { languages } = useLanguages();

    // Fetch cities
    useEffect(() => {
        axios.get("/api/cities")
            .then(response => {
                setCities(response.data.cities || response.data || []);
            })
            .catch(error => {
                console.error("Error fetching cities:", error);
            });
    }, []);

    // Update profile data when user loads
    useEffect(() => {
        if (user) {
            setProfileData(prev => ({
                ...prev,
                experience_years: user?.experience_years || prev.experience_years,
                bio: user?.bio || prev.bio,
                age: user?.age || prev.age,
                gender: user?.gender || prev.gender,
                religion: user?.religion?.value || user?.religion || prev.religion,
            }));
        }
    }, [user]);

    const addOffer = () => {
        setOffers([...offers, {
            selectedServiceTypes: [],
            pin_address: "",
            pin_latitude: "",
            pin_longitude: "",
            work_type: "",
            monthly_rate: "",
            description: "",
        }]);
        setCitySearches([...citySearches, ""]);
        setShowCityDropdowns([...showCityDropdowns, false]);
        setGettingLocation([...gettingLocation, false]);
    };

    const removeOffer = (index) => {
        if (offers.length > 1) {
            setOffers(offers.filter((_, i) => i !== index));
            setCitySearches(citySearches.filter((_, i) => i !== index));
            setShowCityDropdowns(showCityDropdowns.filter((_, i) => i !== index));
            setGettingLocation(gettingLocation.filter((_, i) => i !== index));
        }
    };

    // Initialize Google Places Autocomplete for each offer
    useEffect(() => {
        offers.forEach((offer, index) => {
            const inputRef = pinAddressInputRefs.current[index];
            if (inputRef && window.google && window.google.maps && window.google.maps.places && !autocompleteRefs.current[index]) {
                try {
                    const autocomplete = new window.google.maps.places.Autocomplete(
                        inputRef,
                        {
                            componentRestrictions: { country: "pk" },
                            fields: ["formatted_address", "geometry", "name"],
                            types: ["address"]
                        }
                    );
                    autocompleteRefs.current[index] = autocomplete;

                    autocomplete.addListener("place_changed", () => {
                        const place = autocomplete.getPlace();
                        if (place.formatted_address) {
                            const lat = place.geometry?.location?.lat();
                            const lng = place.geometry?.location?.lng();
                            const newOffers = [...offers];
                            newOffers[index] = {
                                ...newOffers[index],
                                pin_address: place.formatted_address,
                                pin_latitude: lat ? lat.toString() : "",
                                pin_longitude: lng ? lng.toString() : ""
                            };
                            setOffers(newOffers);
                        }
                    });
                } catch (error) {
                    console.error("Error initializing Google Places Autocomplete:", error);
                }
            }
        });
    }, [offers.length]);

    const handleGetCurrentLocation = (offerIndex) => {
        if (!navigator.geolocation) {
            setErrors({ ...errors, pin_address: "Geolocation is not supported by your browser." });
            return;
        }

        if (!window.google || !window.google.maps || !window.google.maps.Geocoder) {
            setErrors({ ...errors, pin_address: "Google Maps API is not loaded. Please refresh the page." });
            return;
        }

        const newGettingLocation = [...gettingLocation];
        newGettingLocation[offerIndex] = true;
        setGettingLocation(newGettingLocation);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    const geocoder = new window.google.maps.Geocoder();
                    const latlng = { lat: latitude, lng: longitude };

                    geocoder.geocode({ location: latlng }, (results, status) => {
                        const newOffers = [...offers];
                        if (status === "OK" && results && results.length > 0) {
                            newOffers[offerIndex] = {
                                ...newOffers[offerIndex],
                                pin_address: results[0].formatted_address,
                                pin_latitude: latitude.toString(),
                                pin_longitude: longitude.toString()
                            };
                        } else {
                            newOffers[offerIndex] = {
                                ...newOffers[offerIndex],
                                pin_address: `${latitude}, ${longitude}`,
                                pin_latitude: latitude.toString(),
                                pin_longitude: longitude.toString()
                            };
                        }
                        setOffers(newOffers);
                        const newGetting = [...gettingLocation];
                        newGetting[offerIndex] = false;
                        setGettingLocation(newGetting);
                    });
                } catch (error) {
                    console.error("Error reverse geocoding:", error);
                    const newOffers = [...offers];
                    newOffers[offerIndex] = {
                        ...newOffers[offerIndex],
                        pin_address: `${latitude}, ${longitude}`,
                        pin_latitude: latitude.toString(),
                        pin_longitude: longitude.toString()
                    };
                    setOffers(newOffers);
                    const newGetting = [...gettingLocation];
                    newGetting[offerIndex] = false;
                    setGettingLocation(newGetting);
                }
            },
            (error) => {
                console.error("Error getting location:", error);
                let errorMessage = "Unable to get your location.";
                if (error.code === error.PERMISSION_DENIED) {
                    errorMessage = "Location access denied. Please enable location permissions.";
                }
                setErrors({ ...errors, pin_address: errorMessage });
                const newGetting = [...gettingLocation];
                newGetting[offerIndex] = false;
                setGettingLocation(newGetting);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
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

    const handleCitySelect = (city, offerIndex) => {
        const newOffers = [...offers];
        newOffers[offerIndex].city_id = city.id;
        setOffers(newOffers);
        const newSearches = [...citySearches];
        newSearches[offerIndex] = city.name;
        setCitySearches(newSearches);
        const newShow = [...showCityDropdowns];
        newShow[offerIndex] = false;
        setShowCityDropdowns(newShow);
    };

    const getFilteredCities = (searchTerm) => {
        if (!searchTerm) return cities;
        return cities.filter(city =>
            city.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            cityRefs.current.forEach((ref, index) => {
                if (ref && !ref.contains(event.target)) {
                    const newShow = [...showCityDropdowns];
                    newShow[index] = false;
                    setShowCityDropdowns(newShow);
                }
            });
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const validateStep = (step) => {
        const validationErrors = {};
        const offer = offers[0];

        if (step === 1) {
            // Validate Service Information
            if (!offer.selectedServiceTypes.length) {
                validationErrors.serviceTypes = "Please select at least one service type.";
            }
            if (!offer.pin_address) {
                validationErrors.pin_address = "Please enter your address.";
            }
            if (!offer.work_type) {
                validationErrors.workType = "Please select a work type.";
            }
        }
        // Step 2 (Profile Verification) is optional - no validation required
        // Step 3 (Additional Information) has no required fields

        if (Object.keys(validationErrors).length > 0) {
            setFieldErrors(prev => ({ ...prev, ...validationErrors }));
            setErrors(validationErrors);
            // Scroll to first error
            setTimeout(() => {
                const firstErrorElement = document.querySelector("[data-error-field]");
                if (firstErrorElement) {
                    firstErrorElement.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }, 100);
            return false;
        }

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
        setErrors({});
        return true;
    };

    const saveServiceListing = async () => {
        const offer = offers[0];

        // Prepare FormData for service listing
        const formData = new FormData();
        formData.append("services", JSON.stringify(offer.selectedServiceTypes));
        formData.append("city_id", profileData.city_id || "");
        formData.append("pin_address", offer.pin_address);
        if (offer.pin_latitude) formData.append("pin_latitude", offer.pin_latitude);
        if (offer.pin_longitude) formData.append("pin_longitude", offer.pin_longitude);
        formData.append("work_type", offer.work_type);
        if (offer.monthly_rate) {
            formData.append("monthly_rate", parseFloat(offer.monthly_rate));
        }
        if (offer.description) {
            formData.append("description", offer.description);
        }
        formData.append("experience_years", profileData.experience_years || "");
        formData.append("bio", profileData.bio || "");
        if (profileData.age) {
            formData.append("age", profileData.age);
        }
        if (profileData.gender) {
            formData.append("gender", profileData.gender);
        }
        if (profileData.religion) {
            formData.append("religion", profileData.religion);
        }
        if (profileData.selectedLanguages && profileData.selectedLanguages.length > 0) {
            formData.append("languages", JSON.stringify(profileData.selectedLanguages));
        }

        try {
            await onboardingService.completeHelper(formData);
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
        } else if (validateStep(currentStep)) {
            if (currentStep < totalSteps) {
                setCurrentStep(currentStep + 1);
            }
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        if (currentStep === 2) {
            // Skip verification documents and go to step 3
            setCurrentStep(3);
        }
    };

    const submit = async (e) => {
        e.preventDefault();

        // If on step 1, save service listing
        if (currentStep === 1) {
            await handleNext();
            return;
        }

        // If on step 2, just proceed to next step (don't submit)
        if (currentStep === 2) {
            handleNext();
            return;
        }

        // Only submit on step 3 if explicitly triggered by button click
        // Prevent accidental submission from Enter key press
        if (currentStep === 3 && !isExplicitSubmit) {
            return;
        }

        // Final submission on step 3 - update profile with verification documents if provided
        setProcessing(true);
        setErrors({});

        const offer = offers[0];

        // Prepare FormData for final submission (verification documents and profile updates)
        const formData = new FormData();
        formData.append("services", JSON.stringify(offer.selectedServiceTypes));
        formData.append("city_id", profileData.city_id || "");
        formData.append("pin_address", offer.pin_address);
        if (offer.pin_latitude) formData.append("pin_latitude", offer.pin_latitude);
        if (offer.pin_longitude) formData.append("pin_longitude", offer.pin_longitude);
        formData.append("work_type", offer.work_type);
        if (offer.monthly_rate) {
            formData.append("monthly_rate", parseFloat(offer.monthly_rate));
        }
        if (offer.description) {
            formData.append("description", offer.description);
        }
        formData.append("experience_years", profileData.experience_years || "");
        formData.append("bio", profileData.bio || "");
        if (profileData.age) {
            formData.append("age", profileData.age);
        }
        if (profileData.gender) {
            formData.append("gender", profileData.gender);
        }
        if (profileData.religion) {
            formData.append("religion", profileData.religion);
        }
        if (profileData.selectedLanguages && profileData.selectedLanguages.length > 0) {
            formData.append("languages", JSON.stringify(profileData.selectedLanguages));
        }

        // Add verification documents if provided (optional)
        if (profileData.nic_number) {
            formData.append("nic_number", profileData.nic_number);
        }
        if (profileData.photo) {
            formData.append("photo", profileData.photo);
        }
        if (profileData.nic) {
            formData.append("nic", profileData.nic);
        }

        try {
            await onboardingService.completeHelper(formData);
            // Redirect to Search Jobs page on success and refresh
            window.location.href = route("job-applications.index");
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ submit: [error.response?.data?.message || "Failed to complete onboarding"] });
            }
            setIsExplicitSubmit(false); // Reset flag on error
        } finally {
            setProcessing(false);
        }
    };

    // Prevent Enter key from submitting form on step 3
    const handleKeyDown = (e) => {
        if (currentStep === 3 && e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
            e.preventDefault();
        }
    };

    // NIC File Input Component
    const NICFileInput = ({ onFileAccepted, file, error }) => {
        const fileInputRef = useRef(null);
        const fileInputIdRef = useRef(`nic-file-${Date.now()}-${Math.random()}`);

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

        const removeFile = () => {
            onFileAccepted(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        };

        return (
            <div>
                {file ? (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button
                            type="button"
                            onClick={removeFile}
                            className="px-3 py-1 text-sm bg-red-500 dark:bg-red-600 text-white rounded-xl hover:bg-red-600 dark:hover:bg-red-700 transition-all duration-300"
                        >
                            Remove
                        </button>
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                            className="hidden"
                            id={fileInputIdRef.current}
                        />
                        <label htmlFor={fileInputIdRef.current} className="cursor-pointer">
                            <div className="text-4xl mb-2">📄</div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Click to upload NIC</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PDF, JPG, or PNG up to 5MB</p>
                        </label>
                    </div>
                )}
                {(error || fieldErrors.nicFileType || fieldErrors.nicFileSize) && (
                    <div className="text-red-500 dark:text-red-400 text-sm mt-1.5">{error || fieldErrors.nicFileType || fieldErrors.nicFileSize}</div>
                )}
            </div>
        );
    };

    // Photo File Input Component
    const PhotoFileInput = ({ onFileAccepted, file, error }) => {
        const fileInputRef = useRef(null);
        const fileInputIdRef = useRef(`photo-file-${Date.now()}-${Math.random()}`);

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

        const removeFile = () => {
            onFileAccepted(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        };

        return (
            <div>
                {file ? (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-gray-200 dark:border-gray-600">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button
                            type="button"
                            onClick={removeFile}
                            className="px-3 py-1 text-sm bg-red-500 dark:bg-red-600 text-white rounded-xl hover:bg-red-600 dark:hover:bg-red-700 transition-all duration-300"
                        >
                            Remove
                        </button>
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".jpg,.jpeg,.png"
                            onChange={handleFileChange}
                            className="hidden"
                            id={fileInputIdRef.current}
                        />
                        <label htmlFor={fileInputIdRef.current} className="cursor-pointer">
                            <div className="text-4xl mb-2">📷</div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Click to upload photo</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">JPG or PNG up to 2MB</p>
                        </label>
                    </div>
                )}
                {(error || fieldErrors.photoFileType || fieldErrors.photoFileSize) && (
                    <div className="text-red-500 dark:text-red-400 text-sm mt-1.5">{error || fieldErrors.photoFileType || fieldErrors.photoFileSize}</div>
                )}
            </div>
        );
    };

    const steps = [
        { number: 1, title: "Service Information", description: "Tell us about the services you offer" },
        { number: 2, title: "Profile Verification", description: "Upload your verification documents" },
        { number: 3, title: "Additional Information", description: "Add more details about yourself" },
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
                        <h2 className="text-indigo-300 dark:text-indigo-400 font-bold tracking-wide uppercase text-sm mb-3">Helper Onboarding</h2>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">Complete Your Helper Profile</h1>
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
                    <form onSubmit={submit} onKeyDown={handleKeyDown} className="space-y-6">
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
                                <div className="mb-8" data-error-field={fieldErrors.serviceTypes ? "true" : undefined}>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">Select Service Types *</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Choose the services for this offer. You can select multiple.</p>
                                    {fieldErrors.serviceTypes && (
                                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
                                            <p className="text-sm text-red-600 dark:text-red-400">{fieldErrors.serviceTypes}</p>
                                        </div>
                                    )}

                                    {/* Selected Service Types as Tags */}
                                    {offer.selectedServiceTypes.length > 0 && (
                                        <div className="mb-4">
                                            <div className="flex flex-wrap gap-2">
                                                {offer.selectedServiceTypes.map((serviceTypeId) => {
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
                                                                onClick={() => removeServiceTypeFromOffer(offerIndex, serviceTypeId)}
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
                                                onClick={() => addServiceTypeToOffer(offerIndex, service.id)}
                                                disabled={offer.selectedServiceTypes.includes(service.id)}
                                                className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${offer.selectedServiceTypes.includes(service.id)
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


                                {/* Pin Address */}
                                <div className="mb-8" data-error-field={fieldErrors.pin_address ? "true" : undefined}>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">
                                        <span className="mr-2">📍</span>
                                        Your Address *
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Enter the address where you provide services, or click the button to get your current location.</p>
                                    {fieldErrors.pin_address && (
                                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
                                            <p className="text-sm text-red-600 dark:text-red-400">{fieldErrors.pin_address}</p>
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <input
                                            ref={el => pinAddressInputRefs.current[offerIndex] = el}
                                            type="text"
                                            value={offer.pin_address}
                                            readOnly
                                            className="flex-1 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 shadow-sm cursor-pointer"
                                            placeholder="Click to search or use Get Location button"
                                            onClick={() => pinAddressInputRefs.current[offerIndex]?.focus()}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleGetCurrentLocation(offerIndex)}
                                            disabled={gettingLocation[offerIndex]}
                                            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                                        >
                                            {gettingLocation[offerIndex] ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    <span>Getting...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>📍</span>
                                                    <span>Get Location</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Offer Details */}
                                <div className="grid md:grid-cols-2 gap-6 mb-6">
                                    <div data-error-field={fieldErrors.workType ? "true" : undefined}>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Work Type *</label>
                                        <select
                                            value={offer.work_type}
                                            onChange={(e) => {
                                                updateOffer(offerIndex, "work_type", e.target.value);
                                                if (e.target.value) {
                                                    setFieldErrors(prev => ({ ...prev, workType: "" }));
                                                }
                                            }}
                                            className={`w-full border-2 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 py-2.5 px-4 shadow-sm ${fieldErrors.workType
                                                ? "border-red-300 dark:border-red-600"
                                                : "border-gray-300 dark:border-gray-600"
                                                } dark:bg-gray-700 dark:text-white`}
                                            required
                                        >
                                            <option value="">Select Type</option>
                                            <option value="full_time">Full Time</option>
                                            <option value="part_time">Part Time</option>
                                        </select>
                                        {fieldErrors.workType && (
                                            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
                                                <p className="text-sm text-red-600 dark:text-red-400">{fieldErrors.workType}</p>
                                            </div>
                                        )}
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
                                {offer.selectedServiceTypes.length > 0 && offer.pin_address && offer.work_type && (
                                    <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border-2 border-indigo-200 dark:border-indigo-700">
                                        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                                            This offer will create 1 service listing with:
                                        </p>
                                        <div className="text-xs text-indigo-700 dark:text-indigo-400 space-y-1">
                                            <div>
                                                <span className="font-semibold">{offer.selectedServiceTypes.length}</span> service type(s): {offer.selectedServiceTypes.map((stId) => {
                                                    const service = serviceTypes.find(s => s.id === stId);
                                                    return service?.label;
                                                }).join(", ")}
                                            </div>
                                            <div>
                                                <span className="font-semibold">📍 Location:</span> {offer.pin_address}
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
                                        <NICFileInput
                                            onFileAccepted={(file) => {
                                                setProfileData({ ...profileData, nic: file });
                                                setFieldErrors(prev => ({ ...prev, nicFileType: "", nicFileSize: "" }));
                                            }}
                                            file={profileData.nic}
                                            error={errors.nic}
                                        />
                                        {(fieldErrors.nicFileType || fieldErrors.nicFileSize) && (
                                            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
                                                <p className="text-sm text-red-600 dark:text-red-400">{fieldErrors.nicFileType || fieldErrors.nicFileSize}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                            NIC Number *
                                        </label>
                                        <input
                                            type="text"
                                            value={profileData.nic_number}
                                            onChange={(e) => setProfileData({ ...profileData, nic_number: e.target.value })}
                                            className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 py-2.5 px-4 shadow-sm"
                                            placeholder="e.g., 42101-1234567-1"
                                            required
                                        />
                                        {errors.nic_number && <div className="text-red-500 dark:text-red-400 text-sm mt-1.5">{errors.nic_number}</div>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                            Photo <span className="text-gray-500 dark:text-gray-400 text-xs">(Optional)</span>
                                        </label>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Upload your profile photo (optional)</p>
                                        <PhotoFileInput
                                            onFileAccepted={(file) => {
                                                setProfileData({ ...profileData, photo: file });
                                                setFieldErrors(prev => ({ ...prev, photoFileType: "", photoFileSize: "" }));
                                            }}
                                            file={profileData.photo}
                                            error={errors.photo}
                                        />
                                        {(fieldErrors.photoFileType || fieldErrors.photoFileSize) && (
                                            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
                                                <p className="text-sm text-red-600 dark:text-red-400">{fieldErrors.photoFileType || fieldErrors.photoFileSize}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Helper Profile Section */}
                        {currentStep === 3 && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">Your Profile</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Optional: Add more details about yourself</p>

                                <div className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Age</label>
                                            <input
                                                type="number"
                                                min="18"
                                                max="100"
                                                value={profileData.age}
                                                onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
                                                className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 py-2.5 px-4 shadow-sm"
                                                placeholder="e.g., 25"
                                            />
                                            {errors.age && <div className="text-red-500 dark:text-red-400 text-sm mt-1.5">{errors.age}</div>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Gender</label>
                                            <select
                                                value={profileData.gender}
                                                onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                                                className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 py-2.5 px-4 shadow-sm"
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                            {errors.gender && <div className="text-red-500 dark:text-red-400 text-sm mt-1.5">{errors.gender}</div>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Religion</label>
                                            <select
                                                value={profileData.religion}
                                                onChange={(e) => setProfileData({ ...profileData, religion: e.target.value })}
                                                className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 py-2.5 px-4 shadow-sm"
                                            >
                                                <option value="">Select Religion</option>
                                                <option value="sunni_nazar_niyaz">Sunni (Nazar Niyaz)</option>
                                                <option value="sunni_no_nazar_niyaz">Sunni (No Nazar Niyaz)</option>
                                                <option value="shia">Shia</option>
                                                <option value="christian">Christian</option>
                                            </select>
                                            {errors.religion && <div className="text-red-500 dark:text-red-400 text-sm mt-1.5">{errors.religion}</div>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">City</label>
                                            <select
                                                value={profileData.city_id}
                                                onChange={(e) => setProfileData({ ...profileData, city_id: e.target.value })}
                                                className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 py-2.5 px-4 shadow-sm"
                                            >
                                                <option value="">Select City</option>
                                                {cities.map((city) => (
                                                    <option key={city.id} value={city.id}>
                                                        {city.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.city_id && <div className="text-red-500 dark:text-red-400 text-sm mt-1.5">{errors.city_id}</div>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Years of Experience</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={profileData.experience_years}
                                            onChange={(e) => setProfileData({ ...profileData, experience_years: e.target.value })}
                                            className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 py-2.5 px-4 shadow-sm"
                                            placeholder="e.g., 5"
                                        />
                                        {errors.experience_years && <div className="text-red-500 dark:text-red-400 text-sm mt-1.5">{errors.experience_years}</div>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Languages</label>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Select the languages you speak</p>

                                        {/* Selected Languages as Tags */}
                                        {profileData.selectedLanguages.length > 0 && (
                                            <div className="mb-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {profileData.selectedLanguages.map((languageId) => {
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
                                                                        setProfileData({
                                                                            ...profileData,
                                                                            selectedLanguages: profileData.selectedLanguages.filter(id => id !== languageId)
                                                                        });
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
                                                        if (!profileData.selectedLanguages.includes(language.id)) {
                                                            setProfileData({
                                                                ...profileData,
                                                                selectedLanguages: [...profileData.selectedLanguages, language.id]
                                                            });
                                                        }
                                                    }}
                                                    disabled={profileData.selectedLanguages.includes(language.id)}
                                                    className={`p-3 rounded-xl border-2 transition-all duration-300 text-left ${profileData.selectedLanguages.includes(language.id)
                                                        ? "border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 opacity-50 cursor-not-allowed"
                                                        : "border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer bg-white dark:bg-gray-700"
                                                        }`}
                                                >
                                                    <div className="font-semibold text-gray-900 dark:text-white">{language.name}</div>
                                                </button>
                                            ))}
                                        </div>
                                        {errors.languages && <div className="text-red-500 dark:text-red-400 text-sm mt-1.5">{errors.languages}</div>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Bio</label>
                                        <textarea
                                            value={profileData.bio}
                                            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                            rows={4}
                                            className="w-full border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 py-2.5 px-4 shadow-sm"
                                            placeholder="Tell us about yourself..."
                                        />
                                        {errors.bio && <div className="text-red-500 dark:text-red-400 text-sm mt-1.5">{errors.bio}</div>}
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
                                        disabled={processing}
                                        className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
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
                                ) : currentStep === 2 ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handleSkip}
                                            disabled={processing}
                                            className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                                        >
                                            Skip
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                                        >
                                            Continue →
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handleSkip}
                                            disabled={processing}
                                            className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-3.5 rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                                        >
                                            Skip & Complete
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                setIsExplicitSubmit(true);
                                                submit(e);
                                            }}
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
