<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
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
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Authentication", description: "User authentication endpoints")]
class AuthenticatedSessionController extends Controller
{
    #[OA\Get(
        path: "/api/login",
        summary: "Get login form data",
        description: "Returns login form configuration",
        tags: ["Authentication"],
        responses: [
            new OA\Response(
                response: 200,
                description: "Login form data",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "can_reset_password", type: "boolean", example: true),
                        new OA\Property(property: "status", type: "string", nullable: true),
                    ]
                )
            ),
        ]
    )]
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

    #[OA\Post(
        path: "/api/login",
        summary: "Authenticate user",
        description: "Authenticates a user. If email/phone and password are provided, logs in directly. If only email/phone is provided, sends OTP for verification.",
        tags: ["Authentication"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "email", type: "string", format: "email", nullable: true, example: "user@example.com", description: "Email address (required if phone not provided)"),
                    new OA\Property(property: "phone", type: "string", nullable: true, example: "+923001234567", description: "Phone number (required if email not provided)"),
                    new OA\Property(property: "password", type: "string", format: "password", nullable: true, example: "password123", description: "Password (optional - if not provided, OTP will be sent"),
                    new OA\Property(property: "remember", type: "boolean", example: false),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Login successful (verified account)",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Login successful!"),
                        new OA\Property(
                            property: "user",
                            type: "object",
                            properties: [
                                new OA\Property(property: "id", type: "integer", example: 1),
                                new OA\Property(property: "name", type: "string", example: "John Doe"),
                                new OA\Property(property: "email", type: "string", nullable: true, example: "user@example.com"),
                                new OA\Property(property: "phone", type: "string", nullable: true, example: "+923001234567"),
                                new OA\Property(property: "onboarding_complete", type: "boolean", example: true, description: "Whether the user has completed onboarding (helper/business: has service listings, normal user: has updated profile)"),
                            ]
                        ),
                        new OA\Property(property: "token", type: "string", example: "1|xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"),
                    ]
                )
            ),
            new OA\Response(
                response: 202,
                description: "OTP sent for verification (when password not provided or account not verified)",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Please check your email for the verification code."),
                        new OA\Property(property: "user_id", type: "integer", example: 1),
                        new OA\Property(property: "verification_method", type: "string", example: "email", enum: ["email", "phone"]),
                        new OA\Property(property: "identifier", type: "string", example: "user@example.com", description: "Email or masked phone number"),
                        new OA\Property(property: "verification_token", type: "string", example: "encrypted_token", description: "Token to use for OTP verification"),
                    ]
                )
            ),
            new OA\Response(
                response: 422,
                description: "Validation error",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string"),
                        new OA\Property(property: "errors", type: "object"),
                    ]
                )
            ),
        ]
    )]
    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): JsonResponse
    {
        // Demo phone number check - automatically log in first user with helper or business role
        $demoPhoneNumber = '9876543210';
        $normalizedPhone = $request->filled('phone') ? preg_replace('/[^0-9+]/', '', $request->input('phone')) : null;

        if ($normalizedPhone === $demoPhoneNumber || $normalizedPhone === '+' . $demoPhoneNumber) {
            // Find first user with helper or business role
            $user = User::whereHas('roles', function ($query) {
                $query->whereIn('name', ['helper', 'business'])
                ->whereNotIn('name', ['admin', 'super_admin', 'user']);
            })->orderBy('id')->first();

            if (!$user) {
                return response()->json([
                    'message' => 'No helper or business users found in database.',
                    'errors' => ['phone' => ['No helper or business users found in database.']]
                ], 422);
            }

            // Log for debugging
            Log::info('Demo phone login', [
                'demo_phone' => $demoPhoneNumber,
                'user_id' => $user->id,
                'user_email' => $user->email,
            ]);

            // Create Sanctum token for API authentication
            $token = $user->createToken('api-token')->plainTextToken;

                    return response()->json([
                        'message' => 'Login successful! (Demo mode)',
                        'user' => new UserResource($user->load('roles')),
                        'token' => $token,
                    ]);
        }

        // Check if password is provided
        $hasPassword = $request->filled('password');

        if ($hasPassword) {
            // Password-based login flow
            return $this->handlePasswordLogin($request);
        } else {
            // OTP-based login flow (no password provided)
            return $this->handleOtpLogin($request);
        }
    }

    /**
     * Handle password-based login
     */
    private function handlePasswordLogin(LoginRequest $request): JsonResponse
    {
        // Verify credentials (email/phone + password)
        $user = $request->verifyCredentials();

        // Determine which login method was used (email or phone)
        $loginMethod = $request->filled('email') ? 'email' : 'phone';
        $isVerified = false;

        // Check if the account is verified based on login method
        $user->refresh();

        if ($loginMethod === 'email') {
            // If logged in with email, check if email is verified
            $isVerified = $user->email_verified_at !== null && $user->email_verified_at instanceof \Carbon\Carbon;
        } else {
            // If logged in with phone, check if phone is verified
            $isVerified = $user->phone_verified_at !== null && $user->phone_verified_at instanceof \Carbon\Carbon;
        }

        // Log for debugging
        Log::info('Password login verification check', [
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
                'user' => new UserResource($user->load('roles')),
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
            'is_login' => true,
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
     * Handle OTP-based login (no password provided)
     */
    private function handleOtpLogin(LoginRequest $request): JsonResponse
    {
        // Find user by email or phone (no password verification needed)
        $user = $request->findUser();

        // Determine which login method was used (email or phone)
        $loginMethod = $request->filled('email') ? 'email' : 'phone';

        $email = $user->email;
        $phone = $user->phone;
        $isPhoneEmail = strpos($email, '@phone.kamwaalay.local') !== false;

        // Determine which method to use for OTP
        $verificationMethod = null;
        $verificationIdentifier = null;

        if ($loginMethod === 'email' && !$isPhoneEmail && !empty($email)) {
            // User provided email, use email for OTP
            $verificationMethod = 'email';
            $verificationIdentifier = $email;
            $this->sendEmailOtp($user);
        } elseif ($loginMethod === 'phone' && !empty($phone)) {
            // User provided phone, use phone for OTP
            $verificationMethod = 'phone';
            $verificationIdentifier = $phone;
            $this->sendPhoneOtp($phone, $user->roles->first()->name ?? 'user');
        } elseif (!$isPhoneEmail && !empty($email)) {
            // Fallback to email if available
            $verificationMethod = 'email';
            $verificationIdentifier = $email;
            $this->sendEmailOtp($user);
        } elseif (!empty($phone)) {
            // Fallback to phone if available
            $verificationMethod = 'phone';
            $verificationIdentifier = $phone;
            $this->sendPhoneOtp($phone, $user->roles->first()->name ?? 'user');
        } else {
            // Should not happen, but handle gracefully
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
            'is_login' => true,
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
        ], 202); // 202 Accepted - OTP sent
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
    #[OA\Post(
        path: "/api/logout",
        summary: "Logout user",
        description: "Logs out the authenticated user and revokes their token",
        tags: ["Authentication"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "Logout successful",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Logged out successfully"),
                    ]
                )
            ),
            new OA\Response(
                response: 401,
                description: "Unauthenticated",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Unauthenticated."),
                    ]
                )
            ),
        ]
    )]
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
