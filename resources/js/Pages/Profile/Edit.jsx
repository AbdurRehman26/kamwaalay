import DashboardLayout from "@/Layouts/DashboardLayout";
import { useState, useEffect } from "react";
import DeleteUserForm from "./Partials/DeleteUserForm";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "./Partials/UpdateProfileInformationForm";
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
            <DashboardLayout>
                <div className="py-12">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 text-center">
                        <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !profileData) {
        return (
            <DashboardLayout>
                <div className="py-12">
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 text-center">
                        <p className="text-red-600 dark:text-red-400">{error || "Failed to load profile"}</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }
    return (
        <DashboardLayout>
            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={profileData.must_verify_email}
                            status={profileData.status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
