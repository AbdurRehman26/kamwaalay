<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Models\PhoneOtp;
use App\Models\UserSession;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Verification", description: "OTP verification endpoints for registration and login")]
class VerificationController extends Controller
{
    #[OA\Get(
        path: "/api/verify-otp",
        summary: "Get verification page data",
        description: "Retrieve verification information for OTP verification. Requires verification_token.",
        tags: ["Verification"],
        parameters: [
            new OA\Parameter(
                name: "verification_token",
                in: "query",
                description: "Encrypted verification token for verification flow",
                required: true,
                schema: new OA\Schema(type: "string")
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Verification data retrieved successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "method", type: "string", enum: ["email", "phone"], example: "email"),
                        new OA\Property(property: "identifier", type: "string", example: "user@example.com", description: "Email address or masked phone number"),
                        new OA\Property(property: "user_id", type: "integer", example: 1),
                        new OA\Property(property: "is_login", type: "boolean", example: false, description: "Whether this is a login or registration verification"),
                        new OA\Property(property: "verification_token", type: "string", nullable: true, description: "Verification token for login flow"),
                    ]
                )
            ),
            new OA\Response(
                response: 422,
                description: "Invalid token",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Verification token has expired. Please login again."),
                        new OA\Property(property: "error", type: "string", example: "token_expired", enum: ["token_expired", "invalid_token", "user_not_found"]),
                    ]
                )
            ),
        ]
    )]
    /**
     * Display the verification page
     */
    public function show(Request $request): JsonResponse
    {
        $request->validate([
            'verification_token' => 'required|string',
        ]);

        $verificationToken = $request->input('verification_token');

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
            $isLogin = isset($verificationData['is_login']) ? $verificationData['is_login'] : true;

            if (!$userId || !$method || !$identifier) {
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
    }

    #[OA\Post(
        path: "/api/verify-otp",
        summary: "Verify OTP and complete registration or login",
        description: "Verify the OTP code sent via email or phone. Completes user registration or login process. Returns authentication token on success. If email or phone is provided, it will be used directly for verification. Otherwise, the method uses verification_token.",
        tags: ["Verification"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["otp"],
                properties: [
                    new OA\Property(property: "otp", type: "string", minLength: 6, maxLength: 6, example: "123456", description: "6-digit OTP code"),
                    new OA\Property(property: "email", type: "string", format: "email", nullable: true, example: "user@example.com", description: "Email address for verification (required if phone and verification_token not provided)"),
                    new OA\Property(property: "phone", type: "string", nullable: true, example: "+923001234567", description: "Phone number for verification (required if email and verification_token not provided)"),
                    new OA\Property(property: "verification_token", type: "string", nullable: true, description: "Verification token for login flow (optional, required if email and phone not provided)"),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "OTP verified successfully - Registration or login completed",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Registration successful!"),
                        new OA\Property(
                            property: "user",
                            type: "object",
                            description: "User object with roles",
                            properties: [
                                new OA\Property(property: "id", type: "integer", example: 1),
                                new OA\Property(property: "name", type: "string", example: "John Doe"),
                                new OA\Property(property: "email", type: "string", nullable: true, example: "user@example.com"),
                                new OA\Property(property: "phone", type: "string", nullable: true, example: "+923001234567"),
                                new OA\Property(property: "verified_at", type: "string", format: "date-time", nullable: true),
                                new OA\Property(property: "onboarding_complete", type: "boolean", example: true, description: "Whether the user has completed onboarding (helper/business: has service listings, normal user: has updated profile)"),
                            ]
                        ),
                        new OA\Property(property: "token", type: "string", example: "1|abcdefghijklmnopqrstuvwxyz", description: "Sanctum authentication token"),
                        new OA\Property(
                            property: "redirect",
                            type: "object",
                            nullable: true,
                            description: "Redirect information (only for registration)",
                            properties: [
                                new OA\Property(property: "route", type: "string", example: "onboarding.helper"),
                                new OA\Property(property: "message", type: "string", example: "Email verified successfully! Please complete your profile to start offering services."),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(
                response: 422,
                description: "Invalid or expired OTP",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Invalid or expired OTP. Please try again."),
                        new OA\Property(
                            property: "errors",
                            type: "object",
                            properties: [
                                new OA\Property(
                                    property: "otp",
                                    type: "array",
                                    items: new OA\Items(type: "string", example: "Invalid or expired OTP.")
                                ),
                            ]
                        ),
                    ]
                )
            ),
        ]
    )]
    /**
     * Verify OTP and complete registration or login
     */
    public function verify(Request $request): JsonResponse
    {
        $request->validate([
            'otp' => 'required|string|size:6',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'verification_token' => 'nullable|string', // Optional for login, required for login flow
        ]);

        // Validate that at least one identifier is provided
        if (!$request->has('email') && !$request->has('phone') && !$request->has('verification_token')) {
            return response()->json([
                'message' => 'Either email, phone, or verification_token must be provided.',
                'errors' => ['email' => ['Either email, phone, or verification_token must be provided.']]
            ], 422);
        }

        // If email is provided, use it directly for email verification
        if ($request->has('email') && $request->email) {
            // Find user by email
            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return response()->json([
                    'message' => 'User not found with this email address.',
                    'errors' => ['email' => ['User not found with this email address.']]
                ], 422);
            }

            // Determine if this is a login or registration flow
            $isLogin = $request->has('verification_token') && $request->verification_token;

            $verificationData = [
                'user_id' => $user->id,
                'method' => 'email',
                'identifier' => $request->email,
            ];

            return $this->verifyEmailOtp($request, $user, $isLogin, $verificationData);
        }

        // If phone is provided, use it directly for phone verification
        if ($request->has('phone') && $request->phone) {
            // Format phone number to +92xxxxx format
            $formattedPhone = $this->formatPhoneNumber($request->phone);
            
            // Find user by phone (try both formatted and original)
            $user = User::where('phone', $formattedPhone)
                ->orWhere('phone', $request->phone)
                ->first();

            if (!$user) {
                return response()->json([
                    'message' => 'User not found with this phone number.',
                    'errors' => ['phone' => ['User not found with this phone number.']]
                ], 422);
            }

            // Determine if this is a login or registration flow
            $isLogin = $request->has('verification_token') && $request->verification_token;

            $verificationData = [
                'user_id' => $user->id,
                'method' => 'phone',
                'identifier' => $formattedPhone,
            ];

            return $this->verifyPhoneOtp($request, $user, $isLogin, $verificationData);
        }

        // If verification_token is provided, use it for verification
        if ($request->has('verification_token') && $request->verification_token) {
            try {
                $verificationData = decrypt($request->verification_token);

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

                if (!$userId || !$method) {
                    return response()->json([
                        'message' => 'Invalid verification token. Please login again.',
                        'errors' => ['otp' => ['Invalid verification token.']]
                    ], 422);
                }

                // Get user from token
                $user = User::find($userId);
                if (!$user) {
                    return response()->json([
                        'message' => 'User not found. Please login again.',
                        'errors' => ['otp' => ['User not found.']]
                    ], 422);
                }

                $verificationData['identifier'] = $verificationData['identifier'] ?? null;

                if ($method === 'email') {
                    return $this->verifyEmailOtp($request, $user, $isLogin, $verificationData);
                } else {
                    return $this->verifyPhoneOtp($request, $user, $isLogin, $verificationData);
                }
            } catch (\Exception $e) {
                return response()->json([
                    'message' => 'Invalid verification token. Please login again.',
                    'errors' => ['otp' => ['Invalid verification token.']]
                ], 422);
            }
        }

        // This should never be reached due to validation above, but just in case
        return response()->json([
            'message' => 'Either email, phone, or verification_token must be provided.',
            'errors' => ['email' => ['Either email, phone, or verification_token must be provided.']]
        ], 422);
    }

    /**
     * Verify email OTP
     */
    private function verifyEmailOtp(Request $request, User $user, bool $isLogin = false, array $verificationData = null): JsonResponse
    {
        // Get email from request parameter, verification data, or user (in priority order)
        $email = $request->input('email')
            ?? ($verificationData['identifier'] ?? null)
            ?? $user->email;

        if (!$email) {
            return response()->json([
                'message' => 'Invalid verification data. Please try again.',
                'errors' => ['otp' => ['Invalid verification data.']]
            ], 422);
        }

        // Demo code check - bypass normal OTP verification for development
        $isDemoCode = $request->otp === '123456';

        if (!$isDemoCode) {
            // Find OTP record (using phone column to store email)
            $emailOtp = PhoneOtp::where('phone', $email)
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
        }

        if ($isLogin) {
            // Login flow - mark as verified since OTP was successful (first time verification)
            if (!$user->verified_at) {
                $user->verified_at = Carbon::now();
                $user->save();
            }

            // Reload user with roles relationship
            $user->load('roles');
            $user->refresh();

            // Create Sanctum token only (no session)
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
        } else {
            // Registration flow - mark as verified and fire Registered event (first time verification)
            $user->verified_at = Carbon::now();
            $user->save();

            // Fire Registered event now that user is verified
            event(new Registered($user));

            // Reload user with roles relationship
            $user->load('roles');
            $user->refresh();

            // Create Sanctum token for API
            $tokenResult = $user->createToken('api-token');
            $token = $tokenResult->plainTextToken;

            // Record user session
            UserSession::createFromRequest($request, $user->id, $tokenResult->accessToken->id);

            // Return redirect info based on role
            $redirectInfo = $this->getRedirectAfterVerification($user);

            return response()->json([
                'message' => 'Registration successful!',
                'user' => new UserResource($user->load('roles')),
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
        // Get phone from request parameter, verification data, or user (in priority order)
        $phone = $request->input('phone')
            ?? ($verificationData['identifier'] ?? null)
            ?? $user->phone;

        if (!$phone) {
            return response()->json([
                'message' => 'Invalid verification data. Please try again.',
                'errors' => ['otp' => ['Invalid verification data.']]
            ], 422);
        }

        // Format phone number to +92xxxxx format
        $phone = $this->formatPhoneNumber($phone);

        // Demo code check - bypass normal OTP verification for development
        $isDemoCode = $request->otp === '123456';

        if (!$isDemoCode) {
            // Find OTP record (try both formatted phone and original phone formats)
            $phoneOtp = PhoneOtp::where(function($query) use ($phone) {
                    $query->where('phone', $phone)
                          ->orWhere('phone', ltrim($phone, '+'))
                          ->orWhere('phone', '+' . ltrim($phone, '+'));
                })
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
        }

        if ($isLogin) {
            // Login flow - mark as verified since OTP was successful (first time verification)
            if (!$user->verified_at) {
                $user->verified_at = Carbon::now();
                $user->save();
            }

            // Reload user with roles relationship
            $user->load('roles');
            $user->refresh();

            // Create Sanctum token only (no session)
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
        } else {
            // Registration flow - mark as verified and fire Registered event (first time verification)
            $user->verified_at = Carbon::now();
            $user->save();

            // Fire Registered event now that user is verified
            event(new Registered($user));

            // Reload user with roles relationship
            $user->load('roles');
            $user->refresh();

            // Create Sanctum token for API
            $tokenResult = $user->createToken('api-token');
            $token = $tokenResult->plainTextToken;

            // Record user session
            UserSession::createFromRequest($request, $user->id, $tokenResult->accessToken->id);

            // Return redirect info based on role
            $redirectInfo = $this->getRedirectAfterVerification($user);

            return response()->json([
                'message' => 'Registration successful!',
                'user' => new UserResource($user->load('roles')),
                'token' => $token,
                'redirect' => $redirectInfo,
            ]);
        }
    }

    #[OA\Post(
        path: "/api/verify-otp/resend",
        summary: "Resend OTP code",
        description: "Resend the OTP verification code to the user's email or phone. Supports both login and registration flows. Requires either email, phone, or verification_token.",
        tags: ["Verification"],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "email", type: "string", format: "email", nullable: true, example: "user@example.com", description: "Email address for resending OTP"),
                    new OA\Property(property: "phone", type: "string", nullable: true, example: "+923001234567", description: "Phone number for resending OTP"),
                    new OA\Property(property: "verification_token", type: "string", nullable: true, description: "Verification token for login flow (optional)"),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "OTP resent successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Verification code has been resent to your email."),
                    ]
                )
            ),
            new OA\Response(
                response: 422,
                description: "Invalid token or verification data",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Verification token has expired. Please login again."),
                        new OA\Property(property: "error", type: "string", example: "token_expired", enum: ["token_expired", "invalid_token", "user_not_found", "invalid_data"]),
                    ]
                )
            ),
        ]
    )]
    /**
     * Resend OTP
     */
    public function resend(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'verification_token' => 'nullable|string',
        ]);

        // Validate that at least one identifier is provided
        if (!$request->has('email') && !$request->has('phone') && !$request->has('verification_token')) {
            return response()->json([
                'message' => 'Either email, phone, or verification_token must be provided.',
                'error' => 'invalid_data'
            ], 422);
        }

        // If email is provided, use it directly
        if ($request->has('email') && $request->email) {
            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return response()->json([
                    'message' => 'User not found with this email address.',
                    'error' => 'user_not_found'
                ], 422);
            }

            $role = $user->roles->first()->name ?? 'user';
            $isLogin = $request->has('verification_token') && $request->verification_token;

            if ($isLogin) {
                $this->sendLoginEmailOtp($user);
            } else {
                $this->sendEmailOtp($user, $role);
            }

            return response()->json([
                'message' => 'Verification code has been resent to your email.',
            ]);
        }

        // If phone is provided, use it directly
        if ($request->has('phone') && $request->phone) {
            $user = User::where('phone', $request->phone)->first();

            if (!$user) {
                return response()->json([
                    'message' => 'User not found with this phone number.',
                    'error' => 'user_not_found'
                ], 422);
            }

            $role = $user->roles->first()->name ?? 'user';
            $isLogin = $request->has('verification_token') && $request->verification_token;

            if ($isLogin) {
                $this->sendLoginPhoneOtp($request->phone, $role);
            } else {
                $this->sendPhoneOtp($request->phone, $role);
            }

            return response()->json([
                'message' => 'Verification code has been resent to your phone.',
            ]);
        }

        // If verification_token is provided, use it
        if ($request->has('verification_token') && $request->verification_token) {
            try {
                $verificationData = decrypt($request->verification_token);

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

                if (!$userId || !$method || !$identifier) {
                    return response()->json([
                        'message' => 'Invalid verification token. Please login again.',
                        'error' => 'invalid_token'
                    ], 422);
                }

                $user = User::find($userId);
                if (!$user) {
                    return response()->json([
                        'message' => 'User not found. Please login again.',
                        'error' => 'user_not_found'
                    ], 422);
                }

                $role = $user->roles->first()->name ?? 'user';

                if ($method === 'email') {
                    $this->sendLoginEmailOtp($user);
                    return response()->json([
                        'message' => 'Verification code has been resent to your email.',
                    ]);
                } else {
                    $this->sendLoginPhoneOtp($identifier, $role);
                    return response()->json([
                        'message' => 'Verification code has been resent to your phone.',
                    ]);
                }
            } catch (\Exception $e) {
                return response()->json([
                    'message' => 'Invalid verification token. Please login again.',
                    'error' => 'invalid_token'
                ], 422);
            }
        }

        // This should never be reached due to validation above
        return response()->json([
            'message' => 'Either email, phone, or verification_token must be provided.',
            'error' => 'invalid_data'
        ], 422);
    }

    /**
     * Send email OTP
     */
    private function sendEmailOtp(User $user, string $role): void
    {
        // Clean up expired OTPs
        PhoneOtp::cleanupExpired();

        // Generate OTP
        $otp = PhoneOtp::generateOtp();

        // Invalidate previous OTPs for this email (using phone column)
        PhoneOtp::where('phone', $user->email)
            ->where('verified', false)
            ->delete();

        // Create new OTP record (using PhoneOtp to store email OTPs)
        $emailOtp = PhoneOtp::create([
            'phone' => $user->email, // Store email in phone column
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

    /**
     * Send email OTP for login
     */
    private function sendLoginEmailOtp(User $user): void
    {
        // Clean up expired OTPs
        PhoneOtp::cleanupExpired();

        // Generate OTP
        $otp = PhoneOtp::generateOtp();

        // Invalidate previous OTPs for this email (using phone column)
        PhoneOtp::where('phone', $user->email)
            ->where('verified', false)
            ->delete();

        // Create new OTP record (using PhoneOtp to store email OTPs)
        $emailOtp = PhoneOtp::create([
            'phone' => $user->email, // Store email in phone column
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

        // Check if onboarding is complete
        $onboardingComplete = $user->hasCompletedOnboarding();

        // If onboarding is not complete, redirect to onboarding/profile
        if (!$onboardingComplete) {
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

            // Normal user - redirect to profile update
            return [
                'route' => 'home.index',
                'message' => 'Welcome! Please update your profile to get started.',
            ];
        }

        // Onboarding is complete - redirect to dashboard
        return [
            'route' => 'dashboard',
            'message' => 'Welcome! Your account has been verified and activated.',
        ];
    }

}
