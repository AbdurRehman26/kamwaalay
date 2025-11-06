<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\EmailOtp;
use App\Models\PhoneOtp;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class VerificationController extends Controller
{
    /**
     * Display the verification page
     */
    public function show(Request $request): JsonResponse
    {
        // Check for verification token (for login) or session (for registration)
        $verificationToken = $request->input('verification_token');

        if ($verificationToken) {
            // Login verification - use token
            try {
                $verificationData = decrypt($verificationToken);

                // Check if token is expired
                if (isset($verificationData['expires_at']) && now()->gt($verificationData['expires_at'])) {
                    return response()->json([
                        'message' => 'Verification token has expired. Please login again.',
                        'error' => 'token_expired'
                    ], 422);
                }

                $userId = $verificationData['user_id'] ?? null;
                $method = $verificationData['method'] ?? null;
                $identifier = $verificationData['identifier'] ?? null;
                $isLogin = true;

                if (!$userId || !$method) {
                    return response()->json([
                        'message' => 'Invalid verification token. Please login again.',
                        'error' => 'invalid_token'
                    ], 422);
                }

                $user = User::find($userId);
                if (!$user) {
                    return response()->json([
                        'message' => 'Invalid verification token. Please login again.',
                        'error' => 'user_not_found'
                    ], 422);
                }

                // Mask phone if method is phone
                if ($method === 'phone') {
                    $identifier = $this->maskPhone($identifier);
                }

                return response()->json([
                    'method' => $method,
                    'identifier' => $identifier,
                    'user_id' => $userId,
                    'is_login' => $isLogin,
                    'verification_token' => $verificationToken,
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'message' => 'Invalid verification token. Please login again.',
                    'error' => 'invalid_token'
                ], 422);
            }
        } else {
            // Registration verification - fall back to session (for backward compatibility)
            $userId = $request->session()->get('verification_user_id');
            $method = $request->session()->get('verification_method');
            $isLogin = false;

            if (!$userId || !$method) {
                return response()->json([
                    'message' => 'Please complete registration first.',
                    'error' => 'invalid_session'
                ], 422);
            }

            $user = User::find($userId);
            if (!$user) {
                return response()->json([
                    'message' => 'Invalid verification session. Please register again.',
                    'error' => 'user_not_found'
                ], 422);
            }

            $identifier = $method === 'email'
                ? $request->session()->get('verification_email')
                : $this->maskPhone($request->session()->get('verification_phone'));

            return response()->json([
                'method' => $method,
                'identifier' => $identifier,
                'user_id' => $userId,
                'is_login' => $isLogin,
            ]);
        }
    }

    /**
     * Verify OTP and complete registration or login
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'otp' => 'required|string|size:6',
            'user_id' => 'required|exists:users,id',
            'verification_token' => 'nullable|string', // Optional for login, required for login flow
        ]);

        // Check for verification token (for login) or session (for registration)
        $verificationToken = $request->input('verification_token');
        $verificationData = null;
        $isLogin = false;

        if ($verificationToken) {
            // Login verification - use token
            try {
                $verificationData = decrypt($verificationToken);

                // Check if token is expired
                if (isset($verificationData['expires_at']) && now()->gt($verificationData['expires_at'])) {
                    return response()->json([
                        'message' => 'Verification token has expired. Please login again.',
                        'errors' => ['otp' => ['Verification token has expired.']]
                    ], 422);
                }

                $userId = $verificationData['user_id'] ?? null;
                $method = $verificationData['method'] ?? null;
                $isLogin = true;

                if (!$userId || !$method || $userId != $request->user_id) {
                    return response()->json([
                        'message' => 'Invalid verification token. Please login again.',
                        'errors' => ['otp' => ['Invalid verification token.']]
                    ], 422);
                }
            } catch (\Exception $e) {
                return response()->json([
                    'message' => 'Invalid verification token. Please login again.',
                    'errors' => ['otp' => ['Invalid verification token.']]
                ], 422);
            }
        } else {
            // Registration verification - fall back to session
            $userId = $request->session()->get('verification_user_id');
            $method = $request->session()->get('verification_method');
            $isLogin = false;

            if (!$userId || !$method || $userId != $request->user_id) {
                return response()->json([
                    'message' => 'Invalid verification session. Please register again.',
                    'errors' => ['otp' => ['Invalid verification session.']]
                ], 422);
            }

            $verificationData = [
                'user_id' => $userId,
                'method' => $method,
            ];
        }

        $user = User::find($request->user_id);
        if (!$user) {
            return response()->json([
                'message' => $isLogin ? 'User not found. Please login again.' : 'User not found. Please register again.',
                'errors' => ['otp' => ['User not found.']]
            ], 422);
        }

        if ($verificationData['method'] === 'email') {
            return $this->verifyEmailOtp($request, $user, $isLogin, $verificationData);
        } else {
            return $this->verifyPhoneOtp($request, $user, $isLogin, $verificationData);
        }
    }

    /**
     * Verify email OTP
     */
    private function verifyEmailOtp(Request $request, User $user, bool $isLogin = false, array $verificationData = null): JsonResponse
    {
        // Get email from verification data or session
        $email = $isLogin
            ? ($verificationData['identifier'] ?? null)
            : ($request->session()->get('verification_email') ?? null);

        if (!$email) {
            return response()->json([
                'message' => 'Invalid verification data. Please try again.',
                'errors' => ['otp' => ['Invalid verification data.']]
            ], 422);
        }

        // Find OTP record
        $emailOtp = EmailOtp::where('email', $email)
            ->where('otp', $request->otp)
            ->where('verified', false)
            ->latest()
            ->first();

        if (!$emailOtp) {
            return response()->json([
                'message' => 'Invalid or expired OTP. Please try again.',
                'errors' => ['otp' => ['Invalid or expired OTP.']]
            ], 422);
        }

        if ($emailOtp->isExpired()) {
            return response()->json([
                'message' => 'OTP has expired. Please request a new one.',
                'errors' => ['otp' => ['OTP has expired.']]
            ], 422);
        }

        // Mark OTP as verified
        $emailOtp->markAsVerified();

        if ($isLogin) {
            // Login flow - mark email as verified since OTP was successful
            if (empty($user->email_verified_at)) {
                $user->update([
                    'email_verified_at' => Carbon::now(),
                ]);
            }

            // Reload user with roles relationship
            $user->load('roles');
            $user->refresh();

            // Create Sanctum token only (no session)
            $token = $user->createToken('api-token')->plainTextToken;

            return response()->json([
                'message' => 'Login successful!',
                'user' => $user->load('roles'),
                'token' => $token,
            ]);
        } else {
            // Registration flow - mark email as verified and fire Registered event
            $user->update([
                'email_verified_at' => Carbon::now(),
            ]);

            // Fire Registered event now that user is verified
            event(new Registered($user));

            // Reload user with roles relationship
            $user->load('roles');
            $user->refresh();

            // Clear registration session data
            $request->session()->forget([
                'verification_user_id',
                'verification_method',
                'verification_email'
            ]);

            // Create Sanctum token for API
            $token = $user->createToken('api-token')->plainTextToken;

            // Return redirect info based on role
            $redirectInfo = $this->getRedirectAfterVerification($user);

            return response()->json([
                'message' => 'Registration successful!',
                'user' => $user->load('roles'),
                'token' => $token,
                'redirect' => $redirectInfo,
            ]);
        }
    }

    /**
     * Verify phone OTP
     */
    private function verifyPhoneOtp(Request $request, User $user, bool $isLogin = false, array $verificationData = null): JsonResponse
    {
        // Get phone from verification data or session
        $phone = $isLogin
            ? ($verificationData['identifier'] ?? null)
            : ($request->session()->get('verification_phone') ?? null);

        if (!$phone) {
            return response()->json([
                'message' => 'Invalid verification data. Please try again.',
                'errors' => ['otp' => ['Invalid verification data.']]
            ], 422);
        }

        // Find OTP record
        $phoneOtp = PhoneOtp::where('phone', $phone)
            ->where('otp', $request->otp)
            ->where('verified', false)
            ->latest()
            ->first();

        if (!$phoneOtp) {
            return response()->json([
                'message' => 'Invalid or expired OTP. Please try again.',
                'errors' => ['otp' => ['Invalid or expired OTP.']]
            ], 422);
        }

        if ($phoneOtp->isExpired()) {
            return response()->json([
                'message' => 'OTP has expired. Please request a new one.',
                'errors' => ['otp' => ['OTP has expired.']]
            ], 422);
        }

        // Mark OTP as verified
        $phoneOtp->markAsVerified();

        if ($isLogin) {
            // Login flow - mark phone as verified since OTP was successful
            if (empty($user->phone_verified_at)) {
                $user->update([
                    'phone_verified_at' => Carbon::now(),
                ]);
            }

            // Reload user with roles relationship
            $user->load('roles');
            $user->refresh();

            // Create Sanctum token only (no session)
            $token = $user->createToken('api-token')->plainTextToken;

            return response()->json([
                'message' => 'Login successful!',
                'user' => $user->load('roles'),
                'token' => $token,
            ]);
        } else {
            // Registration flow - mark phone as verified and fire Registered event
            $user->update([
                'phone_verified_at' => Carbon::now(),
            ]);

            // Fire Registered event now that user is verified
            event(new Registered($user));

            // Reload user with roles relationship
            $user->load('roles');
            $user->refresh();

            // Clear registration session data
            $request->session()->forget([
                'verification_user_id',
                'verification_method',
                'verification_phone'
            ]);

            // Create Sanctum token for API
            $token = $user->createToken('api-token')->plainTextToken;

            // Return redirect info based on role
            $redirectInfo = $this->getRedirectAfterVerification($user);

            return response()->json([
                'message' => 'Registration successful!',
                'user' => $user->load('roles'),
                'token' => $token,
                'redirect' => $redirectInfo,
            ]);
        }
    }

    /**
     * Resend OTP
     */
    public function resend(Request $request): JsonResponse
    {
        $request->validate([
            'verification_token' => 'nullable|string', // Optional for login
        ]);

        // Check for verification token (for login) or session (for registration)
        $verificationToken = $request->input('verification_token');
        $verificationData = null;
        $isLogin = false;

        if ($verificationToken) {
            // Login verification - use token
            try {
                $verificationData = decrypt($verificationToken);

                // Check if token is expired
                if (isset($verificationData['expires_at']) && now()->gt($verificationData['expires_at'])) {
                    return response()->json([
                        'message' => 'Verification token has expired. Please login again.',
                        'error' => 'token_expired'
                    ], 422);
                }

                $userId = $verificationData['user_id'] ?? null;
                $method = $verificationData['method'] ?? null;
                $isLogin = true;

                if (!$userId || !$method) {
                    return response()->json([
                        'message' => 'Invalid verification token. Please login again.',
                        'error' => 'invalid_token'
                    ], 422);
                }
            } catch (\Exception $e) {
                return response()->json([
                    'message' => 'Invalid verification token. Please login again.',
                    'error' => 'invalid_token'
                ], 422);
            }
        } else {
            // Registration verification - fall back to session
            $userId = $request->session()->get('verification_user_id');
            $method = $request->session()->get('verification_method');
            $isLogin = false;

            if (!$userId || !$method) {
                return response()->json([
                    'message' => 'Please complete registration first.',
                    'error' => 'invalid_session'
                ], 422);
            }

            $verificationData = [
                'user_id' => $userId,
                'method' => $method,
            ];
        }

        $user = User::find($verificationData['user_id']);
        if (!$user) {
            return response()->json([
                'message' => $isLogin ? 'User not found. Please login again.' : 'User not found. Please register again.',
                'error' => 'user_not_found'
            ], 422);
        }

        if ($verificationData['method'] === 'email') {
            $email = $isLogin
                ? ($verificationData['identifier'] ?? null)
                : ($request->session()->get('verification_email') ?? null);

            if (!$email) {
                return response()->json([
                    'message' => 'Invalid verification data. Please try again.',
                    'error' => 'invalid_data'
                ], 422);
            }

            $role = $user->roles->first()->name ?? 'user';

            if ($isLogin) {
                $this->sendLoginEmailOtp($user);
            } else {
                $this->sendEmailOtp($user, $role);
            }

            return response()->json([
                'message' => 'Verification code has been resent to your email.',
            ]);
        } else {
            $phone = $isLogin
                ? ($verificationData['identifier'] ?? null)
                : ($request->session()->get('verification_phone') ?? null);

            if (!$phone) {
                return response()->json([
                    'message' => 'Invalid verification data. Please try again.',
                    'error' => 'invalid_data'
                ], 422);
            }

            $role = $user->roles->first()->name ?? 'user';

            if ($isLogin) {
                $this->sendLoginPhoneOtp($phone, $role);
            } else {
                $this->sendPhoneOtp($phone, $role);
            }

            return response()->json([
                'message' => 'Verification code has been resent to your phone.',
            ]);
        }
    }

    /**
     * Send email OTP
     */
    private function sendEmailOtp(User $user, string $role): void
    {
        // Clean up expired OTPs
        EmailOtp::cleanupExpired();

        // Generate OTP
        $otp = EmailOtp::generateOtp();

        // Invalidate previous OTPs for this email
        EmailOtp::where('email', $user->email)
            ->where('verified', false)
            ->delete();

        // Create new OTP record
        $emailOtp = EmailOtp::create([
            'email' => $user->email,
            'otp' => $otp,
            'role' => $role,
            'expires_at' => Carbon::now()->addMinutes(3),
        ]);

        // Send email with OTP
        try {
            // Log mailer configuration for debugging
            Log::info('Mailer config', [
                'default' => config('mail.default'),
                'from_address' => config('mail.from.address'),
                'from_name' => config('mail.from.name'),
                'to_email' => $user->email,
            ]);

            Mail::send('emails.verify-otp', ['otp' => $otp, 'user' => $user], function ($message) use ($user) {
                $message->from(config('mail.from.address'), config('mail.from.name'))
                    ->to($user->email, $user->name)
                    ->subject('Verify Your Email - kamwaalay');
            });

            Log::info("Email sent successfully to {$user->email}");
        } catch (\Exception $e) {
            Log::error('Failed to send email OTP: ' . $e->getMessage());
            Log::error('Email sending error details: ' . $e->getTraceAsString());
            Log::error('Exception class: ' . get_class($e));
        }

        // For development, log the OTP
        Log::info("Email OTP for {$user->email}: {$otp}");
    }

    /**
     * Send phone OTP
     */
    private function sendPhoneOtp(string $phone, string $role): void
    {
        // Clean up expired OTPs
        PhoneOtp::cleanupExpired();

        // Generate OTP
        $otp = PhoneOtp::generateOtp();

        // Invalidate previous OTPs for this phone
        PhoneOtp::where('phone', $phone)
            ->where('verified', false)
            ->delete();

        // Create new OTP record
        $phoneOtp = PhoneOtp::create([
            'phone' => $phone,
            'otp' => $otp,
            'role' => $role,
            'expires_at' => Carbon::now()->addMinutes(3),
        ]);

        // Send SMS (mock implementation)
        $this->sendSms($phone, $otp);

        // For development, log the OTP
        Log::info("Phone OTP for {$phone}: {$otp}");
    }

    /**
     * Send SMS (mock implementation)
     */
    private function sendSms(string $phone, string $otp): void
    {
        Log::info("OTP for {$phone}: {$otp}");
    }

    /**
     * Send email OTP for login
     */
    private function sendLoginEmailOtp(User $user): void
    {
        // Clean up expired OTPs
        EmailOtp::cleanupExpired();

        // Generate OTP
        $otp = EmailOtp::generateOtp();

        // Invalidate previous OTPs for this email
        EmailOtp::where('email', $user->email)
            ->where('verified', false)
            ->delete();

        // Create new OTP record
        $emailOtp = EmailOtp::create([
            'email' => $user->email,
            'otp' => $otp,
            'role' => $user->roles->first()->name ?? 'user',
            'expires_at' => Carbon::now()->addMinutes(3),
        ]);

        // Send email with OTP
        try {
            // Log mailer configuration for debugging
            Log::info('Mailer config', [
                'default' => config('mail.default'),
                'from_address' => config('mail.from.address'),
                'from_name' => config('mail.from.name'),
                'to_email' => $user->email,
            ]);

            Mail::send('emails.verify-otp', ['otp' => $otp, 'user' => $user], function ($message) use ($user) {
                $message->from(config('mail.from.address'), config('mail.from.name'))
                    ->to($user->email, $user->name)
                    ->subject('Login Verification Code - kamwaalay');
            });

            Log::info("Email sent successfully to {$user->email}");
        } catch (\Exception $e) {
            Log::error('Failed to send email OTP for login: ' . $e->getMessage());
            Log::error('Email sending error details: ' . $e->getTraceAsString());
            Log::error('Exception class: ' . get_class($e));
        }

        // For development, log the OTP
        Log::info("Login Email OTP for {$user->email}: {$otp}");
    }

    /**
     * Send phone OTP for login
     */
    private function sendLoginPhoneOtp(string $phone, string $role): void
    {
        // Clean up expired OTPs
        PhoneOtp::cleanupExpired();

        // Generate OTP
        $otp = PhoneOtp::generateOtp();

        // Invalidate previous OTPs for this phone
        PhoneOtp::where('phone', $phone)
            ->where('verified', false)
            ->delete();

        // Create new OTP record
        $phoneOtp = PhoneOtp::create([
            'phone' => $phone,
            'otp' => $otp,
            'role' => $role,
            'expires_at' => Carbon::now()->addMinutes(3),
        ]);

        // Send SMS (mock implementation)
        $this->sendSms($phone, $otp);

        // For development, log the OTP
        Log::info("Login Phone OTP for {$phone}: {$otp}");
    }

    /**
     * Mask phone number for display
     */
    private function maskPhone(string $phone): string
    {
        if (strlen($phone) <= 4) {
            return str_repeat('*', strlen($phone));
        }
        return substr($phone, 0, 2) . str_repeat('*', strlen($phone) - 4) . substr($phone, -2);
    }

    /**
     * Get redirect info after verification (for API)
     */
    private function getRedirectAfterVerification(User $user): array
    {
        // Refresh user to ensure roles are loaded
        $user->refresh();

        // Log role for debugging
        Log::info('Redirecting user after verification', [
            'user_id' => $user->id,
            'roles' => $user->roles->pluck('name')->toArray(),
            'has_helper' => $user->hasRole('helper'),
            'has_business' => $user->hasRole('business'),
        ]);

        if ($user->hasRole('helper')) {
            return [
                'route' => 'onboarding.helper',
                'message' => 'Email verified successfully! Please complete your profile to start offering services.',
            ];
        }

        if ($user->hasRole('business')) {
            return [
                'route' => 'onboarding.business',
                'message' => 'Phone verified successfully! Please complete your business profile to get started.',
            ];
        }

        return [
            'route' => 'dashboard',
            'message' => 'Welcome! Your account has been verified and activated.',
        ];
    }
}
