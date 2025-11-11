<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\ServiceListing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
                    required: ["services", "nic", "nic_number"],
                    properties: [
                        new OA\Property(
                            property: "services",
                            type: "array",
                            items: new OA\Items(
                                type: "object",
                                required: ["service_type", "work_type", "location_id"],
                                properties: [
                                    new OA\Property(property: "service_type", type: "string", enum: ["maid", "cook", "babysitter", "caregiver", "cleaner", "all_rounder"]),
                                    new OA\Property(property: "work_type", type: "string", enum: ["full_time", "part_time"]),
                                    new OA\Property(property: "location_id", type: "integer"),
                                    new OA\Property(property: "monthly_rate", type: "number", nullable: true, minimum: 0),
                                    new OA\Property(property: "description", type: "string", nullable: true, maxLength: 2000),
                                ]
                            )
                        ),
                        new OA\Property(property: "nic", type: "string", format: "binary", description: "NIC document file (jpeg, jpg, png, pdf, max 5MB)"),
                        new OA\Property(property: "nic_number", type: "string", maxLength: 255),
                        new OA\Property(property: "photo", type: "string", format: "binary", nullable: true),
                        new OA\Property(property: "experience_years", type: "integer", nullable: true, minimum: 0),
                        new OA\Property(property: "bio", type: "string", nullable: true),
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

        // Handle services if sent as JSON string (from FormData)
        $servicesData = $request->input('services');
        if (is_string($servicesData)) {
            $decoded = json_decode($servicesData, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return response()->json([
                    'message' => 'Invalid services data format.',
                    'errors' => ['services' => ['Invalid services data format.']]
                ], 422);
            }
            $request->merge(['services' => $decoded]);
        }

        $validated = $request->validate([
            'services' => 'required|array|min:1',
            'services.*.service_type' => 'required|in:maid,cook,babysitter,caregiver,cleaner,all_rounder',
            'services.*.work_type' => 'required|in:full_time,part_time',
            'services.*.location_id' => 'required',
            'services.*.monthly_rate' => 'nullable|numeric|min:0',
            'services.*.description' => 'nullable|string|max:2000',
            // Profile verification fields
            'nic' => 'required|file|mimes:jpeg,jpg,png,pdf|max:5120',
            'nic_number' => 'required|string|max:255',
            // Optional helper profile fields
            'photo' => 'nullable|image|max:2048',
            'experience_years' => 'nullable|integer|min:0',
            'bio' => 'nullable|string',
        ]);

        // Update user profile if provided
        $profileData = [];
        if ($request->hasFile('photo')) {
            $profileData['photo'] = $request->file('photo')->store('helpers/photos', 'public');
        }
        if ($request->has('experience_years')) {
            $profileData['experience_years'] = $validated['experience_years'];
        }
        if ($request->has('bio')) {
            $profileData['bio'] = $validated['bio'];
        }
        if (!empty($profileData)) {
            $user->profile()->updateOrCreate(
                ['profileable_id' => $user->id, 'profileable_type' => 'App\Models\User'],
                $profileData
            );
        }

        // Store NIC document
        if ($request->hasFile('nic')) {
            $nicPath = $request->file('nic')->store('documents/nic', 'public');
            \App\Models\Document::create([
                'user_id' => $user->id,
                'document_type' => 'nic',
                'document_number' => $validated['nic_number'],
                'file_path' => $nicPath,
                'status' => 'pending',
            ]);
        }

        // Group services by common fields (work_type, monthly_rate, description)
        $groupedServices = [];
        foreach ($validated['services'] as $serviceData) {
            $location = \App\Models\Location::find($serviceData['location_id']);
            if (!$location) {
                continue;
            }

            $location->load('city');
            
            $key = md5(serialize([
                $serviceData['work_type'] ?? 'full_time',
                $serviceData['monthly_rate'] ?? null,
                $serviceData['description'] ?? null,
            ]));
            
            if (!isset($groupedServices[$key])) {
                $groupedServices[$key] = [
                    'common' => [
                        'user_id' => $user->id,
                        'work_type' => $serviceData['work_type'] ?? 'full_time',
                        'monthly_rate' => $serviceData['monthly_rate'] ?? null,
                        'description' => $serviceData['description'] ?? null,
                        'is_active' => true,
                        'status' => 'active',
                    ],
                    'service_types' => [],
                    'locations' => [],
                ];
            }
            
            // Add service type
            if (!in_array($serviceData['service_type'], $groupedServices[$key]['service_types'])) {
                $groupedServices[$key]['service_types'][] = $serviceData['service_type'];
            }
            
            // Add location
            $locationKey = $location->city->name . '|' . ($location->area ?? '');
            if (!isset($groupedServices[$key]['locations'][$locationKey])) {
                $groupedServices[$key]['locations'][$locationKey] = [
                    'city' => $location->city->name,
                    'area' => $location->area ?? '',
                ];
            }
        }
        
        // Create service listings for each group
        foreach ($groupedServices as $group) {
            $listing = ServiceListing::create($group['common']);
            
            // Attach service types
            foreach ($group['service_types'] as $serviceType) {
                \App\Models\ServiceListingServiceType::create([
                    'service_listing_id' => $listing->id,
                    'service_type' => $serviceType,
                ]);
            }
            
            // Attach locations
            foreach ($group['locations'] as $location) {
                \App\Models\ServiceListingLocation::create([
                    'service_listing_id' => $listing->id,
                    'city' => $location['city'],
                    'area' => $location['area'],
                ]);
            }
        }

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
        description: "Complete business onboarding by submitting business information. Requires business role.",
        tags: ["Onboarding"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "business_name", type: "string", nullable: true, maxLength: 255),
                    new OA\Property(property: "business_address", type: "string", nullable: true, maxLength: 500),
                    new OA\Property(property: "business_description", type: "string", nullable: true, maxLength: 2000),
                ]
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
    public function completeBusiness(Request $request)
    {
        $user = Auth::user();
        
        if (!$user->hasRole('business')) {
            abort(403);
        }

        // Handle services if sent as JSON string (from FormData)
        $servicesData = $request->input('services');
        if (is_string($servicesData)) {
            $decoded = json_decode($servicesData, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return response()->json([
                    'message' => 'Invalid services data format.',
                    'errors' => ['services' => ['Invalid services data format.']]
                ], 422);
            }
            $request->merge(['services' => $decoded]);
        }

        $validated = $request->validate([
            'services' => 'required|array|min:1',
            'services.*.service_type' => 'required|in:maid,cook,babysitter,caregiver,cleaner,all_rounder',
            'services.*.work_type' => 'required|in:full_time,part_time',
            'services.*.location_id' => 'required',
            'services.*.monthly_rate' => 'nullable|numeric|min:0',
            'services.*.description' => 'nullable|string|max:2000',
            // Profile verification fields
            'nic' => 'required|file|mimes:jpeg,jpg,png,pdf|max:5120',
            'nic_number' => 'required|string|max:255',
            // Optional business profile fields
            'bio' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'area' => 'nullable|string|max:255',
        ]);

        // Update user profile if provided
        $profileData = [];
        if ($request->has('bio')) {
            $profileData['bio'] = $validated['bio'];
        }
        if ($request->has('city')) {
            $profileData['city'] = $validated['city'];
        }
        if ($request->has('area')) {
            $profileData['area'] = $validated['area'];
        }
        if (!empty($profileData)) {
            $user->profile()->updateOrCreate(
                ['profileable_id' => $user->id, 'profileable_type' => 'App\Models\User'],
                $profileData
            );
        }

        // Store NIC document
        if ($request->hasFile('nic')) {
            $nicPath = $request->file('nic')->store('documents/nic', 'public');
            \App\Models\Document::create([
                'user_id' => $user->id,
                'document_type' => 'nic',
                'document_number' => $validated['nic_number'],
                'file_path' => $nicPath,
                'status' => 'pending',
            ]);
        }

        // Group services by common fields (work_type, monthly_rate, description)
        $groupedServices = [];
        foreach ($validated['services'] as $serviceData) {
            $location = \App\Models\Location::find($serviceData['location_id']);
            if (!$location) {
                continue;
            }

            $location->load('city');
            
            $key = md5(serialize([
                $serviceData['work_type'] ?? 'full_time',
                $serviceData['monthly_rate'] ?? null,
                $serviceData['description'] ?? null,
            ]));
            
            if (!isset($groupedServices[$key])) {
                $groupedServices[$key] = [
                    'common' => [
                        'user_id' => $user->id,
                        'work_type' => $serviceData['work_type'] ?? 'full_time',
                        'monthly_rate' => $serviceData['monthly_rate'] ?? null,
                        'description' => $serviceData['description'] ?? null,
                        'is_active' => true,
                        'status' => 'active',
                    ],
                    'service_types' => [],
                    'locations' => [],
                ];
            }
            
            // Add service type
            if (!in_array($serviceData['service_type'], $groupedServices[$key]['service_types'])) {
                $groupedServices[$key]['service_types'][] = $serviceData['service_type'];
            }
            
            // Add location
            $locationKey = $location->city->name . '|' . ($location->area ?? '');
            if (!isset($groupedServices[$key]['locations'][$locationKey])) {
                $groupedServices[$key]['locations'][$locationKey] = [
                    'city' => $location->city->name,
                    'area' => $location->area ?? '',
                ];
            }
        }
        
        // Create service listings for each group
        foreach ($groupedServices as $group) {
            $listing = ServiceListing::create($group['common']);
            
            // Attach service types
            foreach ($group['service_types'] as $serviceType) {
                \App\Models\ServiceListingServiceType::create([
                    'service_listing_id' => $listing->id,
                    'service_type' => $serviceType,
                ]);
            }
            
            // Attach locations
            foreach ($group['locations'] as $location) {
                \App\Models\ServiceListingLocation::create([
                    'service_listing_id' => $listing->id,
                    'city' => $location['city'],
                    'area' => $location['area'],
                ]);
            }
        }

        return response()->json([
            'message' => 'Welcome! Your business profile has been set up successfully.',
            'user' => new UserResource($user->load('roles')),
        ]);
    }
}
