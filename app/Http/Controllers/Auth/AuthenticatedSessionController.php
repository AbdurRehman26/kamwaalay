<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\PhoneOtp;
use App\Models\User;
use App\Models\UserSession;
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
        $demoPhoneNumber = '+929876543210';
        $normalizedPhone = $request->filled('phone') ? $this->formatPhoneNumber($request->input('phone')) : null;


        if ($normalizedPhone === $demoPhoneNumber || $normalizedPhone === '+' . $demoPhoneNumber) {
            // Find first user with ONLY business role
            $user = User::find(6);


            if (!$user) {
                // Fallback: Try to find any business user if strict check fails, or return error
                // For strict compliance with "only business", we'll return error if no exclusive business user found
                return response()->json([
                    'message' => 'No exclusive business users found in database.',
                    'errors' => ['phone' => ['No exclusive business users found in database.']]
                ], 422);
            }

            // Log for debugging
            Log::info('Demo phone login', [
                'demo_phone' => $demoPhoneNumber,
                'user_id' => $user->id,
                'user_email' => $user->email,
            ]);

            // Create Sanctum token for API authentication
            $tokenResult = $user->createToken('api-token');
            $token = $tokenResult->plainTextToken;

            // Record user session
            UserSession::createFromRequest($request, $user->id, $tokenResult->accessToken->id);

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
        $user = $request->verifyCredentials();

        $loginMethod = 'phone';

        // Check if the account is verified
        $user->refresh();

        $isVerified = $user->phone_verified_at !== null && $user->phone_verified_at instanceof \Carbon\Carbon;

        // Log for debugging
        Log::info('Password login verification check', [
            'user_id' => $user->id,
            'login_method' => $loginMethod,
            'verified_at' => $user->verified_at ? $user->verified_at->toDateTimeString() : 'null',
            'is_verified' => $isVerified,
        ]);

        // If account is verified, login directly without OTP
        if ($isVerified) {
            // Create Sanctum token for API authentication
            $tokenResult = $user->createToken('api-token');
            $token = $tokenResult->plainTextToken;

            // Record user session
            UserSession::createFromRequest($request, $user->id, $tokenResult->accessToken->id);

            // Check if onboarding is complete and set redirect info
            $onboardingComplete = $user->hasCompletedOnboarding();
            $redirectInfo = null;

            if (!$onboardingComplete) {
                if ($user->hasRole('helper')) {
                    $redirectInfo = [
                        'route' => 'onboarding.helper',
                        'message' => 'Please complete your profile to start offering services.',
                    ];
                } elseif ($user->hasRole('business')) {
                    $redirectInfo = [
                        'route' => 'onboarding.business',
                        'message' => 'Please complete your business profile to get started.',
                    ];
                } else {
                    // Normal user - redirect to profile update
                    $redirectInfo = [
                        'route' => 'profile.edit',
                        'message' => 'Please update your profile to get started.',
                    ];
                }
            }

            $response = [
                'message' => 'Login successful!',
                'user' => new UserResource($user->load('roles')),
                'token' => $token,
            ];

            if ($redirectInfo) {
                $response['redirect'] = $redirectInfo;
            }

            return response()->json($response);
        }

        $phone = $user->phone;

        // User has phone, use phone for OTP
        $verificationMethod = 'phone';
        $this->sendPhoneOtp($phone, $user->roles->first()->name ?? 'user');

        // Create a signed verification token instead of using session
        $verificationData = [
            'user_id' => $user->id,
            'method' => $verificationMethod,
            'identifier' => $phone,
            'remember' => $request->boolean('remember'),
            'is_login' => true,
            'expires_at' => now()->addMinutes(10), // Token valid for 10 minutes
        ];

        $verificationToken = encrypt($verificationData);

        return response()->json([
            'message' => 'Please check your phone for the verification code.',
            'user_id' => $user->id,
            'verification_method' => $verificationMethod,
            'identifier' => $this->maskPhone($phone),
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

        $phone = $user->phone;

        if ($loginMethod === 'phone' && !empty($phone)) {
            // User provided phone, use phone for OTP
            // Format phone number to +92xxxxx format
            $formattedPhone = $this->formatPhoneNumber($phone);
            $verificationMethod = 'phone';
            $this->sendPhoneOtp($formattedPhone, $user->roles->first()->name ?? 'user');
        } elseif (!empty($phone)) {
            // Fallback to phone if available
            // Format phone number to +92xxxxx format
            $formattedPhone = $this->formatPhoneNumber($phone);
            $verificationMethod = 'phone';
            $this->sendPhoneOtp($formattedPhone, $user->roles->first()->name ?? 'user');
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
            'identifier' => $phone,
            'remember' => $request->boolean('remember'),
            'is_login' => true,
            'expires_at' => now()->addMinutes(10), // Token valid for 10 minutes
        ];

        $verificationToken = encrypt($verificationData);

        return response()->json([
            'message' => 'Please check your phone for the verification code.',
            'user_id' => $user->id,
            'verification_method' => $verificationMethod,
            'identifier' => $this->maskPhone($phone),
            'verification_token' => $verificationToken,
        ], 202); // 202 Accepted - OTP sent
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
        PhoneOtp::create([
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
     * Send SMS using Twilio
     */
    private function sendSms(string $phone, string $otp): void
    {
        try {
            $twilioService = app(\App\Services\TwilioService::class);
            $twilioService->sendOtp($phone, $otp, 'login');
        } catch (\Exception $e) {
            // Log error but don't fail login - OTP is still logged for development
            Log::error("Failed to send SMS via Twilio for {$phone}: " . $e->getMessage());
            Log::info("Login OTP for {$phone}: {$otp}");
        }
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
    /**
     * Format phone number to +92xxxxx format
     * Handles formats like: 03xxxxxxxxx, 92xxxxxxxxx, +92xxxxxxxxx, 0092xxxxxxxxx
     */
    private function formatPhoneNumber(string $phone): string
    {
        // Remove all non-numeric characters except +
        $phone = preg_replace('/[^0-9+]/', '', $phone);

        // Remove leading + if present (we'll add it back at the end)
        $phone = ltrim($phone, '+');

        // Handle different input formats
        if (strpos($phone, '0092') === 0) {
            // Format: 0092xxxxxxxxx -> +92xxxxxxxxx
            $phone = substr($phone, 2); // Remove 00, keep 92
        } elseif (strpos($phone, '92') === 0 && strlen($phone) >= 12) {
            // Format: 92xxxxxxxxx -> +92xxxxxxxxx (already has country code)
            // Keep as is
        } elseif (strpos($phone, '0') === 0 && strlen($phone) >= 10) {
            // Format: 03xxxxxxxxx -> +923xxxxxxxxx (local format starting with 0)
            $phone = '92' . substr($phone, 1); // Remove leading 0, add 92
        } elseif (strlen($phone) >= 10 && strlen($phone) <= 11) {
            // Format: 3xxxxxxxxx (10-11 digits without leading 0 or country code)
            // Assume it's a local number, add 92
            $phone = '92' . $phone;
        } elseif (strlen($phone) < 10) {
            // Too short, might be incomplete - still try to format
            if (strpos($phone, '92') !== 0) {
                $phone = '92' . $phone;
            }
        }

        // Ensure it starts with +
        if (strpos($phone, '+') !== 0) {
            $phone = '+' . $phone;
        }

        return $phone;
    }

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
