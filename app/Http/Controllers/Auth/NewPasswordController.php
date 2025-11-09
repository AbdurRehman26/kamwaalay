<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Authentication", description: "User authentication endpoints")]
class NewPasswordController extends Controller
{
    #[OA\Get(
        path: "/api/reset-password/{token}",
        summary: "Get password reset form",
        description: "Get form data for resetting password with the provided token",
        tags: ["Authentication"],
        parameters: [
            new OA\Parameter(name: "token", in: "path", required: true, schema: new OA\Schema(type: "string"), description: "Password reset token"),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Password reset form data",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "email", type: "string", nullable: true),
                        new OA\Property(property: "token", type: "string"),
                    ]
                )
            ),
        ]
    )]
    /**
     * Display the password reset view.
     */
    public function create(Request $request): JsonResponse
    {
        return response()->json([
            'email' => $request->email,
            'token' => $request->route('token'),
        ]);
    }

    #[OA\Post(
        path: "/api/reset-password",
        summary: "Reset password",
        description: "Reset user password using the reset token received via email",
        tags: ["Authentication"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["token", "email", "password"],
                properties: [
                    new OA\Property(property: "token", type: "string", description: "Password reset token from email"),
                    new OA\Property(property: "email", type: "string", format: "email", description: "User's email address"),
                    new OA\Property(property: "password", type: "string", format: "password", minLength: 8),
                    new OA\Property(property: "password_confirmation", type: "string", format: "password"),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Password reset successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Your password has been reset."),
                    ]
                )
            ),
            new OA\Response(response: 422, description: "Validation error or invalid token"),
        ]
    )]
    /**
     * Handle an incoming new password request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        // Here we will attempt to reset the user's password. If it is successful we
        // will update the password on an actual user model and persist it to the
        // database. Otherwise we will parse the error and return the response.
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user) use ($request) {
                $user->forceFill([
                    'password' => Hash::make($request->password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        // If the password was successfully reset, we will redirect the user back to
        // the application's home authenticated view. If there is an error we can
        // redirect them back to where they came from with their error message.
        if ($status == Password::PASSWORD_RESET) {
            return response()->json(['message' => __($status)]);
        }

        throw ValidationException::withMessages([
            'email' => [trans($status)],
        ]);
    }
}
