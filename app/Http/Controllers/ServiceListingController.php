<?php

namespace App\Http\Controllers;

use App\Http\Resources\ServiceListingResource;
use App\Http\Resources\UserResource;
use App\Http\Resources\JobPostResource;
use App\Models\ServiceListing;
use App\Models\JobPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Service Listings", description: "Service listing management endpoints")]
class ServiceListingController extends Controller
{
    #[OA\Get(
        path: "/api/service-listings",
        summary: "List service listings",
        description: "Get a paginated list of active service listings. Only visible to helpers and guests.",
        tags: ["Service Listings"],
        parameters: [
            new OA\Parameter(name: "service_type", in: "query", required: false, schema: new OA\Schema(type: "string", enum: ["maid", "cook", "babysitter", "caregiver", "cleaner", "domestic_helper", "driver", "security_guard"])),
            new OA\Parameter(name: "location_id", in: "query", required: false, schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "city_name", in: "query", required: false, schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "area", in: "query", required: false, schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "work_type", in: "query", required: false, schema: new OA\Schema(type: "string", enum: ["full_time", "part_time"])),
            new OA\Parameter(name: "sort_by", in: "query", required: false, schema: new OA\Schema(type: "string", enum: ["created_at", "rate_low", "rate_high"])),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of service listings",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "listings", type: "object", description: "Paginated list of service listings"),
                        new OA\Property(property: "filters", type: "object", description: "Applied filters"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Service listings only available to helpers"),
        ]
    )]
    /**
     * Display a listing of the resource (only visible to helpers and guests)
     */
    public function index(Request $request)
    {
        // Only helpers and guests can view service listings
        // Users and businesses should not see this page
        if (Auth::check()) {
            $user = Auth::user();
            if ($user->hasRole(['user', 'business'])) {
                abort(403, 'Service listings are only available to helpers.');
            }
        }
        $query = ServiceListing::with(['profile.profileable', 'serviceTypes', 'locations.city'])
            ->where('service_listings.is_active', true)
            ->where('service_listings.status', 'active');

        // Filter by service type (using relationship)
        if ($request->has('service_type') && $request->service_type) {
            $query->byServiceType($request->service_type);
        }

        // Filter by location (using relationship)
        $locationDisplay = '';
        if ($request->has('location_id') && $request->location_id) {
            $location = \App\Models\Location::find($request->location_id);
            if ($location) {
                $location->load('city');
                $query->byLocationId($request->location_id);
                $locationDisplay = $location->area
                    ? $location->city->name . ', ' . $location->area
                    : $location->city->name;
            }
        } elseif ($request->has('city_name') && $request->city_name) {
            // For city filtering, we need to find location IDs first
            $cityLocationIds = \App\Models\Location::whereHas('city', function ($q) use ($request) {
                $q->where('name', $request->city_name);
            })->pluck('id')->toArray();
            
            if (!empty($cityLocationIds)) {
                $query->whereHas('locations', function ($q) use ($cityLocationIds) {
                    $q->whereIn('locations.id', $cityLocationIds);
                });
            } else {
                // No locations found for this city, return empty result
                $query->whereRaw('1 = 0');
            }
            $locationDisplay = $request->city_name;
        } elseif ($request->has('area') && $request->area) {
            // For area filtering, we need to find location IDs first
            $areaLocationIds = \App\Models\Location::where('area', 'like', '%' . $request->area . '%')
                ->pluck('id')->toArray();
            
            if (!empty($areaLocationIds)) {
                $query->whereHas('locations', function ($q) use ($areaLocationIds) {
                    $q->whereIn('locations.id', $areaLocationIds);
                });
            } else {
                // No locations found for this area, return empty result
                $query->whereRaw('1 = 0');
            }
        }

        // Filter by work type
        if ($request->has('work_type') && $request->work_type) {
            $query->where('work_type', $request->work_type);
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        if ($sortBy === 'rate_low') {
            $query->orderBy('monthly_rate', 'asc');
        } elseif ($sortBy === 'rate_high') {
            $query->orderBy('monthly_rate', 'desc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $listings = $query->paginate(12);

        $filters = $request->only(['service_type', 'location_id', 'city_name', 'area', 'work_type', 'sort_by']);
        if ($locationDisplay) {
            $filters['location_display'] = $locationDisplay;
        }

        return response()->json([
            'listings' => ServiceListingResource::collection($listings)->response()->getData(true),
            'filters' => $filters,
        ]);
    }

    #[OA\Get(
        path: "/api/service-listings/create",
        summary: "Get service listing creation form",
        description: "Get form data for creating a service listing. Requires helper/business role and completed onboarding.",
        tags: ["Service Listings"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "Form data",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Service listing creation form"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Only helpers and businesses can create listings"),
            new OA\Response(response: 422, description: "Onboarding not completed"),
        ]
    )]
    /**
     * Show the form for creating a new resource
     */
    public function create()
    {
        // Only helpers and businesses can create service listings
        $user = Auth::user();
        if (!$user || !$user->hasRole(['helper', 'business'])) {
            abort(403, 'Only helpers and businesses can create service listings.');
        }

        // Check if onboarding is completed - if not, redirect to onboarding
        if (!$user->hasCompletedOnboarding()) {
            $redirectRoute = $user->hasRole('helper') ? 'onboarding.helper' : 'onboarding.business';
            return response()->json([
                'message' => 'Please complete your onboarding before creating service listings.',
                'redirect' => ['route' => $redirectRoute],
            ], 422);
        }

        return response()->json(['message' => 'Service listing creation form']);
    }

    #[OA\Post(
        path: "/api/service-listings",
        summary: "Create service listing",
        description: "Create a new service listing. Supports both single listing and multiple listings format.",
        tags: ["Service Listings"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(
                        property: "listings",
                        type: "array",
                        nullable: true,
                        description: "Array of listings (new format) - creates ONE listing with multiple service types and locations",
                        items: new OA\Items(
                            type: "object",
                            required: ["service_type", "work_type", "city", "area"],
                            properties: [
                                new OA\Property(property: "service_type", type: "string", enum: ["maid", "cook", "babysitter", "caregiver", "cleaner", "domestic_helper", "driver", "security_guard"]),
                                new OA\Property(property: "work_type", type: "string", enum: ["full_time", "part_time"]),
                                new OA\Property(property: "city", type: "string", maxLength: 255),
                                new OA\Property(property: "area", type: "string", maxLength: 255),
                                new OA\Property(property: "monthly_rate", type: "number", nullable: true, minimum: 0),
                                new OA\Property(property: "description", type: "string", nullable: true, maxLength: 2000),
                                new OA\Property(property: "pin_address", type: "string", maxLength: 500, description: "Exact pin address/location (required)"),
                                new OA\Property(property: "pin_latitude", type: "number", nullable: true, format: "float", description: "Latitude coordinate (-90 to 90)"),
                                new OA\Property(property: "pin_longitude", type: "number", nullable: true, format: "float", description: "Longitude coordinate (-180 to 180)"),
                            ]
                        )
                    ),
                    new OA\Property(property: "service_types", type: "array", nullable: true, items: new OA\Items(type: "string", enum: ["maid", "cook", "babysitter", "caregiver", "cleaner", "domestic_helper", "driver", "security_guard"]), description: "Array of service types (actual format)"),
                    new OA\Property(property: "locations", type: "array", nullable: true, items: new OA\Items(type: "integer"), description: "Array of location IDs (optional)"),
                    new OA\Property(property: "service_type", type: "string", nullable: true, enum: ["maid", "cook", "babysitter", "caregiver", "cleaner", "domestic_helper", "driver", "security_guard"], description: "Single listing format (backward compatibility)"),
                    new OA\Property(property: "work_type", type: "string", nullable: true, enum: ["full_time", "part_time"]),
                    new OA\Property(property: "city", type: "string", nullable: true, maxLength: 255),
                    new OA\Property(property: "area", type: "string", nullable: true, maxLength: 255),
                    new OA\Property(property: "monthly_rate", type: "number", nullable: true, minimum: 0),
                    new OA\Property(property: "description", type: "string", nullable: true, maxLength: 2000),
                    new OA\Property(property: "pin_address", type: "string", maxLength: 500, description: "Exact pin address/location (required)"),
                    new OA\Property(property: "pin_latitude", type: "number", nullable: true, format: "float", description: "Latitude coordinate (-90 to 90)"),
                    new OA\Property(property: "pin_longitude", type: "number", nullable: true, format: "float", description: "Longitude coordinate (-180 to 180)"),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Service listing created successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Service listing created successfully!"),
                        new OA\Property(property: "listing", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Only helpers and businesses can create listings"),
            new OA\Response(response: 422, description: "Validation error or onboarding not completed"),
        ]
    )]
    /**
     * Store a newly created resource in storage
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        if (!$user || !$user->hasRole(['helper', 'business'])) {
            abort(403, 'Only helpers and businesses can create service listings.');
        }

        // Check if onboarding is completed - if not, redirect to onboarding
        if (!$user->hasCompletedOnboarding()) {
            $redirectRoute = $user->hasRole('helper') ? 'onboarding.helper' : 'onboarding.business';
            return response()->json([
                'message' => 'Please complete your onboarding before creating service listings.',
                'redirect' => ['route' => $redirectRoute],
            ], 422);
        }

        // Handle services and locations if sent as JSON string (from FormData)
        $servicesData = $request->input('service_types');
        $decodedServices = $servicesData;
        if (is_string($servicesData)) {
            $decoded = json_decode($servicesData, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return response()->json([
                    'message' => 'Invalid service_types data format.',
                    'errors' => ['service_types' => ['Invalid service_types data format.']]
                ], 422);
            }
            $decodedServices = $decoded;
        }

        $locationsData = $request->input('locations');
        $decodedLocations = $locationsData;
        if (is_string($locationsData)) {
            $decoded = json_decode($locationsData, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return response()->json([
                    'message' => 'Invalid locations data format.',
                    'errors' => ['locations' => ['Invalid locations data format.']]
                ], 422);
            }
            $decodedLocations = $decoded;
        }

        $dataToValidate = $request->all();
        $dataToValidate['service_types'] = $decodedServices;
        $dataToValidate['locations'] = $decodedLocations;

        $validator = Validator::make($dataToValidate, [
            'service_types' => 'required|array|min:1',
            'service_types.*' => 'required|in:maid,cook,babysitter,caregiver,cleaner,domestic_helper,driver,security_guard',
            'locations' => 'nullable|array',
            'locations.*' => 'required|integer|exists:locations,id',
            'work_type' => 'required|in:full_time,part_time',
            'monthly_rate' => 'nullable|numeric|min:0',
            'description' => 'nullable|string|max:2000',
            'pin_address' => 'required|string|max:500',
            'pin_latitude' => 'nullable|numeric|between:-90,90',
            'pin_longitude' => 'nullable|numeric|between:-180,180',
            'status' => 'nullable|in:active,paused,closed',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors()
            ], 422);
        }
        $validated = $validator->validated();

        // Get or create profile
        $profile = $user->profile;
        if (!$profile) {
            $profile = $user->profile()->create([]);
        }

        // Create service listing
        $listing = ServiceListing::create([
            'profile_id' => $profile->id,
            'work_type' => $validated['work_type'],
            'monthly_rate' => $validated['monthly_rate'] ?? null,
            'description' => $validated['description'] ?? null,
            'pin_address' => $validated['pin_address'], // Required
            'pin_latitude' => $validated['pin_latitude'] ?? null,
            'pin_longitude' => $validated['pin_longitude'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'status' => $validated['status'] ?? 'active',
        ]);

        // Sync service types (convert slugs to IDs)
        $serviceTypeSlugs = $validated['service_types'];
        $serviceTypeIds = \App\Models\ServiceType::whereIn('slug', $serviceTypeSlugs)
            ->pluck('id')
            ->toArray();
        $listing->serviceTypes()->sync($serviceTypeIds);

        // Sync locations (if provided)
        if (!empty($validated['locations'])) {
            $listing->locations()->sync($validated['locations']);
        }

        return response()->json([
            'message' => 'Service listing created successfully!',
            'listing' => new ServiceListingResource($listing->load(['profile.profileable', 'serviceTypes', 'locations.city'])),
        ]);
    }

    #[OA\Get(
        path: "/api/service-listings/{serviceListing}",
        summary: "Get service listing details",
        description: "Get detailed information about a specific service listing. Only visible to helpers and guests.",
        tags: ["Service Listings"],
        parameters: [
            new OA\Parameter(name: "serviceListing", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Service listing ID"),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Service listing details",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "listing", type: "object"),
                        new OA\Property(property: "other_listings", type: "array", items: new OA\Items(type: "object")),
                        new OA\Property(property: "user", type: "object", nullable: true),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Service listings only available to helpers"),
            new OA\Response(response: 404, description: "Service listing not found"),
        ]
    )]
    /**
     * Display the specified resource (only visible to helpers and guests)
     */
    public function show(ServiceListing $serviceListing)
    {
        // Everyone can view service listings (helpers, businesses, users, and guests)
        // No restrictions on viewing

        $serviceListing->load(['profile.profileable', 'serviceTypes', 'locations.city']);

        // Get other active service listings from the same profile
        $otherListings = ServiceListing::where('profile_id', $serviceListing->profile_id)
            ->where('id', '!=', $serviceListing->id)
            ->where('is_active', true)
            ->where('status', 'active')
            ->with(['serviceTypes', 'locations.city'])
            ->limit(4)
            ->get();

        $currentUser = Auth::user();
        if ($currentUser) {
            $currentUser->load(['roles', 'profile']);
        }

        // Get matching service requests (bookings) for the owner
        $matchingBookings = collect([]);
        if ($currentUser && $currentUser->profile && $serviceListing->profile_id === $currentUser->profile->id) {
            // User owns this listing - find matching service requests
            $jobPostQuery = JobPost::with(['user', 'jobApplications'])
                ->where('status', 'pending')
                ->whereNull('assigned_user_id');

            // Match by service type (if listing has service types)
            $serviceTypeSlugs = $serviceListing->serviceTypes()->pluck('slug')->toArray();
            if (!empty($serviceTypeSlugs)) {
                $jobPostQuery->whereIn('service_type', $serviceTypeSlugs);
            }

            // Match by work type
            if ($serviceListing->work_type) {
                $jobPostQuery->where('work_type', $serviceListing->work_type);
            }

            // Match by location (if listing has locations)
            $locations = $serviceListing->locations()->with('city')->get();
            if ($locations->isNotEmpty()) {
                $jobPostQuery->where(function ($q) use ($locations) {
                    foreach ($locations as $location) {
                        $q->orWhere(function ($subQ) use ($location) {
                            $subQ->where('city', $location->city->name)
                                 ->where('area', $location->area);
                        });
                    }
                });
            }

            // Exclude job posts the user already applied to
            $jobPostQuery->whereDoesntHave('jobApplications', function ($q) use ($currentUser) {
                $q->where('user_id', $currentUser->id);
            });

            $matchingBookings = $jobPostQuery->orderBy('created_at', 'desc')->limit(5)->get();
        }

        return response()->json([
            'listing' => new ServiceListingResource($serviceListing),
            'other_listings' => ServiceListingResource::collection($otherListings),
            'user' => $currentUser ? new UserResource($currentUser) : null,
            'matching_bookings' => JobPostResource::collection($matchingBookings),
        ]);
    }

    #[OA\Get(
        path: "/api/service-listings/{serviceListing}/edit",
        summary: "Get service listing edit form",
        description: "Get service listing data for editing. Only owner or admin can edit.",
        tags: ["Service Listings"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "serviceListing", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Service listing ID"),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Service listing data",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "listing", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Can only edit own listings"),
        ]
    )]
    /**
     * Show the form for editing the specified resource
     */
    public function edit(ServiceListing $serviceListing)
    {
                // Only owner or admin can edit
                $user = Auth::user();
                $profile = $user->profile;
                if (!$profile || $serviceListing->profile_id !== $profile->id && !$user->hasRole(['admin', 'super_admin'])) {
                    abort(403);
                }

        $serviceListing->load(['profile.profileable', 'serviceTypes', 'locations.city']);

        return response()->json([
            'listing' => new ServiceListingResource($serviceListing),
        ]);
    }

    #[OA\Put(
        path: "/api/service-listings/{serviceListing}",
        summary: "Update service listing",
        description: "Update a service listing. Only owner or admin can update.",
        tags: ["Service Listings"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "serviceListing", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Service listing ID"),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["service_types", "work_type", "pin_address", "status"],
                properties: [
                    new OA\Property(property: "service_types", type: "array", items: new OA\Items(type: "string", enum: ["maid", "cook", "babysitter", "caregiver", "cleaner", "domestic_helper", "driver", "security_guard"])),
                    new OA\Property(property: "locations", type: "array", nullable: true, description: "Optional array of location IDs", items: new OA\Items(type: "integer")),
                    new OA\Property(property: "work_type", type: "string", enum: ["full_time", "part_time"]),
                    new OA\Property(property: "monthly_rate", type: "number", nullable: true, minimum: 0),
                    new OA\Property(property: "description", type: "string", nullable: true, maxLength: 2000),
                    new OA\Property(property: "pin_address", type: "string", maxLength: 500, description: "Exact pin address/location (required)"),
                    new OA\Property(property: "pin_latitude", type: "number", nullable: true, format: "float", description: "Latitude coordinate (-90 to 90)"),
                    new OA\Property(property: "pin_longitude", type: "number", nullable: true, format: "float", description: "Longitude coordinate (-180 to 180)"),
                    new OA\Property(property: "status", type: "string", enum: ["active", "paused", "closed"]),
                    new OA\Property(property: "is_active", type: "boolean", nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Service listing updated successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Service listing updated successfully!"),
                        new OA\Property(property: "listing", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Can only update own listings"),
            new OA\Response(response: 422, description: "Validation error"),
        ]
    )]
    /**
     * Update the specified resource in storage
     */
    public function update(Request $request, ServiceListing $serviceListing)
    {
                // Only owner or admin can update
                $user = Auth::user();
                $profile = $user->profile;
                if (!$profile || $serviceListing->profile_id !== $profile->id && !$user->hasRole(['admin', 'super_admin'])) {
                    abort(403);
                }

        $validated = $request->validate([
            'service_types' => 'required|array|min:1',
            'service_types.*' => 'required|in:maid,cook,babysitter,caregiver,cleaner,domestic_helper,driver,security_guard',
            'locations' => 'nullable|array',
            'locations.*' => 'required|integer|exists:locations,id',
            'work_type' => 'required|in:full_time,part_time',
            'monthly_rate' => 'nullable|numeric|min:0',
            'description' => 'nullable|string|max:2000',
            'pin_address' => 'required|string|max:500',
            'pin_latitude' => 'nullable|numeric|between:-90,90',
            'pin_longitude' => 'nullable|numeric|between:-180,180',
            'status' => 'required|in:active,paused,closed',
            'is_active' => 'boolean',
        ]);

        // Update main listing fields
        $serviceListing->update([
            'work_type' => $validated['work_type'],
            'monthly_rate' => $validated['monthly_rate'] ?? null,
            'description' => $validated['description'] ?? null,
            'pin_address' => $validated['pin_address'], // Required
            'pin_latitude' => $validated['pin_latitude'] ?? null,
            'pin_longitude' => $validated['pin_longitude'] ?? null,
            'status' => $validated['status'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        // Sync service types (convert slugs to IDs)
        $serviceTypeSlugs = $validated['service_types'];
        $serviceTypeIds = \App\Models\ServiceType::whereIn('slug', $serviceTypeSlugs)
            ->pluck('id')
            ->toArray();
        $serviceListing->serviceTypes()->sync($serviceTypeIds);

        // Sync locations (if provided)
        if (!empty($validated['locations'])) {
            $serviceListing->locations()->sync($validated['locations']);
        } else {
            // If locations is empty array, remove all locations
            $serviceListing->locations()->sync([]);
        }

        return response()->json([
            'message' => 'Service listing updated successfully!',
            'listing' => new ServiceListingResource($serviceListing->load(['profile.profileable', 'serviceTypes', 'locations.city'])),
        ]);
    }

    #[OA\Delete(
        path: "/api/service-listings/{serviceListing}",
        summary: "Delete service listing",
        description: "Delete a service listing. Only owner or admin can delete.",
        tags: ["Service Listings"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "serviceListing", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Service listing ID"),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Service listing deleted successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Service listing deleted successfully!"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Can only delete own listings"),
        ]
    )]
    /**
     * Remove the specified resource from storage
     */
    public function destroy(ServiceListing $serviceListing)
    {
        // Only owner or admin can delete
        $user = Auth::user();
        $profile = $user->profile;
        if (!$profile || $serviceListing->profile_id !== $profile->id && !$user->hasRole(['admin', 'super_admin'])) {
            abort(403);
        }

        $serviceListing->delete();

        return response()->json([
            'message' => 'Service listing deleted successfully!',
        ]);
    }

    #[OA\Get(
        path: "/api/service-listings/my-service-listings",
        summary: "Get my service listings",
        description: "Get paginated list of service listings created by the authenticated user (helper/business)",
        tags: ["Service Listings"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of user's service listings",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "listings", type: "object", description: "Paginated list of service listings"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Only helpers and businesses can view their listings"),
        ]
    )]
    /**
     * Show my service listings (for helpers/businesses)
     */
    public function myListings()
    {
        $user = Auth::user();
        if (!$user->hasRole(['helper', 'business'])) {
            abort(403);
        }

        // Get user's profile
        $profile = $user->profile;
        if (!$profile) {
            return response()->json([
                'listings' => [
                    'data' => [],
                    'links' => [],
                    'meta' => []
                ],
            ]);
        }

        // Get service listings for this profile
        $listings = ServiceListing::where('profile_id', $profile->id)
            ->with(['serviceTypes', 'locations.city'])
            ->orderBy('created_at', 'desc')
            ->paginate(12);

        return response()->json([
            'listings' => ServiceListingResource::collection($listings)->response()->getData(true),
        ]);
    }
}
