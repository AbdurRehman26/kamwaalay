import Checkbox from "@/Components/Checkbox";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Link } from "react-router-dom"; import { useNavigate } from "react-router-dom";
import PublicLayout from "@/Layouts/PublicLayout";
import { useState } from "react";
import { authService } from "@/services/auth";
import { useAuth } from "@/contexts/AuthContext";
import { route } from "@/utils/routes";

export default function Login() {
    const navigate = useNavigate();


    const { login, updateUser } = useAuth();
    const [authMethod, setAuthMethod] = useState("password"); // 'otp' or 'password'
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");



    const submit = async (e) => {
        // ... existing submit logic ...
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        setMessage("");

        // ... (keep existing logic) ...
        try {
            // Format phone number to +92xxxxx format
            const formatPhoneNumber = (phone) => {
                // Remove all non-numeric characters except +
                let formatted = phone.replace(/[^0-9+]/g, "");

                // Remove leading + if present (we'll add it back)
                formatted = formatted.replace(/^\+/, "");

                // Handle different formats
                if (formatted.startsWith("0092")) {
                    // Format: 0092xxxxxxxxx -> +92xxxxxxxxx
                    formatted = formatted.substring(2); // Remove 00, keep 92
                } else if (formatted.startsWith("92") && formatted.length >= 12) {
                    // Format: 92xxxxxxxxx -> +92xxxxxxxxx (already has country code)
                    // Keep as is
                } else if (formatted.startsWith("0") && formatted.length >= 10) {
                    // Format: 03xxxxxxxxx -> +923xxxxxxxxx (local format starting with 0)
                    formatted = "92" + formatted.substring(1); // Remove leading 0, add 92
                } else if (formatted.length >= 10 && formatted.length <= 11) {
                    // Format: 3xxxxxxxxx (10-11 digits without leading 0 or country code)
                    // Assume it's a local number, add 92
                    formatted = "92" + formatted;
                } else if (formatted.length < 10) {
                    // Too short, might be incomplete - still try to format
                    if (!formatted.startsWith("92")) {
                        formatted = "92" + formatted;
                    }
                }

                // Ensure it starts with +
                if (!formatted.startsWith("+")) {
                    formatted = "+" + formatted;
                }

                return formatted;
            };

            const data = {
                phone: formatPhoneNumber(phone),
                password: authMethod === "password" ? password : "",
                remember: remember,
            };

            const response = await login(data);
            handleLoginSuccess(response);

        } catch (error) {
            handleLoginError(error);
        } finally {
            setProcessing(false);
        }
    };

    const handleLoginSuccess = (response) => {
        if (response.verification_method) {
            // OTP verification required (account not verified)
            setMessage(response.message || "Please check your phone for the verification code.");
            // Store verification token for OTP verification
            if (response.verification_token) {
                authService.setVerificationToken(response.verification_token);
            }
            // Store phone number and method for OTP verification page
            localStorage.setItem("verification_phone", phone);
            localStorage.setItem("verification_method", response.verification_method);
            navigate("/verify-otp");
        } else if (response.token) {
            // Direct login success (account is verified)
            // Update user state in AuthContext
            if (response.user) {
                updateUser(response.user);
            }

            // Redirect based on onboarding status
            if (response.redirect) {
                // If redirect is an object with route info, convert route name to path
                let redirectPath;
                if (typeof response.redirect === "string") {
                    redirectPath = response.redirect;
                } else {
                    const routeName = response.redirect.route || "/dashboard";
                    // Convert route names to paths
                    if (routeName === "onboarding.helper") {
                        redirectPath = "/onboarding/helper";
                    } else if (routeName === "onboarding.business") {
                        redirectPath = "/onboarding/business";
                    } else if (routeName === "profile.edit") {
                        redirectPath = "/profile";
                    } else {
                        redirectPath = routeName;
                    }
                }
                navigate(redirectPath);
            } else if (response.user && !response.user.onboarding_complete) {
                // Check onboarding status from user object
                if (response.user.role === "helper") {
                    navigate("/onboarding/helper");
                } else if (response.user.role === "business") {
                    navigate("/onboarding/business");
                } else {
                    navigate("/home");
                }
            } else {
                // Redirect to home if onboarding is completed
                navigate(route("home"));
            }
        }
    };

    const handleLoginError = (error) => {
        if (error.response?.data?.errors) {
            setErrors(error.response.data.errors);
        } else {
            setErrors({ phone: [error.response?.data?.message || "Login failed. Please try again."] });
        }
    };

    const handleTestLogin = async (role) => {
        setProcessing(true);
        setErrors({});
        setMessage("");

        const demoNumbers = {
            "business": "9876543210",
            "helper": "9876543211",
            "user": "9876543212"
        };

        const demoPhone = demoNumbers[role];

        if (!demoPhone) {
            setMessage("Invalid role for test login");
            setProcessing(false);
            return;
        }

        try {
            // Call standard login with dummy number
            const data = {
                phone: demoPhone,
                password: "", // No password for demo login
                remember: false,
            };

            const response = await login(data);
            handleLoginSuccess(response);
        } catch (error) {
            handleLoginError(error);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <PublicLayout>
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 text-white overflow-hidden py-12 md:py-16">
                {/* Abstract Background Shapes */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">Welcome Back</h1>
                    <p className="text-lg text-indigo-100/90 max-w-2xl mx-auto">
                        Sign in to your account to continue
                    </p>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 py-4 px-4 sm:px-6 lg:px-8 pb-0">
                <div className="max-w-md w-full mx-auto my-6">
                    <div className="text-center mb-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Don't have an account?{" "}
                            <Link
                                to={route("register")}
                                className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                            >
                                Create a new account
                            </Link>
                        </p>
                    </div>

                    {message && (
                        <div className={`mb-3 rounded-xl p-3 border-l-4 ${errors.phone ? "bg-red-50 dark:bg-red-900/20 border-red-500" : "bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-400"}`}>
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    {errors.phone ? (
                                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5 text-green-400 dark:text-green-300" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                                <div className="ml-3">
                                    <p className={`text-sm font-medium ${errors.phone ? "text-red-800 dark:text-red-300" : "text-green-800 dark:text-green-300"}`}>{message}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form className="bg-white dark:bg-gray-800 mb-6 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 relative z-20 mt-5 space-y-2" onSubmit={submit}>
                        {/* Authenticate Method Selection */}
                        <div>
                            <InputLabel value="Authenticate with" className="text-gray-700 dark:text-gray-300 font-bold mb-2 text-sm uppercase tracking-wide" />
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAuthMethod("password");
                                    }}
                                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${authMethod === "password"
                                        ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 shadow-lg"
                                        : "border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600 bg-white dark:bg-gray-700"
                                        }`}
                                >
                                    <div className="text-2xl mb-1">🔒</div>
                                    <h3 className={`font-bold text-sm ${authMethod === "password" ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-white"}`}>Password</h3>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAuthMethod("otp");
                                        setPassword("");
                                    }}
                                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${authMethod === "otp"
                                        ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 shadow-lg"
                                        : "border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600 bg-white dark:bg-gray-700"
                                        }`}
                                >
                                    <div className="text-2xl mb-1">💬</div>
                                    <h3 className={`font-bold text-sm ${authMethod === "otp" ? "text-indigo-600 dark:text-indigo-400" : "text-gray-900 dark:text-white"}`}>OTP</h3>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <InputLabel htmlFor="phone" value="Phone Number" className="text-gray-700 dark:text-gray-300 font-bold text-sm uppercase tracking-wide mb-2" />
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-l-xl">
                                        <span className="text-xl">🇵🇰</span>
                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">+92</span>
                                    </div>
                                    <TextInput
                                        id="phone"
                                        type="tel"
                                        name="phone"
                                        value={phone}
                                        className="flex-1 rounded-r-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 py-2.5"
                                        autoComplete="tel"
                                        isFocused={true}
                                        onChange={(e) => {
                                            let value = e.target.value;
                                            // Remove any non-numeric characters
                                            value = value.replace(/\D/g, "");
                                            // Remove leading +92, 92, or 0 if present
                                            if (value.startsWith("92")) {
                                                value = value.substring(2);
                                            } else if (value.startsWith("0")) {
                                                value = value.substring(1);
                                            }
                                            // Enforce max length of 10 digits
                                            if (value.length > 10) {
                                                value = value.substring(0, 10);
                                            }
                                            setPhone(value);
                                        }}
                                        placeholder="3001234567"
                                        required
                                    />
                                </div>
                                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                    Enter your 10-digit mobile number without country code. Example: 3001234567
                                </p>
                                <InputError message={errors.phone} className="mt-1.5" />
                            </div>

                            {authMethod === "password" && (
                                <div>
                                    <InputLabel htmlFor="password" value="Password" className="text-gray-700 dark:text-gray-300 font-bold text-sm uppercase tracking-wide mb-2" />
                                    <TextInput
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={password}
                                        className="block w-full rounded-xl border-2 border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 py-2.5"
                                        autoComplete="current-password"
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.password} className="mt-1.5" />
                                </div>
                            )}
                        </div>

                        {authMethod === "password" && (
                            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                                <label className="flex items-center">
                                    <Checkbox
                                        name="remember"
                                        checked={remember}
                                        onChange={(e) => setRemember(e.target.checked)}
                                        className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 font-medium">Remember me</span>
                                </label>

                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        )}

                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                            <PrimaryButton
                                className={`w-full flex justify-center text-white py-3 px-4 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${authMethod === "otp"
                                    ? "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700"
                                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                                    }`}
                                disabled={processing || (authMethod === "otp" && !phone)}
                            >
                                {processing ? (
                                    <span className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Processing...
                                    </span>
                                ) : authMethod === "otp" ? (
                                    "Send OTP"
                                ) : (
                                    "Log in"
                                )}
                            </PrimaryButton>
                        </div>
                    </form>


                </div>
            </div>
        </PublicLayout>
    );
}
