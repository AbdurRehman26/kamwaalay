<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Authentication", description: "User authentication endpoints")]
class PasswordController extends Controller
{
    #[OA\Put(
        path: "/api/password",
        summary: "Update password",
        description: "Update the authenticated user's password. Requires current password confirmation.",
        tags: ["Authentication"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["current_password", "password"],
                properties: [
                    new OA\Property(property: "current_password", type: "string", format: "password", description: "Current password for confirmation"),
                    new OA\Property(property: "password", type: "string", format: "password", minLength: 8),
                    new OA\Property(property: "password_confirmation", type: "string", format: "password"),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Password updated successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Password updated successfully!"),
                    ]
                )
            ),
            new OA\Response(response: 422, description: "Validation error - Invalid current password"),
        ]
    )]
    /**
     * Update the user's password.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        // Return JSON for API requests
        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Password updated successfully!',
            ]);
        }

        return back();
    }
}
