import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Transition } from "@headlessui/react";
import { useState, useEffect, useRef } from "react";
import { profileService } from "@/services/profile";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguages } from "@/hooks/useLanguages";
import axios from "axios";
import toast from "react-hot-toast";

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = "",
}) {
    const { user, updateUser } = useAuth();
    const { languages, loading: languagesLoading } = useLanguages();
    const [cities, setCities] = useState([]);
    const pinAddressInputRef = useRef(null);
    const autocompleteRef = useRef(null);
    const [gettingLocation, setGettingLocation] = useState(false);

    const [data, setData] = useState({
        name: user?.name || "",
        phone: user?.phone || "",
        city_id: user?.city_id || "",
        age: user?.age || "",
        gender: user?.gender || "",
        religion: user?.religion?.value || user?.religion || "",
        languages: user?.languages?.map(l => l.id) || [],
        // Location fields for helpers
        pin_address: user?.profile?.pin_address || "",
        pin_latitude: user?.profile?.pin_latitude || "",
        pin_longitude: user?.profile?.pin_longitude || "",
    });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [recentlySuccessful, setRecentlySuccessful] = useState(false);

    // Fetch cities on mount
    useEffect(() => {
        axios.get("/api/cities")
            .then((response) => {
                setCities(response.data.data || response.data || []);
            })
            .catch((error) => {
                console.error("Error fetching cities:", error);
            });
    }, []);

    // Update form data when user changes
    useEffect(() => {
        if (user) {
            setData({
                name: user.name || "",
                phone: user.phone || "",
                city_id: user.city_id || "",
                age: user.age || "",
                gender: user.gender || "",
                religion: user.religion?.value || user.religion || "",
                languages: user.languages?.map(l => l.id) || [],
                pin_address: user.profile?.pin_address || "",
                pin_latitude: user.profile?.pin_latitude || "",
                pin_longitude: user.profile?.pin_longitude || "",
            });
        }
    }, [user]);

    // Initialize Google Places Autocomplete for helper location
    useEffect(() => {
        const isHelper = user?.role === "helper" || user?.roles?.includes("helper");
        if (isHelper && pinAddressInputRef.current && window.google?.maps?.places) {
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
                        setData(prev => ({
                            ...prev,
                            pin_address: place.formatted_address,
                            pin_latitude: lat ? lat.toString() : "",
                            pin_longitude: lng ? lng.toString() : ""
                        }));
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
    }, [user?.role]);

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            setErrors({ ...errors, pin_address: "Geolocation is not supported by your browser." });
            return;
        }

        if (!window.google?.maps?.Geocoder) {
            setErrors({ ...errors, pin_address: "Google Maps API is not loaded. Please refresh the page." });
            return;
        }

        setGettingLocation(true);
        setErrors({ ...errors, pin_address: null });

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const geocoder = new window.google.maps.Geocoder();
                geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
                    if (status === "OK" && results?.[0]) {
                        setData(prev => ({
                            ...prev,
                            pin_address: results[0].formatted_address,
                            pin_latitude: latitude.toString(),
                            pin_longitude: longitude.toString()
                        }));
                    } else {
                        setData(prev => ({
                            ...prev,
                            pin_address: `${latitude}, ${longitude}`,
                            pin_latitude: latitude.toString(),
                            pin_longitude: longitude.toString()
                        }));
                    }
                    setGettingLocation(false);
                });
            },
            (error) => {
                setErrors({ ...errors, pin_address: "Unable to get your location. Please enter manually." });
                setGettingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const submit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        setRecentlySuccessful(false);

        try {
            // Prepare data - convert empty strings to null for optional fields
            const submitData = {
                name: data.name,
                city_id: data.city_id ? parseInt(data.city_id) : null,
                age: data.age ? parseInt(data.age) : null,
                gender: data.gender || null,
                religion: data.religion || null,
                languages: data.languages.length > 0 ? data.languages : null,
                // Include location for helpers
                pin_address: data.pin_address || null,
                pin_latitude: data.pin_latitude ? parseFloat(data.pin_latitude) : null,
                pin_longitude: data.pin_longitude ? parseFloat(data.pin_longitude) : null,
            };

            const response = await profileService.updateProfile(submitData);
            setRecentlySuccessful(true);
            toast.success("Profile updated successfully!");
            // Update the user in AuthContext
            if (response.user) {
                updateUser(response.user);
            }
            // Hide success message after 2 seconds
            setTimeout(() => setRecentlySuccessful(false), 2000);
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ submit: [error.response?.data?.message || "Failed to update profile"] });
            }
        } finally {
            setProcessing(false);
        }
    };

    const toggleLanguage = (languageId) => {
        if (data.languages.includes(languageId)) {
            setData({
                ...data,
                languages: data.languages.filter(id => id !== languageId)
            });
        } else {
            setData({
                ...data,
                languages: [...data.languages, languageId]
            });
        }
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Profile Information
                </h2>

                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Update your account's profile information.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData({ ...data, name: e.target.value })}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="phone" value="Phone" />

                    <TextInput
                        id="phone"
                        type="tel"
                        className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                        value={data.phone}
                        disabled
                    />

                    <InputError className="mt-2" message={errors.phone} />
                </div>

                <div>
                    <InputLabel htmlFor="city_id" value="City" />

                    <select
                        id="city_id"
                        className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                        value={data.city_id}
                        onChange={(e) => setData({ ...data, city_id: e.target.value })}
                    >
                        <option value="">Select City</option>
                        {cities.map((city) => (
                            <option key={city.id} value={city.id}>
                                {city.name}
                            </option>
                        ))}
                    </select>

                    <InputError className="mt-2" message={errors.city_id} />
                </div>

                {/* Only show age, gender, religion, languages, and location for helper users */}
                {(user?.role === "helper" || user?.roles?.includes("helper")) && (
                    <>
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
                                autoComplete="off"
                            />

                            <InputError className="mt-2" message={errors.age} />
                        </div>

                        <div>
                            <InputLabel htmlFor="gender" value="Gender" />

                            <select
                                id="gender"
                                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                value={data.gender}
                                onChange={(e) => setData({ ...data, gender: e.target.value })}
                            >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>

                            <InputError className="mt-2" message={errors.gender} />
                        </div>

                        <div>
                            <InputLabel htmlFor="religion" value="Religion" />

                            <select
                                id="religion"
                                className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                                value={data.religion}
                                onChange={(e) => setData({ ...data, religion: e.target.value })}
                            >
                                <option value="">Select Religion</option>
                                <option value="sunni_nazar_niyaz">Sunni (Nazar Niyaz)</option>
                                <option value="sunni_no_nazar_niyaz">Sunni (No Nazar Niyaz)</option>
                                <option value="shia">Shia</option>
                                <option value="christian">Christian</option>
                            </select>

                            <InputError className="mt-2" message={errors.religion} />
                        </div>

                        <div>
                            <InputLabel htmlFor="languages" value="Languages" />
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                Select the languages you speak
                            </p>

                            {data.languages.length > 0 && (
                                <div className="mt-3 mb-4">
                                    <div className="flex flex-wrap gap-2">
                                        {data.languages.map((languageId) => {
                                            const language = languages.find(l => l.id === languageId);
                                            return (
                                                <span
                                                    key={languageId}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold border-2 border-blue-200 dark:border-blue-700"
                                                >
                                                    <span>{language?.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleLanguage(languageId)}
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

                            {languagesLoading ? (
                                <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading languages...</div>
                            ) : (
                                <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {languages.map((language) => (
                                        <button
                                            key={language.id}
                                            type="button"
                                            onClick={() => toggleLanguage(language.id)}
                                            disabled={data.languages.includes(language.id)}
                                            className={`p-3 rounded-xl border-2 transition-all duration-300 text-left ${data.languages.includes(language.id)
                                                ? "border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 opacity-50 cursor-not-allowed"
                                                : "border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer bg-white dark:bg-gray-700"
                                                }`}
                                        >
                                            <div className="font-semibold text-gray-900 dark:text-white">{language.name}</div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            <InputError className="mt-2" message={errors.languages} />
                        </div>

                        {/* Service Location for helpers */}
                        <div>
                            <InputLabel htmlFor="pin_address" value="Service Location" />
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                Enter the address where you provide services
                            </p>

                            <div className="mt-2 flex gap-2">
                                <TextInput
                                    ref={pinAddressInputRef}
                                    id="pin_address"
                                    className="flex-1"
                                    value={data.pin_address}
                                    onChange={(e) => setData({ ...data, pin_address: e.target.value })}
                                    placeholder="Start typing address..."
                                />
                                <button
                                    type="button"
                                    onClick={handleGetCurrentLocation}
                                    disabled={gettingLocation}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {gettingLocation ? (
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

                            <InputError className="mt-2" message={errors.pin_address} />
                        </div>
                    </>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Saved.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
