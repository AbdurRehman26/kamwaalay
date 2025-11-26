<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\PhoneOtp;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class PhoneOtpController extends Controller
{
    /**
     * Show phone registration form
     */
    public function create(): JsonResponse
    {
        return response()->json(['message' => 'Phone registration form']);
    }

    /**
     * Send OTP to phone number
     */
    public function sendOtp(Request $request)
    {
        $request->validate([
            'phone' => 'required|string|max:20|regex:/^[0-9+\-() ]+$/',
            'role' => 'required|in:user,helper,business',
        ]);

        $phone = $this->normalizePhone($request->phone);

        // Check if phone already registered
        if (User::where('phone', $phone)->exists()) {
            throw ValidationException::withMessages([
                'phone' => ['This phone number is already registered.'],
            ]);
        }

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
            'role' => $request->role,
            'expires_at' => Carbon::now()->addMinutes(3), // OTP valid for 3 minutes
        ]);

        // Send OTP via SMS (mock implementation - replace with actual SMS service)
        $this->sendSms($phone, $otp);

        return response()->json([
            'message' => 'OTP sent successfully to your phone number.',
            'phone' => $this->maskPhone($phone),
        ]);
    }

    /**
     * Verify OTP and complete registration
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'phone' => 'required|string|max:20',
            'otp' => 'required|string|size:6',
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:255',
        ]);

        $phone = $this->normalizePhone($request->phone);

        // Find OTP record
        $phoneOtp = PhoneOtp::where('phone', $phone)
            ->where('otp', $request->otp)
            ->where('verified', false)
            ->latest()
            ->first();

        if (!$phoneOtp) {
            throw ValidationException::withMessages([
                'otp' => ['Invalid or expired OTP.'],
            ]);
        }

        if ($phoneOtp->isExpired()) {
            throw ValidationException::withMessages([
                'otp' => ['OTP has expired. Please request a new one.'],
            ]);
        }

        // Check if user already exists
        if (User::where('phone', $phone)->exists()) {
            throw ValidationException::withMessages([
                'phone' => ['This phone number is already registered.'],
            ]);
        }

        // Mark OTP as verified
        $phoneOtp->markAsVerified();

        // Create user account (without email, using phone as identifier)
        $user = User::create([
            'name' => $request->name,
            'email' => $phone . '@phone.kamwaalay.local', // Temporary email-like identifier
            'password' => Hash::make($phone . time()), // Random password
            'phone' => $phone,
            'address' => $request->address,
        ]);

        // Assign role using Spatie Permission
        $user->assignRole($phoneOtp->role);

        event(new \Illuminate\Auth\Events\Registered($user));

        Auth::login($user);

        // Create Sanctum token for API
        $token = $user->createToken('api-token')->plainTextToken;

        // Return redirect info based on role
        $redirectInfo = [];
        if ($user->hasRole('helper')) {
            $redirectInfo = ['route' => 'onboarding.helper', 'message' => 'Registration successful! Please complete your profile.'];
        } elseif ($user->hasRole('business')) {
            $redirectInfo = ['route' => 'onboarding.business', 'message' => 'Registration successful! Please complete your business profile.'];
        } else {
            $redirectInfo = ['route' => 'dashboard', 'message' => 'Registration successful!'];
        }

        return response()->json([
            'message' => 'Registration successful!',
            'user' => new UserResource($user->load('roles')),
            'token' => $token,
            'redirect' => $redirectInfo,
        ]);
    }

    /**
     * Resend OTP
     */
    public function resendOtp(Request $request)
    {
        $request->validate([
            'phone' => 'required|string|max:20',
            'role' => 'required|in:user,helper,business',
        ]);

        return $this->sendOtp($request);
    }

    /**
     * Normalize phone number (remove spaces, dashes, etc.)
     */
    private function normalizePhone(string $phone): string
    {
        return preg_replace('/[^0-9+]/', '', $phone);
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
     * Send SMS using Twilio
     */
    private function sendSms(string $phone, string $otp): void
    {
        try {
            $twilioService = app(\App\Services\TwilioService::class);
            $twilioService->sendOtp($phone, $otp, 'verification');
        } catch (\Exception $e) {
            // Log error but don't fail - OTP is still logged for development
            Log::error("Failed to send SMS via Twilio for {$phone}: " . $e->getMessage());
            Log::info("OTP for {$phone}: {$otp}");
        }
    }
}
