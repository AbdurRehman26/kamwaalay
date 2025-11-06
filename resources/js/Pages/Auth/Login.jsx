import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Link } from 'react-router-dom'; import { useNavigate } from 'react-router-dom';
import PublicLayout from '@/Layouts/PublicLayout';
import { useState } from 'react';
import { authService } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';
import { route } from '@/utils/routes';

export default function Login() {
    const navigate = useNavigate();
    const { login, updateUser } = useAuth();
    const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');

    const submit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        setMessage('');

        try {
            const data = {
                email: loginMethod === 'email' ? email : '',
                phone: loginMethod === 'phone' ? phone : '',
                password: password,
                remember: remember,
            };

            const response = await login(data);
            
            if (response.verification_method) {
                // OTP verification required (account not verified)
                setMessage(response.message || 'Please check your email/phone for the verification code.');
                // Store verification token for OTP verification
                if (response.verification_token) {
                    authService.setVerificationToken(response.verification_token);
                }
                navigate('/verify-otp');
            } else if (response.token) {
                // Direct login success (account is verified)
                // Update user state in AuthContext
                if (response.user) {
                    updateUser(response.user);
                }
                navigate('/dashboard');
            }
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ email: [error.response?.data?.message || 'Login failed. Please try again.'] });
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <PublicLayout>

            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div>
                        <h2 className="mt-6 text-center text-4xl font-extrabold text-gray-900">
                            Welcome Back
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Or{' '}
                            <Link
                                to={route('register')}
                                className="font-medium text-purple-600 hover:text-purple-500"
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
                        {/* Login Method Selection */}
                        <div>
                            <InputLabel value="Log in with" className="text-gray-700 font-medium mb-4" />
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLoginMethod('email');
                                        setEmail('');
                                        setPhone('');
                                    }}
                                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                                        loginMethod === 'email'
                                            ? 'border-purple-500 bg-purple-50 shadow-lg'
                                            : 'border-gray-200 hover:border-purple-300 bg-white'
                                    }`}
                                >
                                    <div className="text-2xl mb-2">📧</div>
                                    <h3 className="font-bold text-base text-gray-900">Email</h3>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLoginMethod('phone');
                                        setEmail('');
                                        setPhone('');
                                    }}
                                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                                        loginMethod === 'phone'
                                            ? 'border-purple-500 bg-purple-50 shadow-lg'
                                            : 'border-gray-200 hover:border-purple-300 bg-white'
                                    }`}
                                >
                                    <div className="text-2xl mb-2">📱</div>
                                    <h3 className="font-bold text-base text-gray-900">Phone</h3>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {loginMethod === 'email' ? (
                                <div>
                                    <InputLabel htmlFor="email" value="Email Address" className="text-gray-700 font-medium" />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={email}
                                        className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                        autoComplete="username"
                                        isFocused={true}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.email} className="mt-2" />
                                </div>
                            ) : (
                                <div>
                                    <InputLabel htmlFor="phone" value="Phone Number" className="text-gray-700 font-medium" />
                                    <TextInput
                                        id="phone"
                                        type="tel"
                                        name="phone"
                                        value={phone}
                                        className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                        autoComplete="tel"
                                        isFocused={true}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+92 300 1234567"
                                        required
                                    />
                                    <InputError message={errors.phone} className="mt-2" />
                                </div>
                            )}

                            <div>
                                <InputLabel htmlFor="password" value="Password" className="text-gray-700 font-medium" />
                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={password}
                                    className="mt-2 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                    autoComplete="current-password"
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <InputError message={errors.password} className="mt-2" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center">
                                <Checkbox
                                    name="remember"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                <span className="ml-2 text-sm text-gray-600">Remember me</span>
                            </label>

                            <Link
                                to="/forgot-password"
                                className="text-sm font-medium text-purple-600 hover:text-purple-500"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <div>
                            <PrimaryButton
                                className="w-full flex justify-center bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                                disabled={processing}
                            >
                                {processing ? 'Logging in...' : 'Log in'}
                            </PrimaryButton>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Don't have an account?{' '}
                                <Link
                                    to={route('register')}
                                    className="font-medium text-purple-600 hover:text-purple-500"
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
