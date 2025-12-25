<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Http\Resources\UserResource;
use App\Models\Document;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
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
                        new OA\Property(
                            property: "user",
                            type: "object",
                            properties: [
                                new OA\Property(property: "id", type: "integer", example: 1),
                                new OA\Property(property: "name", type: "string", example: "John Doe"),
                                new OA\Property(property: "email", type: "string", nullable: true, example: "user@example.com"),
                                new OA\Property(property: "phone", type: "string", nullable: true, example: "+923001234567"),
                                new OA\Property(property: "photo", type: "string", nullable: true, example: "profiles/photos/abc123.jpg", description: "Profile photo path"),
                                new OA\Property(property: "onboarding_complete", type: "boolean", example: true, description: "Whether the user has completed onboarding (helper/business: has service listings, normal user: has updated profile)"),
                                new OA\Property(property: "age", type: "integer", nullable: true, example: 25, description: "Age from profile"),
                                new OA\Property(property: "gender", type: "string", nullable: true, enum: ["male", "female", "other"], example: "male", description: "Gender from profile"),
                                new OA\Property(property: "religion", type: "string", nullable: true, enum: ["sunni_nazar_niyaz", "sunni_no_nazar_niyaz", "shia", "christian"], example: "sunni_nazar_niyaz", description: "Religion from profile"),
                                new OA\Property(property: "languages", type: "array", nullable: true, description: "Languages from profile", items: new OA\Items(
                                    type: "object",
                                    properties: [
                                        new OA\Property(property: "id", type: "integer"),
                                        new OA\Property(property: "name", type: "string"),
                                        new OA\Property(property: "code", type: "string"),
                                    ]
                                )),
                            ]
                        ),
                        new OA\Property(property: "must_verify_email", type: "boolean"),
                        new OA\Property(property: "status", type: "string", nullable: true),
                    ]
                )
            ),
        ]
    )]
    #[OA\Get(
        path: "/api/user",
        summary: "Get authenticated user",
        description: "Get the currently authenticated user's information with onboarding status",
        tags: ["Profile"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "User data",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "id", type: "integer", example: 1),
                        new OA\Property(property: "name", type: "string", example: "John Doe"),
                        new OA\Property(property: "email", type: "string", nullable: true, example: "user@example.com"),
                        new OA\Property(property: "phone", type: "string", nullable: true, example: "+923001234567"),
                        new OA\Property(property: "photo", type: "string", nullable: true, example: "profiles/photos/abc123.jpg", description: "Profile photo path"),
                        new OA\Property(property: "onboarding_complete", type: "boolean", example: true, description: "Whether the user has completed onboarding (helper/business: has service listings, normal user: has updated profile)"),
                    ]
                )
            ),
        ]
    )]
    /**
     * Get authenticated user (for /api/user endpoint)
     */
    public function user(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new UserResource($request->user()->load(['roles', 'profile.languages']))
        ]);
    }

    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new UserResource($request->user()->load(['roles', 'profile.languages'])),
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
                required: ["name"],
                properties: [
                    new OA\Property(property: "name", type: "string", maxLength: 255),
                    new OA\Property(property: "age", type: "integer", nullable: true, minimum: 18, maximum: 100, description: "Age"),
                    new OA\Property(property: "gender", type: "string", nullable: true, enum: ["male", "female", "other"], description: "Gender"),
                    new OA\Property(property: "religion", type: "string", nullable: true, enum: ["sunni_nazar_niyaz", "sunni_no_nazar_niyaz", "shia", "christian"], description: "Religion"),
                    new OA\Property(property: "languages", type: "array", nullable: true, description: "Array of language IDs", items: new OA\Items(type: "integer")),
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
                        new OA\Property(
                            property: "user",
                            type: "object",
                            properties: [
                                new OA\Property(property: "id", type: "integer", example: 1),
                                new OA\Property(property: "name", type: "string", example: "John Doe"),
                                new OA\Property(property: "phone", type: "string", nullable: true, example: "+923001234567"),
                                new OA\Property(property: "photo", type: "string", nullable: true, example: "profiles/photos/abc123.jpg", description: "Profile photo path"),
                                new OA\Property(property: "onboarding_complete", type: "boolean", example: true, description: "Whether the user has completed onboarding (helper/business: has service listings, normal user: has updated profile)"),
                                new OA\Property(property: "age", type: "integer", nullable: true, example: 25, description: "Age from profile"),
                                new OA\Property(property: "gender", type: "string", nullable: true, enum: ["male", "female", "other"], example: "male", description: "Gender from profile"),
                                new OA\Property(property: "religion", type: "string", nullable: true, enum: ["sunni_nazar_niyaz", "sunni_no_nazar_niyaz", "shia", "christian"], example: "sunni_nazar_niyaz", description: "Religion from profile"),
                                new OA\Property(property: "languages", type: "array", nullable: true, description: "Languages from profile", items: new OA\Items(
                                    type: "object",
                                    properties: [
                                        new OA\Property(property: "id", type: "integer"),
                                        new OA\Property(property: "name", type: "string"),
                                        new OA\Property(property: "code", type: "string"),
                                    ]
                                )),
                            ]
                        ),
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
        $validated = $request->validated();
        
        // Update user name
        $user->fill(['name' => $validated['name']]);

        // Mark profile as updated for normal users (not helper/business) on first update
        if (!$user->hasRole(['helper', 'business']) && $user->profile_updated_at === null) {
            $user->profile_updated_at = now();
        }

        $user->save();

        // Update or create profile with city_id, age, gender, religion
        $profileData = [];
        if (isset($validated['city_id'])) {
            $profileData['city_id'] = $validated['city_id'];
        }
        if (isset($validated['age'])) {
            $profileData['age'] = $validated['age'];
        }
        if (isset($validated['gender'])) {
            $profileData['gender'] = $validated['gender'];
        }
        if (isset($validated['religion'])) {
            $profileData['religion'] = $validated['religion'];
        }

        $profile = $user->profile;
        if (!empty($profileData)) {
            $profile = $user->profile()->updateOrCreate(
                ['profileable_id' => $user->id, 'profileable_type' => 'App\Models\User'],
                $profileData
            );
        } else {
            if (!$profile) {
                $profile = $user->profile()->create([]);
            }
        }

        // Sync languages if provided
        if (isset($validated['languages']) && is_array($validated['languages'])) {
            $profile->languages()->sync($validated['languages']);
        }

        // Reload user with profile and languages
        $user->load(['roles', 'profile.languages']);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => new UserResource($user),
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

    #[OA\Get(
        path: "/api/profile/documents",
        summary: "Get user documents",
        description: "Get the authenticated user's uploaded documents",
        tags: ["Profile"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "User documents",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "documents", type: "array", items: new OA\Items(type: "object")),
                    ]
                )
            ),
        ]
    )]
    /**
     * Get user's documents
     */
    public function documents(Request $request): JsonResponse
    {
        $user = $request->user();
        $documents = Document::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'documents' => $documents->map(function ($document) {
                return [
                    'id' => $document->id,
                    'document_type' => $document->document_type,
                    'document_type_label' => $document->document_type_label,
                    'document_number' => $document->document_number,
                    'file_path' => $document->file_path,
                    'status' => $document->status,
                    'admin_notes' => $document->admin_notes,
                    'created_at' => $document->created_at->toIso8601String(),
                    'updated_at' => $document->updated_at->toIso8601String(),
                ];
            }),
        ]);
    }

    #[OA\Post(
        path: "/api/profile/documents",
        summary: "Upload document",
        description: "Upload a verification document (NIC, Aadhaar, Police Verification, etc.)",
        tags: ["Profile"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    properties: [
                        new OA\Property(property: "document_type", type: "string", enum: ["nic", "aadhaar", "police_verification", "other"], description: "Type of document"),
                        new OA\Property(property: "document_number", type: "string", nullable: true, description: "Document number (optional)"),
                        new OA\Property(property: "file", type: "string", format: "binary", description: "Document file (PDF, JPG, PNG - max 5MB)"),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Document uploaded successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Document uploaded successfully."),
                        new OA\Property(property: "document", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 422, description: "Validation error"),
        ]
    )]
    /**
     * Upload a document
     */
    public function storeDocument(Request $request): JsonResponse
    {
        $request->validate([
            'document_type' => ['required', 'in:nic,police_verification,other'],
            'document_number' => ['nullable', 'string', 'max:255'],
            'file' => ['required', 'file', 'mimes:pdf,jpeg,jpg,png', 'max:5120'], // 5MB max
        ]);

        $user = $request->user();

        // Store the file
        $filePath = $request->file('file')->store('documents', 'public');

        // Create document record
        $document = Document::create([
            'user_id' => $user->id,
            'document_type' => $request->document_type,
            'document_number' => $request->document_number,
            'file_path' => $filePath,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Document uploaded successfully.',
            'document' => [
                'id' => $document->id,
                'document_type' => $document->document_type,
                'document_type_label' => $document->document_type_label,
                'document_number' => $document->document_number,
                'file_path' => $document->file_path,
                'status' => $document->status,
                'created_at' => $document->created_at->toIso8601String(),
            ],
        ]);
    }

    #[OA\Post(
        path: "/api/profile/photo",
        summary: "Update profile photo",
        description: "Upload or update the authenticated user's profile photo",
        tags: ["Profile"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    properties: [
                        new OA\Property(property: "photo", type: "string", format: "binary", description: "Profile photo image file (max 2MB)"),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Photo updated successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Profile photo updated successfully."),
                        new OA\Property(
                            property: "user",
                            type: "object",
                            properties: [
                                new OA\Property(property: "id", type: "integer", example: 1),
                                new OA\Property(property: "name", type: "string", example: "John Doe"),
                                new OA\Property(property: "phone", type: "string", nullable: true, example: "+923001234567"),
                                new OA\Property(property: "photo", type: "string", nullable: true, example: "profiles/photos/abc123.jpg"),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(response: 422, description: "Validation error"),
        ]
    )]
    /**
     * Update the user's profile photo.
     */
    public function updatePhoto(Request $request): JsonResponse
    {
        $request->validate([
            'photo' => ['required', 'image', 'max:2048'],
        ]);

        $user = $request->user();

        // Delete old photo if exists
        if ($user->profile && $user->profile->photo) {
            Storage::disk('public')->delete($user->profile->photo);
        }

        // Store new photo
        $photoPath = $request->file('photo')->store('profiles/photos', 'public');

        // Update or create profile with photo
        $user->profile()->updateOrCreate(
            ['profileable_id' => $user->id, 'profileable_type' => 'App\Models\User'],
            ['photo' => $photoPath]
        );

        // Reload user with profile to get updated photo
        $user->load(['roles', 'profile']);

        return response()->json([
            'message' => 'Profile photo updated successfully.',
            'user' => new UserResource($user),
        ]);
    }

}
