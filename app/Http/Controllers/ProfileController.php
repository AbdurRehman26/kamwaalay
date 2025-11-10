<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Profile", description: "User profile management endpoints")]
class ProfileController extends Controller
{
    #[OA\Get(
        path: "/api/profile",
        summary: "Get user profile",
        description: "Get the authenticated user's profile information",
        tags: ["Profile"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "User profile data",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "user", type: "object"),
                        new OA\Property(property: "must_verify_email", type: "boolean"),
                        new OA\Property(property: "status", type: "string", nullable: true),
                    ]
                )
            ),
        ]
    )]
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->load('roles'),
            'must_verify_email' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    #[OA\Patch(
        path: "/api/profile",
        summary: "Update user profile",
        description: "Update the authenticated user's profile information",
        tags: ["Profile"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "name", type: "string", maxLength: 255),
                    new OA\Property(property: "email", type: "string", format: "email", maxLength: 255),
                    new OA\Property(property: "phone", type: "string", nullable: true, maxLength: 20),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Profile updated successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Profile updated successfully."),
                        new OA\Property(property: "user", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 422, description: "Validation error"),
        ]
    )]
    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->fill($request->validated());

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        // Mark profile as updated for normal users (not helper/business) on first update
        if (!$user->hasRole(['helper', 'business']) && $user->profile_updated_at === null) {
            $user->profile_updated_at = now();
        }

        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $user->load('roles'),
        ]);
    }

    #[OA\Delete(
        path: "/api/profile",
        summary: "Delete user account",
        description: "Delete the authenticated user's account. Requires password confirmation.",
        tags: ["Profile"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["password"],
                properties: [
                    new OA\Property(property: "password", type: "string", format: "password", description: "Current password for confirmation"),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Account deleted successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Account deleted successfully."),
                    ]
                )
            ),
            new OA\Response(response: 422, description: "Validation error - Invalid password"),
        ]
    )]
    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        // Revoke all tokens
        $user->tokens()->delete();

        $user->delete();

        // Invalidate session if available (for web requests)
        if ($request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Account deleted successfully.']);
    }
}
