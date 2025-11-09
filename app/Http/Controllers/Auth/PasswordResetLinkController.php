<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Authentication", description: "User authentication endpoints")]
class PasswordResetLinkController extends Controller
{
    #[OA\Get(
        path: "/api/forgot-password",
        summary: "Get password reset form",
        description: "Get form data for requesting a password reset link",
        tags: ["Authentication"],
        responses: [
            new OA\Response(
                response: 200,
                description: "Password reset form data",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "status", type: "string", nullable: true),
                    ]
                )
            ),
        ]
    )]
    /**
     * Display the password reset link request view.
     */
    public function create(): JsonResponse
    {
        return response()->json([
            'status' => session('status'),
        ]);
    }

    #[OA\Post(
        path: "/api/forgot-password",
        summary: "Request password reset link",
        description: "Send a password reset link to the user's email address",
        tags: ["Authentication"],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["email"],
                properties: [
                    new OA\Property(property: "email", type: "string", format: "email", description: "User's email address"),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Password reset link sent successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "We have emailed your password reset link."),
                    ]
                )
            ),
            new OA\Response(response: 422, description: "Validation error or email not found"),
        ]
    )]
    /**
     * Handle an incoming password reset link request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        // We will send the password reset link to this user. Once we have attempted
        // to send the link, we will examine the response then see the message we
        // need to show to the user. Finally, we'll send out a proper response.
        $status = Password::sendResetLink(
            $request->only('email')
        );

        if ($status == Password::RESET_LINK_SENT) {
            return response()->json(['message' => __($status)]);
        }

        throw ValidationException::withMessages([
            'email' => [trans($status)],
        ]);
    }
}
