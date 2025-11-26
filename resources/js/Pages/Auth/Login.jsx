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
    const [authMethod, setAuthMethod] = useState("otp"); // 'otp' or 'password'
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        setMessage("");

        try {
            const data = {
                phone: phone,
                password: authMethod === "password" ? password : "",
                remember: remember,
            };

            const response = await login(data);
            
            if (response.verification_method) {
                // OTP verification required (account not verified)
                setMessage(response.message || "Please check your phone for the verification code.");
                // Store verification token for OTP verification
                if (response.verification_token) {
                    authService.setVerificationToken(response.verification_token);
                }
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
                        navigate("/profile");
                    }
                } else {
                    navigate("/dashboard");
                }
            }
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ phone: [error.response?.data?.message || "Login failed. Please try again."] });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <PublicLayout>

            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-primary-100 to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div>
                        <h2 className="mt-6 text-center text-4xl font-extrabold text-gray-900">
                            Welcome Back
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Or{" "}
                            <Link
                                to={route("register")}
                                className="font-medium text-primary-600 hover:text-primary-500"
                            >
                                create a new account
                            </Link>
                        </p>
                    </div>

                    {message && (
                        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-green-800">{message}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form className="mt-8 space-y-6 bg-white rounded-2xl shadow-xl p-8" onSubmit={submit}>
                        {/* Authenticate Method Selection */}
                        <div>
                            <InputLabel value="Authenticate with" className="text-gray-700 font-medium mb-4" />
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAuthMethod("otp");
                                        setPassword("");
                                    }}
                                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                                        authMethod === "otp"
                                            ? "border-primary-500 bg-primary-50 shadow-lg"
                                            : "border-gray-200 hover:border-primary-300 bg-white"
                                    }`}
                                >
                                    <div className="text-2xl mb-2">💬</div>
                                    <h3 className={`font-bold text-base ${authMethod === "otp" ? "text-primary-600" : "text-gray-900"}`}>OTP</h3>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAuthMethod("password");
                                    }}
                                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                                        authMethod === "password"
                                            ? "border-primary-500 bg-primary-50 shadow-lg"
                                            : "border-gray-200 hover:border-primary-300 bg-white"
                                    }`}
                                >
                                    <div className="text-2xl mb-2">🔒</div>
                                    <h3 className={`font-bold text-base ${authMethod === "password" ? "text-primary-600" : "text-gray-900"}`}>Password</h3>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
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
                                        value={phone}
                                        className="flex-1 rounded-r-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        autoComplete="tel"
                                        isFocused={true}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Enter your phone number"
                                        required
                                    />
                                </div>
                                <InputError message={errors.phone} className="mt-2" />
                                {authMethod === "otp" && (
                                    <button
                                        type="button"
                                        onClick={() => setPhone("9876543210")}
                                        className="mt-2 w-full bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span>🔒</span>
                                        <span className="text-sm font-medium">Use Demo Number: 9876543210</span>
                                    </button>
                                )}
                            </div>

                            {authMethod === "password" && (
                                <div>
                                    <InputLabel htmlFor="password" value="Password" className="text-gray-700 font-medium" />
                                    <TextInput
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={password}
                                        className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                        autoComplete="current-password"
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.password} className="mt-2" />
                                </div>
                            )}
                        </div>

                        {authMethod === "password" && (
                            <div className="flex items-center justify-between">
                                <label className="flex items-center">
                                    <Checkbox
                                        name="remember"
                                        checked={remember}
                                        onChange={(e) => setRemember(e.target.checked)}
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-600">Remember me</span>
                                </label>

                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-medium text-primary-600 hover:text-primary-500"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        )}

                        <div>
                            <PrimaryButton
                                className={`w-full flex justify-center text-white py-3 px-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 ${
                                    authMethod === "otp"
                                        ? "bg-gray-400 hover:bg-gray-500"
                                        : "bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
                                }`}
                                disabled={processing || (authMethod === "otp" && !phone)}
                            >
                                {processing 
                                    ? "Processing..." 
                                    : authMethod === "otp" 
                                        ? "Send OTP" 
                                        : "Log in"
                                }
                            </PrimaryButton>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Don't have an account?{" "}
                                <Link
                                    to={route("register")}
                                    className="font-medium text-primary-600 hover:text-primary-500"
                                >
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </PublicLayout>
    );
}
