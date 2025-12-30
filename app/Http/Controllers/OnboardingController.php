<?php

namespace App\Http\Controllers;

use App\Enums\Religion;
use App\Http\Resources\UserResource;
use App\Models\ServiceListing;
use App\Models\ServiceType;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Onboarding", description: "User onboarding endpoints")]
class OnboardingController extends Controller
{
    #[OA\Get(
        path: "/api/onboarding/helper",
        summary: "Get helper onboarding form",
        description: "Get form data for helper onboarding. Requires helper role.",
        tags: ["Onboarding"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "Onboarding form data",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "user", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Only helpers can access"),
        ]
    )]
    /**
     * Show helper onboarding
     */
    public function helper(): JsonResponse
    {
        $user = Auth::user();

        if (!$user->hasRole('helper')) {
            abort(403);
        }

        return response()->json([
            'user' => new UserResource($user->load('roles')),
        ]);
    }

    #[OA\Post(
        path: "/api/onboarding/helper",
        summary: "Complete helper onboarding",
        description: "Complete helper onboarding by submitting services, NIC document, and profile information. Requires helper role.",
        tags: ["Onboarding"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    required: ["services"],
                    properties: [
                        new OA\Property(
                            property: "services",
                            type: "array",
                            items: new OA\Items(
                                type: "object",
                                required: ["service_type", "work_type", "location_id"],
                                properties: [
                                    new OA\Property(property: "service_type", type: "string", enum: ["maid", "cook", "babysitter", "caregiver", "cleaner", "domestic_helper", "driver", "security_guard"]),
                                    new OA\Property(property: "work_type", type: "string", enum: ["full_time", "part_time"]),
                                    new OA\Property(property: "location_id", type: "integer"),
                                    new OA\Property(property: "monthly_rate", type: "number", nullable: true, minimum: 0),
                                    new OA\Property(property: "description", type: "string", nullable: true, maxLength: 2000),
                                ]
                            )
                        ),
                        new OA\Property(property: "nic", type: "string", format: "binary", nullable: true, description: "NIC document file (jpeg, jpg, png, pdf, max 5MB) - optional"),
                        new OA\Property(property: "nic_number", type: "string", nullable: true, maxLength: 255),
                        new OA\Property(property: "photo", type: "string", format: "binary", nullable: true),
                        new OA\Property(property: "experience_years", type: "integer", nullable: true, minimum: 0),
                        new OA\Property(property: "bio", type: "string", nullable: true),
                        new OA\Property(property: "age", type: "integer", nullable: true, minimum: 18, maximum: 100, description: "Age of the helper"),
                        new OA\Property(property: "gender", type: "string", nullable: true, enum: ["male", "female", "other"], description: "Gender of the helper"),
                        new OA\Property(property: "religion", type: "string", nullable: true, enum: ["sunni_nazar_niyaz", "sunni_no_nazar_niyaz", "shia", "christian"], description: "Religion of the helper"),
                        new OA\Property(property: "languages", type: "array", nullable: true, description: "Array of language IDs (can be sent as JSON string in FormData)", items: new OA\Items(type: "integer")),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Onboarding completed successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Onboarding completed successfully!"),
                        new OA\Property(property: "user", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Only helpers can complete onboarding"),
            new OA\Response(response: 422, description: "Validation error"),
        ]
    )]
    /**
     * Complete helper onboarding
     */
    public function completeHelper(Request $request)
    {
        $user = Auth::user();

        if (!$user->hasRole('helper')) {
            abort(403);
        }

        // Handle services and locations if sent as JSON strings (from FormData)
        // Decode BEFORE validation so validation works correctly
        $servicesData = $request->input('services');
        $decodedServices = $servicesData;
        if (is_string($servicesData)) {
            $decoded = json_decode($servicesData, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return response()->json([
                    'message' => 'Invalid services data format.',
                    'errors' => ['services' => ['Invalid services data format.']]
                ], 422);
            }
            $decodedServices = $decoded;
        }

        // Prepare data for validation (merge decoded arrays with other request data)
        // Note: $request->all() includes files for multipart/form-data
        $dataToValidate = $request->all();
        $dataToValidate['services'] = $decodedServices;

        // Handle languages if sent as JSON string (from FormData)
        $languagesData = $request->input('languages');
        $decodedLanguages = $languagesData;
        if (is_string($languagesData)) {
            $decoded = json_decode($languagesData, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $decodedLanguages = $decoded;
            }
        }
        $dataToValidate['languages'] = $decodedLanguages;

        // Sanitize nullable fields that might come as strings "null" or "" from FormData
        $nullableFields = ['age', 'gender', 'religion', 'bio', 'experience_years', 'nic_number', 'monthly_rate', 'description'];
        foreach ($nullableFields as $field) {
            if (isset($dataToValidate[$field]) && ($dataToValidate[$field] === 'null' || $dataToValidate[$field] === '')) {
                $dataToValidate[$field] = null;
            }
        }

        // Validate the decoded data
        $validator = Validator::make($dataToValidate, [
            'services' => 'required|array|min:1',
            'services.*' => 'required|integer|exists:service_types,id',
            'pin_address' => 'required|string|max:500',
            'pin_latitude' => 'nullable|numeric',
            'pin_longitude' => 'nullable|numeric',
            'work_type' => 'required|in:full_time,part_time',
            'monthly_rate' => 'nullable|numeric|min:0',
            'description' => 'nullable|string|max:2000',
            // Profile verification fields (optional for now)
            'nic' => 'nullable|file|mimes:jpeg,jpg,png,pdf|max:5120',
            'nic_number' => 'nullable|string|max:255',
            // Optional helper profile fields
            'photo' => 'nullable|image|max:2048',
            'experience_years' => 'nullable|integer|min:0',
            'bio' => 'nullable|string',
            'age' => 'nullable|integer|min:18|max:100',
            'gender' => 'nullable|in:male,female,other',
            'religion' => 'nullable|in:' . Religion::validationString(),
            'languages' => 'nullable|array',
            'languages.*' => 'required|integer|exists:languages,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors()
            ], 422);
        }

        $validated = $validator->validated();

        // Update user profile if provided
        $profileData = [
            'pin_address' => $validated['pin_address'] ?? null,
            'pin_latitude' => $validated['pin_latitude'] ?? null,
            'pin_longitude' => $validated['pin_longitude'] ?? null,
        ];
        if ($request->hasFile('photo')) {
            $profileData['photo'] = $request->file('photo')->store('helpers/photos', 'public');
        }
        if ($request->has('experience_years')) {
            $profileData['experience_years'] = $validated['experience_years'];
        }
        if ($request->has('bio')) {
            $profileData['bio'] = $validated['bio'];
        }
        if ($request->has('age')) {
            $profileData['age'] = $validated['age'];
        }
        if ($request->has('gender')) {
            $profileData['gender'] = $validated['gender'];
        }
        if ($request->has('religion')) {
            $profileData['religion'] = $validated['religion'];
        }
        $profile = $user->profile()->updateOrCreate(
            ['profileable_id' => $user->id, 'profileable_type' => 'App\Models\User'],
            $profileData
        );

        // Sync languages if provided
        if ($request->has('languages') && is_array($validated['languages'])) {
            $profile->languages()->sync($validated['languages']);
        }

        // Store NIC document (if provided)
        if ($request->hasFile('nic')) {
            $nicPath = $request->file('nic')->store('documents/nic', 'public');
            \App\Models\Document::create([
                'user_id' => $user->id,
                'document_type' => 'nic',
                'document_number' => $validated['nic_number'] ?? null,
                'file_path' => $nicPath,
                'status' => 'pending',
            ]);
        }

        // Get or create profile
        $profile = $user->profile;
        if (!$profile) {
            $profile = $user->profile()->create([]);
        }

        // Create service listing (location is now on profile)
        $listing = ServiceListing::create([
            'profile_id' => $profile->id,
            'work_type' => $validated['work_type'],
            'monthly_rate' => $validated['monthly_rate'] ?? null,
            'description' => $validated['description'] ?? null,
            'is_active' => true,
            'status' => 'active',
        ]);

        // Sync service types (services are now sent as IDs directly)
        $listing->serviceTypes()->sync($validated['services']);

        return response()->json([
            'message' => 'Welcome! Your profile has been set up successfully.',
            'user' => new UserResource($user->load('roles')),
        ]);
    }

    #[OA\Get(
        path: "/api/onboarding/business",
        summary: "Get business onboarding form",
        description: "Get form data for business onboarding. Requires business role.",
        tags: ["Onboarding"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "Onboarding form data",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "user", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Only businesses can access"),
        ]
    )]
    /**
     * Show business onboarding
     */
    public function business(): JsonResponse
    {
        $user = Auth::user();

        if (!$user->hasRole('business')) {
            abort(403);
        }

        return response()->json([
            'user' => new UserResource($user->load('roles')),
        ]);
    }

    #[OA\Post(
        path: "/api/onboarding/business",
        summary: "Complete business onboarding",
        description: "Complete business onboarding by submitting services, locations, and profile information. Requires business role.",
        tags: ["Onboarding"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    required: ["services", "locations", "work_type"],
                    properties: [
                        new OA\Property(property: "services", type: "array", description: "Array of service type slugs (can be sent as JSON string in FormData)", items: new OA\Items(type: "string", enum: ["maid", "cook", "babysitter", "caregiver", "cleaner", "domestic_helper", "driver", "security_guard"])),
                        new OA\Property(property: "locations", type: "array", description: "Array of location IDs (can be sent as JSON string in FormData)", items: new OA\Items(type: "integer")),
                        new OA\Property(property: "work_type", type: "string", enum: ["full_time", "part_time"]),
                        new OA\Property(property: "monthly_rate", type: "number", nullable: true, minimum: 0),
                        new OA\Property(property: "description", type: "string", nullable: true, maxLength: 2000),
                        new OA\Property(property: "nic", type: "string", format: "binary", nullable: true, description: "NIC document file (jpeg, jpg, png, pdf, max 5MB) - optional"),
                        new OA\Property(property: "nic_number", type: "string", nullable: true, maxLength: 255),
                        new OA\Property(property: "photo", type: "string", format: "binary", nullable: true),
                        new OA\Property(property: "bio", type: "string", nullable: true),
                        new OA\Property(property: "city", type: "string", nullable: true, maxLength: 255),
                        new OA\Property(property: "area", type: "string", nullable: true, maxLength: 255),
                        new OA\Property(property: "age", type: "integer", nullable: true, minimum: 18, maximum: 100, description: "Age"),
                        new OA\Property(property: "gender", type: "string", nullable: true, enum: ["male", "female", "other"], description: "Gender"),
                        new OA\Property(property: "religion", type: "string", nullable: true, enum: ["sunni_nazar_niyaz", "sunni_no_nazar_niyaz", "shia", "christian"], description: "Religion"),
                        new OA\Property(property: "languages", type: "array", nullable: true, description: "Array of language IDs (can be sent as JSON string in FormData)", items: new OA\Items(type: "integer")),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Onboarding completed successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Onboarding completed successfully!"),
                        new OA\Property(property: "user", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Only businesses can complete onboarding"),
            new OA\Response(response: 422, description: "Validation error"),
        ]
    )]
    /**
     * Complete business onboarding
     */
    /**
     * Complete business onboarding
     */
    public function completeBusiness(Request $request)
    {
        $business = Auth::user();

        if (!$business->hasRole('business')) {
            abort(403);
        }

        // Simplified validation - only NIC document and number required
        $validator = Validator::make($request->all(), [
            'nic' => 'required|file|mimes:jpeg,jpg,png,pdf|max:5120',
            'nic_number' => 'required|string|max:255',
        ], [
            'nic.required' => 'NIC document is required to verify your business.',
            'nic_number.required' => 'NIC number is required to complete onboarding.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors()
            ], 422);
        }

        $validated = $validator->validated();

        // Save NIC document
        $nicPath = $request->file('nic')->store('documents/nic', 'public');
        \App\Models\Document::create([
            'user_id' => $business->id,
            'document_type' => 'nic',
            'document_number' => $validated['nic_number'],
            'file_path' => $nicPath,
            'status' => 'pending',
        ]);

        // Create business profile if it doesn't exist
        $businessProfile = $business->profile;
        if (!$businessProfile) {
            $business->profile()->create([]);
        }

        return response()->json([
            'message' => 'Welcome! Your business verification has been submitted. You can now add workers to your profile.',
            'user' => new UserResource($business->load('roles')),
        ]);
    }
}
