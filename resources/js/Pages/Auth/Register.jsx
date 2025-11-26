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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-primary-100 to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl w-full space-y-8">
                    <div>
                        <h2 className="mt-6 text-center text-4xl font-extrabold text-gray-900">
                            Create Your Account
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Already have an account?{" "}
                            <Link
                                to={route("login")}
                                className="font-medium text-primary-600 hover:text-primary-500"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>

                    {/* General Error Message (shown before form) */}
                    {errors.error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-red-800">{errors.error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form className="mt-8 space-y-6 bg-white rounded-2xl shadow-xl p-8" onSubmit={submit}>
                        {/* Role Selection */}
                        <div>
                            <InputLabel value="I want to" className="text-gray-700 font-medium mb-4" />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button
                                    type="button"
                                    onClick={() => handleRoleChange("user")}
                                    className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                                        selectedRole === "user"
                                            ? "border-primary-500 bg-primary-50 shadow-lg"
                                            : "border-gray-200 hover:border-primary-300 bg-white"
                                    }`}
                                >
                                    <div className="text-4xl mb-3">👤</div>
                                    <h3 className="font-bold text-lg text-gray-900 mb-2">Find Help</h3>
                                    <p className="text-sm text-gray-600">Book helpers for your home</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRoleChange("helper")}
                                    className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                                        selectedRole === "helper"
                                            ? "border-primary-500 bg-primary-50 shadow-lg"
                                            : "border-gray-200 hover:border-primary-300 bg-white"
                                    }`}
                                >
                                    <div className="text-4xl mb-3">💼</div>
                                    <h3 className="font-bold text-lg text-gray-900 mb-2">Work as Helper</h3>
                                    <p className="text-sm text-gray-600">Offer your services</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRoleChange("business")}
                                    className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                                        selectedRole === "business"
                                            ? "border-primary-500 bg-primary-50 shadow-lg"
                                            : "border-gray-200 hover:border-primary-300 bg-white"
                                    }`}
                                >
                                    <div className="text-4xl mb-3">🏢</div>
                                    <h3 className="font-bold text-lg text-gray-900 mb-2">Agency/Business</h3>
                                    <p className="text-sm text-gray-600">Manage multiple workers</p>
                                </button>
                            </div>
                            <InputError message={errors.role} className="mt-2" />
                        </div>

                        <div className="space-y-6">
                            <div>
                                <InputLabel htmlFor="name" value="Full Name" className="text-gray-700 font-medium" />
                                <TextInput
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    autoComplete="name"
                                    isFocused={true}
                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                    required
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="phone" value="Phone Number" className="text-gray-700 font-medium" />
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-300 rounded-l-lg">
                                        <span className="text-2xl">🇵🇰</span>
                                        <span className="text-sm font-medium text-gray-700">+92</span>
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                    <TextInput
                                        id="phone"
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        className="flex-1 rounded-r-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        autoComplete="tel"
                                        onChange={(e) => handleInputChange("phone", e.target.value)}
                                        placeholder="Enter your phone number"
                                        required
                                    />
                                </div>
                                <InputError message={errors.phone} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="address" value="Address" className="text-gray-700 font-medium" />
                                <TextInput
                                    id="address"
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    autoComplete="street-address"
                                    onChange={(e) => handleInputChange("address", e.target.value)}
                                    placeholder="Your address (optional)"
                                />
                                <InputError message={errors.address} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="password" value="Password" className="text-gray-700 font-medium" />
                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
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
                                    className="text-gray-700 font-medium"
                                />
                                <TextInput
                                    id="password_confirmation"
                                    type="password"
                                    name="password_confirmation"
                                    value={formData.password_confirmation}
                                    className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
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

                        <div>
                            <PrimaryButton
                                className="w-full flex justify-center bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-3 px-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={processing}
                            >
                                {processing ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Account...
                                    </span>
                                ) : (
                                    "Create Account"
                                )}
                            </PrimaryButton>
                            
                            {/* Show processing state */}
                            {processing && (
                                <div className="mt-4 text-center">
                                    <p className="text-sm text-gray-600 animate-pulse">Please wait while we create your account...</p>
                                </div>
                            )}
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                By registering, you agree to our{" "}
                                <Link to={route("terms")} className="text-primary-600 hover:text-primary-500">
                                    Terms
                                </Link>{" "}
                                and{" "}
                                <Link to={route("privacy")} className="text-primary-600 hover:text-primary-500">
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
