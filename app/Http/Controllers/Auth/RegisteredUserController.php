<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
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
        description: "Register a new user account. Users are auto-verified upon registration.",
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
                description: "Registration successful",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Registration successful!"),
                        new OA\Property(property: "user", type: "object"),
                        new OA\Property(property: "token", type: "string"),
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

        // Normalize and format phone number if provided
        $phone = $request->phone ? $this->formatPhoneNumber($request->phone) : null;

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

        // Create user and auto-verify (simplified flow without OTP)
        $user = User::create([
            'name' => $request->name,
            'email' => $email,
            'password' => Hash::make($request->password),
            'phone' => $phone,
            'address' => $request->address,
            'phone_verified_at' => now(), // Auto-verify
        ]);

        // Assign role using Spatie Permission
        $user->assignRole($request->role);

        // Fire Registered event
        event(new Registered($user));

        return response()->json([
            'message' => 'Registration successful! Please check your phone for the verification code.',
            'user_id' => $user->id,
            'verification_method' => 'phone',
            'identifier' => $this->maskPhone($phone),
        ]);
    }

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
