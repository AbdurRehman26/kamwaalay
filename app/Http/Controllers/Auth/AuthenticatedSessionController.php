<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\EmailOtp;
use App\Models\PhoneOtp;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;
use Carbon\Carbon;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): JsonResponse
    {
        return response()->json([
            'can_reset_password' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): JsonResponse
    {
        // Verify credentials without logging in
        $user = $request->verifyCredentials();

        // Determine which login method was used (email or phone)
        $loginMethod = $request->filled('email') ? 'email' : 'phone';
        $isVerified = false;

        // Check if the account is verified based on login method
        // Reload user to ensure we have fresh data from database
        $user->refresh();

        if ($loginMethod === 'email') {
            // If logged in with email, check if email is verified
            // Check both that it's not null and that it's a valid datetime
            $isVerified = $user->email_verified_at !== null && $user->email_verified_at instanceof \Carbon\Carbon;
        } else {
            // If logged in with phone, check if phone is verified
            // Check both that it's not null and that it's a valid datetime
            $isVerified = $user->phone_verified_at !== null && $user->phone_verified_at instanceof \Carbon\Carbon;
        }

        // Log for debugging
        Log::info('Login verification check', [
            'user_id' => $user->id,
            'login_method' => $loginMethod,
            'email_verified_at' => $user->email_verified_at ? $user->email_verified_at->toDateTimeString() : 'null',
            'phone_verified_at' => $user->phone_verified_at ? $user->phone_verified_at->toDateTimeString() : 'null',
            'is_verified' => $isVerified,
        ]);

        // If account is verified, login directly without OTP
        if ($isVerified) {
            // Create Sanctum token for API authentication
            $token = $user->createToken('api-token')->plainTextToken;

            return response()->json([
                'message' => 'Login successful!',
                'user' => $user->load('roles'),
                'token' => $token,
            ]);
        }

        // Account is not verified - require OTP verification
        $email = $user->email;
        $phone = $user->phone;
        $isPhoneEmail = strpos($email, '@phone.kamwaalay.local') !== false;

        // Determine which method to use for OTP (prefer email if real email, otherwise phone)
        $verificationMethod = null;
        $verificationIdentifier = null;

        if (!$isPhoneEmail && !empty($email)) {
            // User has a real email, use email for OTP
            $verificationMethod = 'email';
            $verificationIdentifier = $email;
            $this->sendEmailOtp($user);
        } elseif (!empty($phone)) {
            // User has phone, use phone for OTP
            $verificationMethod = 'phone';
            $verificationIdentifier = $phone;
            $this->sendPhoneOtp($phone, $user->roles->first()->name ?? 'user');
        } else {
            // Fallback - should not happen, but handle gracefully
            return response()->json([
                'message' => 'Unable to send verification code. Please contact support.',
                'errors' => ['email' => ['Unable to send verification code. Please contact support.']]
            ], 422);
        }

        // Create a signed verification token instead of using session
        $verificationData = [
            'user_id' => $user->id,
            'method' => $verificationMethod,
            'identifier' => $verificationMethod === 'email' ? $email : $phone,
            'remember' => $request->boolean('remember'),
            'expires_at' => now()->addMinutes(10), // Token valid for 10 minutes
        ];

        $verificationToken = encrypt($verificationData);

        return response()->json([
            'message' => $verificationMethod === 'email'
                ? 'Please check your email for the verification code.'
                : 'Please check your phone for the verification code.',
            'user_id' => $user->id,
            'verification_method' => $verificationMethod,
            'identifier' => $verificationMethod === 'email' ? $email : $this->maskPhone($phone),
            'verification_token' => $verificationToken,
        ]);
    }

    /**
     * Send email OTP for login verification
     */
    private function sendEmailOtp(User $user): void
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
            'expires_at' => Carbon::now()->addMinutes(3), // OTP valid for 3 minutes
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
            // Log error but don't fail login
            Log::error('Failed to send email OTP for login: ' . $e->getMessage());
            Log::error('Email sending error details: ' . $e->getTraceAsString());
            Log::error('Exception class: ' . get_class($e));
        }

        // For development, log the OTP
        Log::info("Login Email OTP for {$user->email}: {$otp}");
    }

    /**
     * Send phone OTP for login verification
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
            'expires_at' => Carbon::now()->addMinutes(3), // OTP valid for 3 minutes
        ]);

        // Send SMS (mock implementation - replace with actual SMS service)
        $this->sendSms($phone, $otp);

        // For development, log the OTP
        Log::info("Login Phone OTP for {$phone}: {$otp}");
    }

    /**
     * Send SMS (mock implementation - replace with actual SMS service like Twilio)
     */
    private function sendSms(string $phone, string $otp): void
    {
        // TODO: Replace with actual SMS service integration
        // For development, log the OTP
        Log::info("Login OTP for {$phone}: {$otp}");

        // In production, use a service like:
        // Twilio::sms($phone, "Your kamwaalay login verification code is: {$otp}. Valid for 3 minutes.");
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): JsonResponse
    {
        // For API, revoke Sanctum token if present
        if ($request->user()) {
            $request->user()->currentAccessToken()?->delete();
        }

        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Mask phone number for display
     */
    private function maskPhone(?string $phone): ?string
    {
        if (!$phone) {
            return null;
        }

        if (strlen($phone) <= 4) {
            return str_repeat('*', strlen($phone));
        }

        return substr($phone, 0, 2) . str_repeat('*', strlen($phone) - 4) . substr($phone, -2);
    }
}
