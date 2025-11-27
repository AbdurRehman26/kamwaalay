import PublicLayout from "@/Layouts/PublicLayout";
import { useState, useEffect } from "react";
import DeleteUserForm from "./Partials/DeleteUserForm";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "./Partials/UpdateProfileInformationForm";
import UpdateProfilePhoto from "./Partials/UpdateProfilePhoto";
import { profileService } from "@/services/profile";

export default function Edit() {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        profileService.getProfile()
            .then((response) => {
                setProfileData(response);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching profile:", err);
                setError(err.response?.data?.message || "Failed to load profile");
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <PublicLayout>
                <div className="py-12">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 text-center">
                        <p className="text-gray-600">Loading profile...</p>
                    </div>
                </div>
            </PublicLayout>
        );
    }

    if (error || !profileData) {
        return (
            <PublicLayout>
                <div className="py-12">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 text-center">
                        <p className="text-red-600">{error || "Failed to load profile"}</p>
                    </div>
                </div>
            </PublicLayout>
        );
    }
    return (
        <PublicLayout>
            

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
                        <UpdateProfilePhoto className="max-w-xl" />
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={profileData.must_verify_email}
                            status={profileData.status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
