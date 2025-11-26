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
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Authentication", description: "User authentication endpoints")]
class RegisteredUserController extends Controller
{
    #[OA\Get(
        path: "/api/register",
        summary: "Get registration form",
        description: "Get form data for user registration",
        tags: ["Authentication"],
        responses: [
            new OA\Response(
                response: 200,
                description: "Registration form data",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Registration form"),
                    ]
                )
            ),
        ]
    )]
    /**
     * Display the registration view.
     */
    public function create(): JsonResponse
    {
        return response()->json(['message' => 'Registration form']);
    }

    #[OA\Post(
        path: "/api/register",
        summary: "Register new user",
        description: "Register a new user account. Requires OTP verification after registration. Either email or phone must be provided.",
        tags: ["Authentication"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["name", "password", "role"],
                properties: [
                    new OA\Property(property: "name", type: "string", maxLength: 255),
                    new OA\Property(property: "email", type: "string", format: "email", nullable: true, maxLength: 255, description: "Either email or phone is required"),
                    new OA\Property(property: "phone", type: "string", nullable: true, maxLength: 20, description: "Either email or phone is required"),
                    new OA\Property(property: "password", type: "string", format: "password", minLength: 8),
                    new OA\Property(property: "password_confirmation", type: "string", format: "password"),
                    new OA\Property(property: "role", type: "string", enum: ["user", "helper", "business"]),
                    new OA\Property(property: "address", type: "string", nullable: true, maxLength: 255),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Registration successful - OTP verification required",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Registration successful! Please check your email for the verification code."),
                        new OA\Property(property: "user_id", type: "integer"),
                        new OA\Property(property: "verification_method", type: "string", enum: ["email", "phone"]),
                        new OA\Property(property: "identifier", type: "string", description: "Email or masked phone number"),
                    ]
                )
            ),
            new OA\Response(response: 422, description: "Validation error"),
        ]
    )]
    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|string|lowercase|email|max:255|unique:'.User::class,
            'phone' => 'nullable|string|max:20|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|in:user,helper,business',
            'address' => 'nullable|string|max:255',
        ]);

        // Ensure at least one of email or phone is provided
        if (empty($request->email) && empty($request->phone)) {
            throw ValidationException::withMessages([
                'email' => ['Either email or phone number is required.'],
                'phone' => ['Either email or phone number is required.'],
            ]);
        }

        // Normalize phone number if provided
        $phone = $request->phone ? preg_replace('/[^0-9+]/', '', $request->phone) : null;

        // Generate email if only phone is provided (for Laravel Auth compatibility)
        $email = $request->email ? strtolower($request->email) : null;
        if (empty($email) && $phone) {
            $generatedEmail = $phone . '@phone.kamwaalay.local';
            // Check if generated email already exists
            if (User::where('email', $generatedEmail)->exists()) {
                throw ValidationException::withMessages([
                    'phone' => ['This phone number is already registered.'],
                ]);
            }
            $email = $generatedEmail;
        }

        // Create user but don't log in yet - require OTP verification
        $user = User::create([
            'name' => $request->name,
            'email' => $email,
            'password' => Hash::make($request->password),
            'phone' => $phone,
            'address' => $request->address,
            'verified_at' => null, // Will be set after OTP verification (first time)
        ]);

        // Assign role using Spatie Permission
        $user->assignRole($request->role);

        // Don't fire Registered event yet - user is not logged in
        // Event will be fired after successful OTP verification

        // Send OTP based on registration method
        if ($request->email && !empty($request->email) && strpos($email, '@phone.kamwaalay.local') === false) {
            // Email registration - send email OTP
            $this->sendEmailOtp($user, $request->role);

            // Store user ID in session for verification (if session is available)
            if ($request->hasSession()) {
                $request->session()->put('verification_user_id', $user->id);
                $request->session()->put('verification_method', 'email');
                $request->session()->put('verification_email', $email);
            }

            return response()->json([
                'message' => 'Registration successful! Please check your email for the verification code.',
                'user_id' => $user->id,
                'verification_method' => 'email',
                'identifier' => $email,
            ]);
        } else {
            // Phone registration - send phone OTP
            $this->sendPhoneOtp($phone, $request->role);

            // Store user ID in session for verification (if session is available)
            if ($request->hasSession()) {
                $request->session()->put('verification_user_id', $user->id);
                $request->session()->put('verification_method', 'phone');
                $request->session()->put('verification_phone', $phone);
            }

            return response()->json([
                'message' => 'Registration successful! Please check your phone for the verification code.',
                'user_id' => $user->id,
                'verification_method' => 'phone',
                'identifier' => $this->maskPhone($phone),
            ]);
        }
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

    /**
     * Send email OTP for verification
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
                    ->subject('Verify Your Email - kamwaalay');
            });

            Log::info("Email sent successfully to {$user->email}");
        } catch (\Exception $e) {
            // Log error but don't fail registration
            Log::error('Failed to send email OTP: ' . $e->getMessage());
            Log::error('Email sending error details: ' . $e->getTraceAsString());
            Log::error('Exception class: ' . get_class($e));
        }

        // For development, log the OTP
        Log::info("Email OTP for {$user->email}: {$otp}");
    }

    /**
     * Send phone OTP for verification
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
        Log::info("Phone OTP for {$phone}: {$otp}");
    }

    /**
     * Send SMS using Twilio
     */
    private function sendSms(string $phone, string $otp): void
    {
        try {
            $twilioService = app(\App\Services\TwilioService::class);
            $twilioService->sendOtp($phone, $otp, 'registration');
        } catch (\Exception $e) {
            // Log error but don't fail registration - OTP is still logged for development
            Log::error("Failed to send SMS via Twilio for {$phone}: " . $e->getMessage());
            Log::info("Registration OTP for {$phone}: {$otp}");
        }
    }
}
