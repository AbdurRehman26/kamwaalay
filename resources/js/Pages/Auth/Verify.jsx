import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Link } from "react-router-dom"; import { useNavigate, useSearchParams } from "react-router-dom";
import PublicLayout from "@/Layouts/PublicLayout";
import { useState, useEffect } from "react";
import { authService } from "@/services/auth";
import { useAuth } from "@/contexts/AuthContext";

export default function Verify() {
    const navigate = useNavigate();
    const { updateUser } = useAuth();
    const [searchParams] = useSearchParams();
    const [otp, setOtp] = useState("");
    const [user_id, setUserId] = useState(null);
    const [method, setMethod] = useState("email");
    const [identifier, setIdentifier] = useState("");
    const [is_login, setIsLogin] = useState(false);
    const [verificationToken, setVerificationToken] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");
    const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds

    // Fetch verification info from API
    useEffect(() => {
        // Get verification token from URL params or localStorage
        const tokenFromUrl = searchParams.get("verification_token");
        const tokenFromStorage = authService.getVerificationToken();
        const token = tokenFromUrl || tokenFromStorage;
        
        if (token) {
            setVerificationToken(token);
            // Store it in localStorage for resend functionality
            if (tokenFromUrl) {
                authService.setVerificationToken(token);
            }
        }
        
        // Check localStorage for verification info (from registration)
        const storedUserId = localStorage.getItem("verification_user_id");
        const storedMethod = localStorage.getItem("verification_method");
        const storedIdentifier = localStorage.getItem("verification_identifier");
        
        if (storedUserId && storedMethod) {
            setUserId(storedUserId);
            setMethod(storedMethod);
            setIdentifier(storedIdentifier || "");
            setIsLogin(false); // This is registration flow
        }
        
        // Try to get verification info from API
        if (token) {
            authService.getVerificationInfo(token)
                .then(data => {
                    if (data.method) {
                        setMethod(data.method);
                        setIdentifier(data.identifier || "");
                        setUserId(data.user_id);
                        setIsLogin(data.is_login || false);
                        // Update verification token if returned from API
                        if (data.verification_token) {
                            setVerificationToken(data.verification_token);
                            authService.setVerificationToken(data.verification_token);
                        }
                    }
                })
                .catch(err => {
                    console.error("Error fetching verification info:", err);
                    // If verification info is not available from API but we have it from localStorage, continue
                    if (!storedUserId && err.response?.status === 422) {
                        authService.removeVerificationToken();
                        navigate("/login");
                    }
                });
        } else if (!storedUserId) {
            // No token and no stored info, redirect to login
            navigate("/login");
        }
    }, [searchParams, navigate]);

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const handleResend = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            await authService.resendOtp(verificationToken);
            setTimeLeft(180); // Reset timer
            setOtp("");
            setMessage("Verification code has been resent.");
        } catch (error) {
            setErrors({ otp: [error.response?.data?.message || "Failed to resend code."] });
        } finally {
            setProcessing(false);
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        setMessage("");

        try {
            // Prepare OTP verification payload
            const otpPayload = {
                otp: otp,
            };
            
            // Add email or phone based on verification method
            if (method === "email") {
                // Get email from localStorage or identifier
                const storedEmail = localStorage.getItem("verification_email");
                const emailToUse = storedEmail || identifier;
                if (emailToUse) {
                    otpPayload.email = emailToUse.toLowerCase().trim();
                }
            } else if (method === "phone") {
                // Get phone from localStorage or identifier
                const storedPhone = localStorage.getItem("verification_phone");
                const phoneToUse = storedPhone || identifier;
                if (phoneToUse) {
                    // Normalize phone number (remove non-numeric characters except +)
                    otpPayload.phone = phoneToUse.replace(/[^0-9+]/g, "");
                }
            }
            
            // Add verification_token if available (for login flow)
            const response = await authService.verifyOtp(otpPayload, verificationToken);

            if (response.token) {
                // Store token
                authService.setToken(response.token);
                
                // Clean up verification info from localStorage
                localStorage.removeItem("verification_user_id");
                localStorage.removeItem("verification_method");
                localStorage.removeItem("verification_identifier");
                localStorage.removeItem("verification_email");
                localStorage.removeItem("verification_phone");
                
                // Update user state in AuthContext
                if (response.user) {
                    updateUser(response.user);
                }
                
                // Redirect based on context
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
                setErrors({ otp: [error.response?.data?.message || "Verification failed. Please try again."] });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <PublicLayout>
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div>
                        <h2 className="mt-6 text-center text-4xl font-extrabold text-gray-900">
                            {is_login ? "Login Verification" : `Verify Your ${method === "email" ? "Email" : "Phone"}`}
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            {is_login 
                                ? `We've sent a 6-digit verification code to ${method === "email" ? "your email" : "your phone"}`
                                : "We've sent a 6-digit verification code to"
                            }
                            {!is_login && identifier && (
                                <>
                                    <br />
                                    <span className="font-semibold text-blue-600">{identifier}</span>
                                </>
                            )}
                        </p>
                    </div>

                    {/* Success Message */}
                    {message && (
                        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
                            <div className="flex items-start">
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
                        <div>
                            <InputLabel htmlFor="otp" value="Verification Code" className="text-gray-700 font-medium" />
                            <TextInput
                                id="otp"
                                name="otp"
                                type="text"
                                value={otp}
                                className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-center text-2xl tracking-widest font-bold"
                                placeholder="000000"
                                maxLength={6}
                                autoComplete="one-time-code"
                                isFocused={true}
                                onChange={(e) => {
                                    const inputValue = e.target?.value || "";
                                    const value = inputValue.replace(/\D/g, "").slice(0, 6);
                                    setOtp(value);
                                }}
                                required
                            />
                            <InputError message={errors.otp} className="mt-2" />
                            <p className="mt-2 text-xs text-gray-500">
                                Enter the 6-digit code sent to {method === "email" ? "your email" : "your phone"}
                            </p>
                        </div>

                        {/* Timer */}
                        {timeLeft > 0 && (
                            <div className="text-center">
                                <p className="text-sm text-gray-600">
                                    Code expires in: <span className="font-semibold text-blue-600">{formatTime(timeLeft)}</span>
                                </p>
                            </div>
                        )}

                        {timeLeft === 0 && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                    Your verification code has expired. Please request a new one.
                                </p>
                            </div>
                        )}

                        <div>
                            <PrimaryButton
                                className="w-full flex justify-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={processing || otp.length !== 6}
                            >
                                {processing ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Verifying...
                                    </span>
                                ) : (
                                    "Verify Code"
                                )}
                            </PrimaryButton>
                        </div>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={timeLeft > 0 || processing}
                                className="text-sm font-medium text-blue-600 hover:text-blue-500 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                                {timeLeft > 0 ? (
                                    <>Resend code in {formatTime(timeLeft)}</>
                                ) : (
                                    <>Didn't receive the code? Resend</>
                                )}
                            </button>
                        </div>

                        <div className="text-center pt-4 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                                {is_login ? (
                                    <Link
                                        to="/login"
                                        className="font-medium text-blue-600 hover:text-blue-500"
                                    >
                                        Back to login
                                    </Link>
                                ) : (
                                    <Link
                                        to="/register"
                                        className="font-medium text-blue-600 hover:text-blue-500"
                                    >
                                        Back to registration
                                    </Link>
                                )}
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </PublicLayout>
    );
}


