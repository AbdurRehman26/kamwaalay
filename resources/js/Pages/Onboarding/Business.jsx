import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import PublicLayout from "@/Layouts/PublicLayout";
import { useDropzone } from "react-dropzone";
import { onboardingService } from "@/services/onboarding";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";

// NIC Dropzone Component
const NICDropzone = ({ onFileAccepted, file, error, fileError, setFileError }) => {
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (file && file.type.startsWith("image/")) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setPreviewUrl(null);
        }
    }, [file]);

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

                {file ? (
                    <div className="space-y-4">
                        {previewUrl ? (
                            <div className="mx-auto w-40 h-40 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 shadow-sm">
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="text-5xl mb-2">📄</div>
                        )}
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{file.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onFileAccepted(null); }}
                                className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-semibold"
                            >
                                Remove File
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="text-5xl mb-3">📄</div>
                        <p className="text-base font-medium text-gray-700 dark:text-gray-300">{isDragActive ? "Drop here..." : "Click or Drag to Upload NIC"}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">JPG, PNG, PDF (Max 5MB)</p>
                    </>
                )}
            </div>
            {(error || fileError) && <div className="text-red-500 text-sm mt-1 font-medium">{error || fileError}</div>}
        </div>
    );
};

export default function OnboardingBusiness() {
    const navigate = useNavigate();
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && user && user.onboarding_complete) {
            navigate("/dashboard");
        }
    }, [user, isLoading, navigate]);

    // Business Data State
    const [profileData, setProfileData] = useState({
        nic: null,
        nic_number: "",
    });

    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [fileError, setFileError] = useState(null);

    const submit = async (e) => {
        e.preventDefault();

        // Validation
        const newErrors = {};
        if (!profileData.nic) newErrors.nic = "NIC document is required";
        if (!profileData.nic_number) newErrors.nic_number = "NIC number is required";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setProcessing(true);
        setErrors({});

        const formData = new FormData();
        formData.append("nic", profileData.nic);
        formData.append("nic_number", profileData.nic_number);

        try {
            await onboardingService.completeBusiness(formData);

            // Show success state
            setErrors({ success: "Verification submitted successfully! Redirecting to workers page..." });

            // Redirect after 2 seconds with full page reload
            setTimeout(() => {
                window.location.href = route("business.workers.index");
            }, 2000);
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ submit: error.response?.data?.message || "Failed to complete onboarding" });
            }
            setProcessing(false);
        }
    };

    // NIC Dropzone Component

    return (
        <PublicLayout>
            <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 text-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 relative z-10">
                    <div className="max-w-3xl">
                        <h2 className="text-indigo-300 font-bold uppercase text-sm mb-3">Business Onboarding</h2>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">Verify Your Business</h1>
                        <p className="text-xl text-indigo-100/90">Upload your NIC to verify your business identity and start adding workers.</p>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto">
                    <form onSubmit={submit} className="space-y-6">
                        {errors.success && (
                            <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 p-4 rounded-xl flex items-center gap-3">
                                <span className="text-2xl">✓</span>
                                <span className="font-medium">{errors.success}</span>
                            </div>
                        )}
                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl">{errors.submit}</div>
                        )}

                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">Verify Your Business Details</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">Upload your NIC document to verify your business identity. This helps build trust with customers and workers.</p>
                            <div className="space-y-6">
                                <div>
                                    <InputLabel value="NIC Image *" />
                                    <NICDropzone
                                        onFileAccepted={(file) => setProfileData({ ...profileData, nic: file })}
                                        file={profileData.nic}
                                        error={errors.nic}
                                        fileError={fileError}
                                        setFileError={setFileError}
                                    />
                                </div>
                                <div>
                                    <InputLabel value="NIC Number *" />
                                    <TextInput
                                        value={profileData.nic_number}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, "").slice(0, 13);
                                            setProfileData({ ...profileData, nic_number: value });
                                        }}
                                        className="mt-1 block w-full"
                                        placeholder="e.g. 4210112345671"
                                        maxLength={13}
                                        required
                                    />
                                    <InputError message={errors.nic_number} className="mt-1.5" />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 flex justify-end">
                            <button type="submit" disabled={processing} className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all">
                                {processing ? "Submitting..." : "Complete Verification"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </PublicLayout>
    );
}
