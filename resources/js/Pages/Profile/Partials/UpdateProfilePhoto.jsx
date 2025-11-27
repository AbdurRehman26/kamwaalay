import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import { Transition } from "@headlessui/react";
import { useState, useEffect, useRef } from "react";
import { profileService } from "@/services/profile";
import { useAuth } from "@/contexts/AuthContext";

export default function UpdateProfilePhoto({ className = "" }) {
    const { user, updateUser } = useAuth();

    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(user?.photo ? `/storage/${user.photo}` : null);
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [recentlySuccessful, setRecentlySuccessful] = useState(false);
    const fileInputRef = useRef(null);

    // Update photo preview when user changes
    useEffect(() => {
        if (user) {
            setPhotoPreview(user?.photo ? `/storage/${user.photo}` : null);
        }
    }, [user]);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (2MB max)
            if (file.size > 2 * 1024 * 1024) {
                setErrors({ photo: ["Image size must be less than 2MB"] });
                return;
            }
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setErrors({ photo: ["File must be an image"] });
                return;
            }
            setErrors({});
            setPhoto(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removePhoto = () => {
        setPhoto(null);
        setPhotoPreview(user?.photo ? `/storage/${user.photo}` : null);
        setErrors({});
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!photo) {
            setErrors({ photo: ["Please select an image"] });
            return;
        }

        setProcessing(true);
        setErrors({});
        setRecentlySuccessful(false);

        try {
            const formData = new FormData();
            formData.append('photo', photo);

            const response = await profileService.updatePhoto(formData);
            setRecentlySuccessful(true);
            // Update the user in AuthContext
            if (response.user) {
                updateUser(response.user);
            }
            // Clear photo state after successful upload
            setPhoto(null);
            // Hide success message after 2 seconds
            setTimeout(() => setRecentlySuccessful(false), 2000);
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ photo: [error.response?.data?.message || "Failed to upload photo"] });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Profile Photo
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Update your profile photo.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="photo" value="Profile Photo" />
                    <div className="mt-2 flex items-center gap-4">
                        {photoPreview && (
                            <div className="relative">
                                <img
                                    src={photoPreview}
                                    alt="Profile preview"
                                    className="h-20 w-20 rounded-full object-cover border-2 border-gray-300"
                                />
                                {photo && (
                                    <button
                                        type="button"
                                        onClick={removePhoto}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        )}
                        <div className="flex-1">
                            <input
                                ref={fileInputRef}
                                id="photo"
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                            />
                            <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
                        </div>
                    </div>
                    <InputError className="mt-2" message={errors.photo} />
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing || !photo}>
                        Upload Photo
                    </PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">
                            Photo uploaded successfully.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}


