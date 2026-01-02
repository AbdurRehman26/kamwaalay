import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import PublicLayout from "@/Layouts/PublicLayout";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import api from "@/services/api";
import { route } from "@/utils/routes";
import { useAuth } from "@/contexts/AuthContext";

export default function SetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isOtpLogin = searchParams.get("otp_login") === "true";
    const { updateUser } = useAuth();

    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        setMessage("");

        try {
            const response = await api.post("/password/set", {
                password: password,
                password_confirmation: passwordConfirmation,
            });

            setMessage(response.data.message || "Password set successfully!");

            // Update user context with new data including has_password flag
            if (response.data.user) {
                updateUser(response.data.user);
            }

            // Redirect to home after a short delay
            setTimeout(() => {
                navigate(route("home"));
            }, 2000);
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ password: [error.response?.data?.message || "Failed to set password. Please try again."] });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <PublicLayout>
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div>
                        <h2 className="mt-6 text-center text-4xl font-extrabold text-gray-900 dark:text-white">
                            Set Your Password
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                            {isOtpLogin
                                ? "For security, please set a password for your account. You can use this password to login alongside OTP."
                                : "Create a strong password to secure your account"
                            }
                        </p>
                    </div>

                    {message && (
                        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 dark:border-green-500 p-4 rounded-lg">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-green-800 dark:text-green-300">{message}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form className="mt-8 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700" onSubmit={submit}>
                        <div>
                            <InputLabel htmlFor="password" value="New Password" className="text-gray-700 dark:text-gray-300 font-medium" />
                            <TextInput
                                id="password"
                                type="password"
                                value={password}
                                className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                autoComplete="new-password"
                                isFocused={true}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <InputError message={errors.password} className="mt-2" />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Password must be at least 8 characters
                            </p>
                        </div>

                        <div>
                            <InputLabel htmlFor="password_confirmation" value="Confirm Password" className="text-gray-700 dark:text-gray-300 font-medium" />
                            <TextInput
                                id="password_confirmation"
                                type="password"
                                value={passwordConfirmation}
                                className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                autoComplete="new-password"
                                onChange={(e) => setPasswordConfirmation(e.target.value)}
                                required
                            />
                            <InputError message={errors.password_confirmation} className="mt-2" />
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
                                        Setting Password...
                                    </span>
                                ) : (
                                    "Set Password"
                                )}
                            </PrimaryButton>
                        </div>

                        {!isOtpLogin && (
                            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <Link
                                        to={route("home")}
                                        className="font-medium text-primary-600 hover:text-primary-500"
                                    >
                                        Skip for now
                                    </Link>
                                </p>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </PublicLayout>
    );
}
