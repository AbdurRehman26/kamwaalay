import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { onboardingService } from '@/services/onboarding';
import { useAuth } from '@/contexts/AuthContext';
import { route } from '@/utils/routes';

export default function OnboardingHelper() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [offers, setOffers] = useState([{
        selectedServiceTypes: [],
        selectedLocations: [],
        work_type: '',
        monthly_rate: '',
        description: '',
    }]);

    const [locationQueries, setLocationQueries] = useState(['']);
    const [locationSuggestions, setLocationSuggestions] = useState([[]]);
    const [showLocationSuggestions, setShowLocationSuggestions] = useState([false]);
    const locationRefs = useRef([]);
    const searchTimeoutRefs = useRef([]);

    // Helper profile fields
    const [profileData, setProfileData] = useState({
        photo: null,
        nic: null,
        nic_number: '',
        skills: user?.skills || '',
        experience_years: user?.experience_years || '',
        bio: user?.bio || '',
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    const serviceTypes = [
        { value: 'maid', label: 'Maid', icon: '🧹' },
        { value: 'cook', label: 'Cook', icon: '👨‍🍳' },
        { value: 'babysitter', label: 'Babysitter', icon: '👶' },
        { value: 'caregiver', label: 'Caregiver', icon: '👵' },
        { value: 'cleaner', label: 'Cleaner', icon: '✨' },
        { value: 'all_rounder', label: 'All Rounder', icon: '🌟' },
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
                        .get('/api/locations/search', {
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
                            console.error('Error fetching locations:', error);
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
            work_type: '',
            monthly_rate: '',
            description: '',
        }]);
        setLocationQueries([...locationQueries, '']);
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
            alert('Please select a specific location (area) from the list, not just a city.');
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
                area: location.area || '',
            });
            setOffers(newOffers);
        }
        const newQueries = [...locationQueries];
        newQueries[offerIndex] = '';
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
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const submit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        
        // Validate all offers
        const validOffers = offers.filter(offer => 
            offer.selectedServiceTypes.length > 0 && 
            offer.selectedLocations.length > 0 && 
            offer.work_type
        );

        if (validOffers.length === 0) {
            alert('Please add at least one complete offer with service types, locations, and work type.');
            setProcessing(false);
            return;
        }

        // Create services array: all combinations from all offers
        const servicesArray = [];
        validOffers.forEach(offer => {
            offer.selectedServiceTypes.forEach(serviceType => {
                offer.selectedLocations.forEach(location => {
                    servicesArray.push({
                        service_type: serviceType,
                        work_type: offer.work_type,
                        city: location.city_name,
                        area: location.area,
                        monthly_rate: offer.monthly_rate || null,
                        description: offer.description || null,
                    });
                });
            });
        });

        // Prepare FormData for file uploads
        const formData = new FormData();
        formData.append('services', JSON.stringify(servicesArray));
        formData.append('skills', profileData.skills || '');
        formData.append('experience_years', profileData.experience_years || '');
        formData.append('bio', profileData.bio || '');
        formData.append('nic_number', profileData.nic_number || '');
        
        if (profileData.photo) {
            formData.append('photo', profileData.photo);
        }
        if (profileData.nic) {
            formData.append('nic', profileData.nic);
        }

        try {
            await onboardingService.completeHelper(formData);
            // Redirect to dashboard on success
            router.visit(route('dashboard'), { method: 'get' });
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ submit: [error.response?.data?.message || 'Failed to complete onboarding'] });
            }
        } finally {
            setProcessing(false);
        }
    };

    // NIC Dropzone Component
    const NICDropzone = ({ onFileAccepted, file, error }) => {
        const { getRootProps, getInputProps, isDragActive } = useDropzone({
            accept: {
                'image/*': ['.jpeg', '.jpg', '.png'],
                'application/pdf': ['.pdf']
            },
            maxFiles: 1,
            maxSize: 5 * 1024 * 1024, // 5MB
            onDrop: (acceptedFiles) => {
                if (acceptedFiles.length > 0) {
                    onFileAccepted(acceptedFiles[0]);
                }
            },
        });

        return (
            <div>
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                        isDragActive
                            ? 'border-blue-500 bg-blue-50'
                            : error
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                    }`}
                >
                    <input {...getInputProps()} required />
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
                                    {isDragActive ? 'Drop the file here' : 'Click or drag to upload NIC'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Supports: JPG, PNG, PDF (Max 5MB)
                                </p>
                            </>
                        )}
                    </div>
                </div>
                {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
            </div>
        );
    };

    // Photo Dropzone Component
    const PhotoDropzone = ({ onFileAccepted, file, error }) => {
        const { getRootProps, getInputProps, isDragActive } = useDropzone({
            accept: {
                'image/*': ['.jpeg', '.jpg', '.png']
            },
            maxFiles: 1,
            maxSize: 2 * 1024 * 1024, // 2MB
            onDrop: (acceptedFiles) => {
                if (acceptedFiles.length > 0) {
                    onFileAccepted(acceptedFiles[0]);
                }
            },
        });

        return (
            <div>
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                        isDragActive
                            ? 'border-blue-500 bg-blue-50'
                            : error
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                    }`}
                >
                    <input {...getInputProps()} />
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
                                    {isDragActive ? 'Drop the photo here' : 'Click or drag to upload photo'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Supports: JPG, PNG (Max 2MB)
                                </p>
                            </>
                        )}
                    </div>
                </div>
                {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
            </div>
        );
    };

    return (
        <PublicLayout>
            
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">Complete Your Helper Profile</h1>
                    <p className="text-xl text-white/90">Tell us about the services you offer</p>
                </div>
            </div>
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={submit} className="space-y-8">
                        {offers.map((offer, offerIndex) => (
                            <div key={offerIndex} className="bg-white rounded-lg shadow-md p-8 border-2 border-blue-200">
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
                                <div className="mb-8">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Select Service Types *</h3>
                                    <p className="text-sm text-gray-600 mb-4">Choose the services for this offer. You can select multiple.</p>
                                    
                                    {/* Selected Service Types as Tags */}
                                    {offer.selectedServiceTypes.length > 0 && (
                                        <div className="mb-4">
                                            <div className="flex flex-wrap gap-2">
                                                {offer.selectedServiceTypes.map((serviceType) => {
                                                    const service = serviceTypes.find(st => st.value === serviceType);
                                                    return (
                                                        <span
                                                            key={serviceType}
                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold"
                                                        >
                                                            <span>{service?.icon}</span>
                                                            <span>{service?.label}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeServiceTypeFromOffer(offerIndex, serviceType)}
                                                                className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
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
                                                        ? 'border-blue-500 bg-blue-50 opacity-50 cursor-not-allowed'
                                                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                                                }`}
                                            >
                                                <div className="text-3xl mb-2">{service.icon}</div>
                                                <div className="font-semibold text-gray-900">{service.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Locations Selection */}
                                <div className="mb-8">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Select Locations *</h3>
                                    <p className="text-sm text-gray-600 mb-4">Add locations for this offer. You can add multiple locations.</p>
                                    
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
                                            className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 px-4 py-3"
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
                                                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
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
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Work Type *</label>
                                        <select
                                            value={offer.work_type}
                                            onChange={(e) => updateOffer(offerIndex, 'work_type', e.target.value)}
                                            className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select Type</option>
                                            <option value="full_time">Full Time</option>
                                            <option value="part_time">Part Time</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Rate (PKR)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={offer.monthly_rate}
                                            onChange={(e) => updateOffer(offerIndex, 'monthly_rate', e.target.value)}
                                            className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="e.g., 15000"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                        <textarea
                                            value={offer.description}
                                            onChange={(e) => updateOffer(offerIndex, 'description', e.target.value)}
                                            rows={4}
                                            className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="Describe this service offer..."
                                        />
                                    </div>
                                </div>

                                {/* Preview for this offer */}
                                {offer.selectedServiceTypes.length > 0 && offer.selectedLocations.length > 0 && offer.work_type && (
                                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <p className="text-sm font-semibold text-blue-900 mb-2">
                                            This offer will create 1 service listing with:
                                        </p>
                                        <div className="text-xs text-blue-700 space-y-1">
                                            <div>
                                                <span className="font-semibold">{offer.selectedServiceTypes.length}</span> service type(s): {offer.selectedServiceTypes.map((st) => {
                                                    const service = serviceTypes.find(s => s.value === st);
                                                    return service?.label;
                                                }).join(', ')}
                                            </div>
                                            <div>
                                                <span className="font-semibold">{offer.selectedLocations.length}</span> location(s): {offer.selectedLocations.map(loc => loc.display_text).join(', ')}
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
                                className="w-full border-2 border-dashed border-blue-300 text-blue-600 py-4 rounded-lg hover:bg-blue-50 transition font-semibold"
                            >
                                + Add Another Service Offer
                            </button>
                        </div>

                        {/* Profile Verification Section */}
                        <div className="bg-white rounded-lg shadow-md p-8 border-2 border-blue-200">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Verification</h2>
                            <p className="text-sm text-gray-600 mb-6">Please upload your documents for verification</p>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        National Identity Card (NIC) <span className="text-red-500">*</span>
                                    </label>
                                    <p className="text-xs text-gray-500 mb-2">Upload a clear photo or scan of your NIC (front and back if needed)</p>
                                    <NICDropzone
                                        onFileAccepted={(file) => setProfileData({ ...profileData, nic: file })}
                                        file={profileData.nic}
                                        error={errors.nic}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        NIC Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={profileData.nic_number}
                                        onChange={(e) => setProfileData({ ...profileData, nic_number: e.target.value })}
                                        className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
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
                                        onFileAccepted={(file) => setProfileData({ ...profileData, photo: file })}
                                        file={profileData.photo}
                                        error={errors.photo}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Helper Profile Section */}
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Profile</h2>
                            <p className="text-sm text-gray-600 mb-6">Optional: Add more details about yourself</p>

                            <div className="space-y-6">

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                                    <input
                                        type="text"
                                        value={profileData.skills}
                                        onChange={(e) => setProfileData({ ...profileData, skills: e.target.value })}
                                        className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="e.g., Cooking, Cleaning, Childcare"
                                    />
                                    {errors.skills && <div className="text-red-500 text-sm mt-1">{errors.skills}</div>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={profileData.experience_years}
                                        onChange={(e) => setProfileData({ ...profileData, experience_years: e.target.value })}
                                        className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
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
                                        className="w-full border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="Tell us about yourself..."
                                    />
                                    {errors.bio && <div className="text-red-500 text-sm mt-1">{errors.bio}</div>}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="bg-white rounded-lg shadow-md p-8">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300 font-semibold disabled:opacity-50"
                            >
                                {processing ? 'Completing Profile...' : 'Complete Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </PublicLayout>
    );
}
