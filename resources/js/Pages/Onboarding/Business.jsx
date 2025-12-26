import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import PublicLayout from "@/Layouts/PublicLayout";
import api from "@/services/api";
import { useDropzone } from "react-dropzone";
import { onboardingService } from "@/services/onboarding";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";
import { useServiceTypes } from "@/hooks/useServiceTypes";
import { useLanguages } from "@/hooks/useLanguages";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import TextArea from "@/Components/TextArea";

export default function OnboardingBusiness() {
    const navigate = useNavigate();
    const { user, isLoading } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 2;

    useEffect(() => {
        if (!isLoading && user && user.onboarding_complete) {
            navigate("/dashboard");
        }
    }, [user, isLoading, navigate]);

    // Worker Data State (Step 1)
    const [workerData, setWorkerData] = useState({
        name: "",
        phone: "",
        age: "",
        gender: "",
        religion: "",
        experience_years: "",
        availability: "full_time",
        bio: "",
        photo: null,
        monthly_rate: "",
    });

    // Business Data State (Step 2 & Hidden Profile)
    const [profileData, setProfileData] = useState({
        nic: null,
        nic_number: "",
        bio: user?.bio || "", // Business Bio (optional, mostly unused in this flow but good to have)
    });

    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [fileError, setFileError] = useState(null);

    // Multi-select states
    const [selectedServiceTypes, setSelectedServiceTypes] = useState([]);
    const [selectedLanguages, setSelectedLanguages] = useState([]);
    const [photoPreview, setPhotoPreview] = useState(null);

    // Location State (Pin Address)
    const [locationData, setLocationData] = useState({
        pin_address: "",
        pin_latitude: "",
        pin_longitude: ""
    });
    const [gettingLocation, setGettingLocation] = useState(false);
    const pinAddressInputRef = useRef(null);
    const autocompleteRef = useRef(null);

    // Fetch hooks
    const { serviceTypes } = useServiceTypes();
    const { languages } = useLanguages();

    const availabilityOptions = [
        { value: "full_time", label: "Full Time" },
        { value: "part_time", label: "Part Time" },
        { value: "available", label: "Available" },
    ];

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
    }, []);

    // Photo Preview Handler
    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setWorkerData({ ...workerData, photo: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Location Handlers (Google Places)
    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            setErrors({ ...errors, pin_address: "Geolocation is not supported by your browser." });
            return;
        }

        if (!window.isSecureContext && window.location.protocol !== "https:" && !window.location.hostname.includes("localhost") && !window.location.hostname.includes("127.0.0.1")) {
            setErrors({ ...errors, pin_address: "Geolocation requires HTTPS or localhost." });
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
                            // Fallback if geocoding fails
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
            }
        );
    };

    const addServiceType = (serviceType) => {
        if (!selectedServiceTypes.includes(serviceType)) {
            setSelectedServiceTypes([...selectedServiceTypes, serviceType]);
        }
    };

    const removeServiceType = (serviceType) => {
        setSelectedServiceTypes(selectedServiceTypes.filter(st => st !== serviceType));
    };

    // Validation
    const validateStep1 = () => {
        const newErrors = {};
        if (!workerData.name) newErrors.name = "Name is required";
        if (!workerData.experience_years) newErrors.experience_years = "Experience is required";
        if (selectedServiceTypes.length === 0) newErrors.service_types = "Please select at least one service type";
        if (!locationData.pin_address) newErrors.pin_address = "Please select a location";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        console.log("handleNext called, currentStep:", currentStep);
        if (currentStep === 1) {
            const isValid = validateStep1();
            console.log("Validation Result:", isValid, errors);
            if (isValid) {
                setCurrentStep(2);
                window.scrollTo(0, 0);
            }
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            window.scrollTo(0, 0);
        }
    };

    const submit = async (e) => {
        e.preventDefault();

        // Final validation
        if (!validateStep1()) {
            setCurrentStep(1);
            return;
        }

        setProcessing(true);
        setErrors({});

        const formData = new FormData();

        // Worker Data
        formData.append("name", workerData.name);
        if (workerData.phone) formData.append("phone", workerData.phone);
        formData.append("experience_years", workerData.experience_years);
        formData.append("monthly_rate", workerData.monthly_rate);
        formData.append("availability", workerData.availability);
        if (workerData.bio) formData.append("bio", workerData.bio);
        if (workerData.age) formData.append("age", workerData.age);
        if (workerData.gender) formData.append("gender", workerData.gender);
        if (workerData.religion) formData.append("religion", workerData.religion);
        if (workerData.photo) formData.append("photo", workerData.photo);

        // Arrays (Service Types, Locations, Languages)
        // Backend expects JSON strings for arrays if sent via FormData with other complex fields

        formData.append("service_types", JSON.stringify(selectedServiceTypes));

        // Location (Pin Address)
        formData.append("pin_address", locationData.pin_address);
        if (locationData.pin_latitude) formData.append("pin_latitude", locationData.pin_latitude);
        if (locationData.pin_longitude) formData.append("pin_longitude", locationData.pin_longitude);

        if (selectedLanguages.length > 0) {
            formData.append("languages", JSON.stringify(selectedLanguages));
        }

        // Business Profile Data
        if (profileData.nic) formData.append("nic", profileData.nic);
        if (profileData.nic_number) formData.append("nic_number", profileData.nic_number);

        try {
            await onboardingService.completeBusiness(formData);
            navigate(route("dashboard"));
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                // If error is in step 1 fields, go back
                const step1Fields = ["name", "phone", "service_types", "pin_address", "experience_years", "availability"];
                if (Object.keys(error.response.data.errors).some(k => step1Fields.includes(k))) {
                    setCurrentStep(1);
                }
            } else {
                setErrors({ submit: error.response?.data?.message || "Failed to complete onboarding" });
            }
        } finally {
            setProcessing(false);
        }
    };

    // NIC Dropzone Component
    const NICDropzone = ({ onFileAccepted, file, error }) => {
        const { getRootProps, getInputProps, isDragActive } = useDropzone({
            accept: { "image/*": [".jpeg", ".jpg", ".png"], "application/pdf": [".pdf"] },
            maxFiles: 1, maxSize: 5 * 1024 * 1024,
            onDropAccepted: (files) => { setFileError(null); if (files.length > 0) onFileAccepted(files[0]); },
            onDropRejected: (files) => {
                if (files.length > 0) setFileError(files[0].errors[0].message);
            },
        });

        return (
            <div>
                <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : error ? "border-red-300 bg-red-50 dark:bg-red-900/20" : "border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-400 bg-white dark:bg-gray-800"}`}>
                    <input {...getInputProps()} />
                    <div className="text-4xl mb-2">📄</div>
                    {file ? (
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                            <button type="button" onClick={(e) => { e.stopPropagation(); onFileAccepted(null); }} className="text-red-600 dark:text-red-400 text-xs underline">Remove</button>
                        </div>
                    ) : <p className="text-sm text-gray-500 dark:text-gray-400">{isDragActive ? "Drop here" : "Upload NIC (JPG, PNG, PDF)"}</p>}
                </div>
                {(error || fileError) && <div className="text-red-500 text-sm mt-1">{error || fileError}</div>}
            </div>
        );
    };

    return (
        <PublicLayout>
            <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 text-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 relative z-10">
                    <div className="max-w-3xl">
                        <h2 className="text-indigo-300 font-bold uppercase text-sm mb-3">Business Onboarding</h2>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">Add Your First Worker</h1>
                        <p className="text-xl text-indigo-100/90">Step {currentStep} of {totalSteps}: {currentStep === 1 ? "Worker Details" : "Verification"}</p>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        {[1, 2].map((step) => (
                            <div key={step} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${currentStep > step ? "bg-green-500 text-white" :
                                        currentStep === step ? "bg-indigo-600 text-white ring-4 ring-indigo-200" :
                                            "bg-gray-300 text-gray-600"
                                        }`}>
                                        {currentStep > step ? "✓" : step}
                                    </div>
                                    <div className="mt-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        {step === 1 ? "Worker Details" : "Verification"}
                                    </div>
                                </div>
                                {step < 2 && <div className={`flex-1 h-1 mx-4 ${currentStep > step ? "bg-green-500" : "bg-gray-300"}`} />}
                            </div>
                        ))}
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl">{errors.submit}</div>
                        )}

                        {/* STEP 1: WORKER DETAILS */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                {/* Basic Info */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wide">Basic Information</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <InputLabel htmlFor="name" value="Worker Name *" />
                                            <TextInput id="name" value={workerData.name} onChange={(e) => setWorkerData({ ...workerData, name: e.target.value })} className="mt-1 block w-full" required />
                                            <InputError message={errors.name} className="mt-1.5" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="phone" value="Phone" />
                                            <TextInput id="phone" value={workerData.phone} onChange={(e) => setWorkerData({ ...workerData, phone: e.target.value })} className="mt-1 block w-full" />
                                            <InputError message={errors.phone} className="mt-1.5" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <InputLabel htmlFor="photo" value="Photo" />
                                            <div className="flex items-center gap-6 mt-2">
                                                <div className="relative group w-32 h-32 flex-shrink-0">
                                                    {photoPreview ? (
                                                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover rounded-full border-4 border-indigo-100 dark:border-indigo-900" />
                                                    ) : (
                                                        <div className="w-full h-full rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                                                            <span className="text-4xl">📷</span>
                                                        </div>
                                                    )}
                                                    <label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 shadow-lg transition-all">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-8.9l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                                        <input id="photo-upload" type="file" className="hidden" onChange={handlePhotoChange} accept="image/*" />
                                                    </label>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Upload a professional photo of the worker. This helps build trust with customers.</p>
                                                    <InputError message={errors.photo} />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="age" value="Age" />
                                            <TextInput id="age" type="number" min="18" max="100" value={workerData.age} onChange={(e) => setWorkerData({ ...workerData, age: e.target.value })} className="mt-1 block w-full" />
                                            <InputError message={errors.age} className="mt-1.5" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="gender" value="Gender" />
                                            <select id="gender" value={workerData.gender} onChange={(e) => setWorkerData({ ...workerData, gender: e.target.value })} className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                                                <option value="">Select Gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="religion" value="Religion" />
                                            <select id="religion" value={workerData.religion} onChange={(e) => setWorkerData({ ...workerData, religion: e.target.value })} className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                                                <option value="">Select Religion</option>
                                                <option value="sunni_nazar_niyaz">Sunni (Nazar Niyaz)</option>
                                                <option value="sunni_no_nazar_niyaz">Sunni (No Nazar Niyaz)</option>
                                                <option value="shia">Shia</option>
                                                <option value="christian">Christian</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Languages */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">Languages</h2>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {languages.map((lang) => (
                                            <button key={lang.id} type="button" onClick={() => {
                                                if (selectedLanguages.includes(lang.id)) setSelectedLanguages(selectedLanguages.filter(id => id !== lang.id));
                                                else setSelectedLanguages([...selectedLanguages, lang.id]);
                                            }} className={`p-3 rounded-xl border-2 text-left transition-colors ${selectedLanguages.includes(lang.id) ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400 text-blue-700 dark:text-blue-300" : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                                                <div className="font-semibold">{lang.name}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Service Types */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">Service Types *</h2>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {serviceTypes.map((service) => (
                                            <button key={service.value} type="button" onClick={() => {
                                                if (selectedServiceTypes.includes(service.value)) removeServiceType(service.value);
                                                else addServiceType(service.value);
                                            }} className={`p-4 rounded-xl border-2 text-left transition-all ${selectedServiceTypes.includes(service.value) ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-400 text-indigo-700 dark:text-indigo-300" : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                                                <div className="text-3xl mb-2">{service.icon}</div>
                                                <div className="font-semibold">{service.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                    <InputError message={errors.service_types} className="mt-1.5" />
                                </div>

                                {/* Location (Pin Address) */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">Location *</h2>
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
                                                className="block w-full pl-10 border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-3"
                                                placeholder="Search for an area..."
                                                defaultValue={locationData.pin_address}
                                                onChange={(e) => setLocationData({ ...locationData, pin_address: e.target.value })}
                                            />

                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                <button
                                                    type="button"
                                                    onClick={handleGetCurrentLocation}
                                                    className="p-1 rounded-full text-gray-400 hover:text-indigo-500 focus:outline-none"
                                                    title="Use current location"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        {gettingLocation && <p className="text-xs text-indigo-500 mt-1">Getting current location...</p>}
                                        <InputError message={errors.pin_address} className="mt-1.5" />
                                    </div>
                                </div>

                                {/* Professional Details */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wide">Professional Details</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <InputLabel htmlFor="experience" value="Experience (Years) *" />
                                            <TextInput id="experience" type="number" min="0" value={workerData.experience_years} onChange={(e) => setWorkerData({ ...workerData, experience_years: e.target.value })} className="mt-1 block w-full" required />
                                            <InputError message={errors.experience_years} className="mt-1.5" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="availability" value="Availability *" />
                                            <select id="availability" value={workerData.availability} onChange={(e) => setWorkerData({ ...workerData, availability: e.target.value })} className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                                                {availabilityOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="monthly_rate" value="Monthly Rate (PKR)" />
                                            <TextInput id="monthly_rate" type="number" min="0" value={workerData.monthly_rate} onChange={(e) => setWorkerData({ ...workerData, monthly_rate: e.target.value })} className="mt-1 block w-full" placeholder="e.g. 25000" />
                                            <InputError message={errors.monthly_rate} className="mt-1.5" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <InputLabel htmlFor="bio" value="Bio / Description" />
                                            <TextArea id="bio" value={workerData.bio} onChange={(e) => setWorkerData({ ...workerData, bio: e.target.value })} className="mt-1 block w-full" rows="4" placeholder="Describe the worker..." />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: VERIFICATION */}
                        {currentStep === 2 && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">Business Verification</h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">Upload your NIC to verify your business identity.</p>
                                <div className="space-y-6">
                                    <div>
                                        <InputLabel value="NIC Image *" />
                                        <NICDropzone onFileAccepted={(file) => setProfileData({ ...profileData, nic: file })} file={profileData.nic} error={errors.nic} />
                                    </div>
                                    <div>
                                        <InputLabel value="NIC Number" />
                                        <TextInput value={profileData.nic_number} onChange={(e) => setProfileData({ ...profileData, nic_number: e.target.value })} className="mt-1 block w-full" placeholder="e.g. 42101-..." />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 flex justify-end gap-4">
                            {currentStep > 1 && (
                                <button type="button" onClick={handlePrevious} className="px-6 py-3.5 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600">Back</button>
                            )}
                            {currentStep < totalSteps ? (
                                <button type="button" onClick={(e) => handleNext(e)} className="px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">Next</button>
                            ) : (
                                <button type="submit" disabled={processing} className="px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50">
                                    {processing ? "Submitting..." : "Complete Onboarding"}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </PublicLayout>
    );
}
