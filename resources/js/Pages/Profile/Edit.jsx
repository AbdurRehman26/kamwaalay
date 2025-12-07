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
                <div className="flex h-[calc(100vh-64px)] items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-gray-500 animate-pulse">Loading profile...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !profileData) {
        return (
            <DashboardLayout>
                <div className="flex h-[calc(100vh-64px)] items-center justify-center">
                    <div className="text-center p-8 max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-red-100 dark:border-red-900/30">
                        <div className="text-4xl mb-4">⚠️</div>
                        <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Something went wrong</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">{error || "Failed to load profile"}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }
    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-10 relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none">
                    <div className="relative z-10">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">Profile Settings</h1>
                        <p className="text-indigo-100 text-lg max-w-2xl">
                            Manage your account information and security settings.
                        </p>
                    </div>
                    {/* Decorative blobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-20 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl transform translate-y-1/2"></div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={profileData.must_verify_email}
                            status={profileData.status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
