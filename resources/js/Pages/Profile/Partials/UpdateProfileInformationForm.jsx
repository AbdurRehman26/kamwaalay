import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Transition } from "@headlessui/react";
import { useState, useEffect } from "react";
import { profileService } from "@/services/profile";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguages } from "@/hooks/useLanguages";

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = "",
}) {
    const { user, updateUser } = useAuth();
    const { languages, loading: languagesLoading } = useLanguages();

    const [data, setData] = useState({
        name: user?.name || "",
        phone: user?.phone || "",
        age: user?.age || "",
        gender: user?.gender || "",
        religion: user?.religion?.value || user?.religion || "",
        languages: user?.languages?.map(l => l.id) || [],
    });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [recentlySuccessful, setRecentlySuccessful] = useState(false);

    // Update form data when user changes
    useEffect(() => {
        if (user) {
            setData({
                name: user.name || "",
                phone: user.phone || "",
                age: user.age || "",
                gender: user.gender || "",
                religion: user.religion?.value || user.religion || "",
                languages: user.languages?.map(l => l.id) || [],
            });
        }
    }, [user]);

    const submit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        setRecentlySuccessful(false);

        try {
            // Prepare data - convert empty strings to null for optional fields
            const submitData = {
                name: data.name,
                age: data.age ? parseInt(data.age) : null,
                gender: data.gender || null,
                religion: data.religion || null,
                languages: data.languages.length > 0 ? data.languages : null,
            };

            const response = await profileService.updateProfile(submitData);
            setRecentlySuccessful(true);
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

                {/* Only show age, gender, religion, and languages for helper users */}
                {user?.role === "helper" && (
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
