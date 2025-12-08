import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Link } from "react-router-dom"; import { useNavigate } from "react-router-dom";
import PublicLayout from "@/Layouts/PublicLayout";
import { useState } from "react";
import { authService } from "@/services/auth";
import { route } from "@/utils/routes";

export default function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        password: "",
        password_confirmation: "",
        role: "user",
        phone: "",
        address: "",
    });
    const [selectedRole, setSelectedRole] = useState("user");
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    const handleRoleChange = (role) => {
        setSelectedRole(role);
        setFormData(prev => ({ ...prev, role }));
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            const response = await authService.register(formData);
            
            // After registration, always redirect to OTP verification
            // Store verification info for OTP verification
            if (response.verification_token) {
                authService.setVerificationToken(response.verification_token);
            }
            if (response.user_id) {
                // Store user_id in localStorage for OTP verification
                localStorage.setItem("verification_user_id", response.user_id);
            }
            if (response.verification_method) {
                localStorage.setItem("verification_method", response.verification_method);
            }
            if (response.identifier) {
                localStorage.setItem("verification_identifier", response.identifier);
            }
            
            // Store the actual phone used for signup (not masked)
            if (response.verification_method === "phone" && formData.phone) {
                localStorage.setItem("verification_phone", formData.phone);
            }
            
            // Always navigate to verify OTP after registration
            navigate("/verify-otp");
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                // Scroll to first error
                setTimeout(() => {
                    const firstErrorField = Object.keys(error.response.data.errors)[0];
                    const errorElement = document.querySelector(`[name="${firstErrorField}"], #${firstErrorField}`);
                    if (errorElement) {
                        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
                        errorElement.focus();
                    }
                }, 100);
            } else {
                setErrors({ error: [error.response?.data?.message || "Registration failed. Please try again."] });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <PublicLayout>
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 text-white overflow-hidden py-16 md:py-24">
                {/* Abstract Background Shapes */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Create Your Account</h1>
                    <p className="text-xl text-indigo-100/90 max-w-2xl mx-auto leading-relaxed">
                        Join us and start your journey today
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 pb-20">
                <div className="max-w-2xl w-full mx-auto">
                    <div className="text-center mb-8">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Already have an account?{" "}
                            <Link
                                to={route("login")}
                                className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>

                    {/* General Error Message (shown before form) */}
                    {errors.error && (
                        <div className="mb-8 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 rounded-xl">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400 dark:text-red-300" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-red-800 dark:text-red-300">{errors.error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 relative z-20 -mt-16 space-y-6" onSubmit={submit}>
                        {/* Role Selection */}
                        <div>
                            <InputLabel value="I want to" className="text-gray-700 dark:text-gray-300 font-bold mb-4 uppercase tracking-wide" />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button
                                    type="button"
                                    onClick={() => handleRoleChange("user")}
                                    className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                                        selectedRole === "user"
                                            ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 shadow-lg"
                                            : "border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600 bg-white dark:bg-gray-700"
                                    }`}
                                >
                                    <div className="text-4xl mb-3">👤</div>
                                    <h3 className={`font-bold text-lg mb-2 ${selectedRole === "user" ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-white"}`}>Find Help</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Book helpers for your home</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRoleChange("helper")}
                                    className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                                        selectedRole === "helper"
                                            ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 shadow-lg"
                                            : "border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600 bg-white dark:bg-gray-700"
                                    }`}
                                >
                                    <div className="text-4xl mb-3">💼</div>
                                    <h3 className={`font-bold text-lg mb-2 ${selectedRole === "helper" ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-white"}`}>Work as Helper</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Offer your services</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRoleChange("business")}
                                    className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                                        selectedRole === "business"
                                            ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 shadow-lg"
                                            : "border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600 bg-white dark:bg-gray-700"
                                    }`}
                                >
                                    <div className="text-4xl mb-3">🏢</div>
                                    <h3 className={`font-bold text-lg mb-2 ${selectedRole === "business" ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-white"}`}>Agency/Business</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage multiple workers</p>
                                </button>
                            </div>
                            <InputError message={errors.role} className="mt-2" />
                        </div>

                        <div className="space-y-6">
                            <div>
                                <InputLabel htmlFor="name" value="Full Name" className="text-gray-700 dark:text-gray-300 font-bold uppercase tracking-wide" />
                                <TextInput
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    className="mt-2 block w-full rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                    autoComplete="name"
                                    isFocused={true}
                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                    required
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="phone" value="Phone Number" className="text-gray-700 dark:text-gray-300 font-bold uppercase tracking-wide" />
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-l-xl">
                                        <span className="text-2xl">🇵🇰</span>
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">+92</span>
                                        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                    <TextInput
                                        id="phone"
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        className="flex-1 rounded-r-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                        autoComplete="tel"
                                        onChange={(e) => handleInputChange("phone", e.target.value)}
                                        placeholder="Enter your phone number"
                                        required
                                    />
                                </div>
                                <InputError message={errors.phone} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="address" value="Address" className="text-gray-700 dark:text-gray-300 font-bold uppercase tracking-wide" />
                                <TextInput
                                    id="address"
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    className="mt-2 block w-full rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                    autoComplete="street-address"
                                    onChange={(e) => handleInputChange("address", e.target.value)}
                                    placeholder="Your address (optional)"
                                />
                                <InputError message={errors.address} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="password" value="Password" className="text-gray-700 dark:text-gray-300 font-bold uppercase tracking-wide" />
                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    className="mt-2 block w-full rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                    autoComplete="new-password"
                                    onChange={(e) => handleInputChange("password", e.target.value)}
                                    required
                                />
                                <InputError message={errors.password} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="password_confirmation"
                                    value="Confirm Password"
                                    className="text-gray-700 dark:text-gray-300 font-bold uppercase tracking-wide"
                                />
                                <TextInput
                                    id="password_confirmation"
                                    type="password"
                                    name="password_confirmation"
                                    value={formData.password_confirmation}
                                    className="mt-2 block w-full rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                    autoComplete="new-password"
                                    onChange={(e) => handleInputChange("password_confirmation", e.target.value)}
                                    required
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                    className="mt-2"
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                            <PrimaryButton
                                className="w-full flex justify-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={processing}
                            >
                                {processing ? (
                                    <span className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Creating Account...
                                    </span>
                                ) : (
                                    "Create Account"
                                )}
                            </PrimaryButton>
                            
                            {/* Show processing state */}
                            {processing && (
                                <div className="mt-4 text-center">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse font-medium">Please wait while we create your account...</p>
                                </div>
                            )}

                            <div className="mt-4 text-center">
                                <Link
                                    to={route("login")}
                                    className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                                >
                                    <span>←</span>
                                    Back to Login
                                </Link>
                            </div>
                        </div>

                        <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                By registering, you agree to our{" "}
                                <Link to={route("terms")} className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
                                    Terms
                                </Link>{" "}
                                and{" "}
                                <Link to={route("privacy")} className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
                                    Privacy Policy
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </PublicLayout>
    );
}
