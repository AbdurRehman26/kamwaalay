<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use App\Models\City;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Helpers", description: "Helper profile management endpoints")]
class HelperController extends Controller
{
    #[OA\Get(
        path: "/api/helpers",
        summary: "List helpers",
        description: "Get a paginated list of verified helpers and businesses with filtering options",
        tags: ["Helpers"],
        parameters: [
            new OA\Parameter(name: "user_type", in: "query", required: false, schema: new OA\Schema(type: "string", enum: ["all", "helper", "business"]), description: "Filter by user type"),
            new OA\Parameter(name: "service_type", in: "query", required: false, schema: new OA\Schema(type: "string", enum: ["maid", "cook", "babysitter", "caregiver", "cleaner", "domestic_helper", "driver", "security_guard"]), description: "Filter by service type"),
            new OA\Parameter(name: "location_id", in: "query", required: false, schema: new OA\Schema(type: "integer"), description: "Filter by location ID"),
            new OA\Parameter(name: "city_name", in: "query", required: false, schema: new OA\Schema(type: "string"), description: "Filter by city name"),
            new OA\Parameter(name: "area", in: "query", required: false, schema: new OA\Schema(type: "string"), description: "Filter by area"),
            new OA\Parameter(name: "min_experience", in: "query", required: false, schema: new OA\Schema(type: "integer"), description: "Minimum years of experience"),
            new OA\Parameter(name: "sort_by", in: "query", required: false, schema: new OA\Schema(type: "string", enum: ["rating", "experience"]), description: "Sort by rating or experience"),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of helpers",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "helpers", type: "object", description: "Paginated list of helpers"),
                        new OA\Property(property: "filters", type: "object", description: "Applied filters"),
                    ]
                )
            ),
        ]
    )]
    public function index(Request $request)
    {
        // Filter by user type: 'all', 'helper', or 'business'
        $userType = $request->get('user_type', 'all');

        // Base query for helpers and businesses
        $query = User::where(function ($q) use ($userType) {
            if ($userType === 'helper') {
                // Show only helpers
                $q->role('helper')
                  ->whereHas('profile', function ($profileQ) {
                      $profileQ->where('verification_status', 'verified')
                               ->where('profiles.is_active', true);
                  })
                  ->where('users.is_active', true);
            } elseif ($userType === 'business') {
                // Show only businesses
                $q->role('business')
                  ->where('users.is_active', true);
            } else {
                // Show both helpers and businesses (default)
                $q->where(function ($subQ) {
                    $subQ->role('helper')
                         ->whereHas('profile', function ($profileQ) {
                             $profileQ->where('verification_status', 'verified')
                                      ->where('profiles.is_active', true);
                         })
                         ->where('users.is_active', true);
                })->orWhere(function ($subQ) {
                    $subQ->role('business')
                         ->where('users.is_active', true);
                });
            }
        });

        // Filter by service type (from profile)
        if ($request->has('service_type') && $request->service_type) {
            $query->whereHas('profile', function ($q) use ($request) {
                $q->where('service_type', $request->service_type);
            });
        }

        // Filter by location (from profile or service listings pin)
        $locationDisplay = '';
        if ($request->has('latitude') && $request->has('longitude')) {
            $lat = $request->latitude;
            $lng = $request->longitude;
            
            // Filter users who have service listings near the location
            $query->whereHas('profile.serviceListings', function ($q) use ($lat, $lng) {
                $q->nearLocation($lat, $lng);
            });
            
            $locationDisplay = 'Near Me';
        } elseif ($request->has('city_id') && $request->city_id) {
            // Filter by city ID - find listings with pin location in that city
            $city = City::find($request->city_id);
            if ($city) {
                $query->whereHas('profile.serviceListings', function ($q) use ($city) {
                    $q->where('city_id', $city->id);
                });
                $locationDisplay = $city->name;
            }
        } elseif ($request->has('city_name') && $request->city_name) {
            // If city name provided, filter by city
            $query->whereHas('profile', function ($q) use ($request) {
                $q->where('city', $request->city_name);
            });
            $locationDisplay = $request->city_name;
        }

        // Filter by experience
        if ($request->has('min_experience')) {
            $query->whereHas('profile', function ($q) use ($request) {
                $q->where('experience_years', '>=', $request->min_experience);
            });
        }

        // Sort by rating or experience (from profile)
        $sortBy = $request->get('sort_by', 'rating');
        if ($sortBy === 'experience') {
            $query->join('profiles', function ($join) {
                $join->on('users.id', '=', 'profiles.profileable_id')
                     ->where('profiles.profileable_type', '=', 'App\Models\User');
            })
            ->orderBy('profiles.experience_years', 'desc')
            ->select('users.*');
        } else {
            $query->join('profiles', function ($join) {
                $join->on('users.id', '=', 'profiles.profileable_id')
                     ->where('profiles.profileable_type', '=', 'App\Models\User');
            })
            ->orderBy('profiles.rating', 'desc')
            ->select('users.*');
        }

        $helpers = $query->with(['roles', 'profile', 'serviceListings' => function ($query) {
            $query->where('service_listings.is_active', true)
                  ->where('service_listings.status', 'active');
        }])->paginate(12);

        $filters = $request->only(['service_type', 'location_id', 'city_id', 'city_name', 'area', 'min_experience', 'sort_by', 'user_type', 'latitude', 'longitude']);
        if ($locationDisplay) {
            $filters['location_display'] = $locationDisplay;
        }

        return response()->json([
            'helpers' => UserResource::collection($helpers)->response()->getData(true),
            'filters' => $filters,
        ]);
    }

    #[OA\Get(
        path: "/api/helpers/{helper}",
        summary: "Get helper details",
        description: "Get detailed information about a specific helper including reviews, documents, and service listings",
        tags: ["Helpers"],
        parameters: [
            new OA\Parameter(name: "helper", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Helper user ID"),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Helper details",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "helper", type: "object", description: "Helper user object with reviews, documents, and service listings"),
                    ]
                )
            ),
            new OA\Response(response: 404, description: "Helper not found"),
        ]
    )]
    public function show(User $helper)
    {
        if (!$helper->hasRole('helper')) {
            abort(404);
        }

        $helper->load(['roles', 'profile', 'helperReviews.user', 'documents', 'serviceListings' => function ($query) {
            $query->where('service_listings.is_active', true)
                  ->where('service_listings.status', 'active');
        }]);

        return response()->json([
            'helper' => new UserResource($helper),
        ]);
    }

    #[OA\Get(
        path: "/api/helpers/create",
        summary: "Get helper creation form",
        description: "Get form data for creating a helper profile",
        tags: ["Helpers"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "Form data",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Helper creation form"),
                    ]
                )
            ),
        ]
    )]
    public function create(): JsonResponse
    {
        return response()->json(['message' => 'Helper creation form']);
    }

    #[OA\Post(
        path: "/api/helpers",
        summary: "Create helper profile",
        description: "Create or update helper profile information",
        tags: ["Helpers"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    required: ["service_type", "experience_years", "city", "area", "availability"],
                    properties: [
                        new OA\Property(property: "photo", type: "string", format: "binary", description: "Helper profile photo"),
                        new OA\Property(property: "service_type", type: "string", enum: ["maid", "cook", "babysitter", "caregiver", "cleaner", "domestic_helper", "driver", "security_guard"]),
                        new OA\Property(property: "experience_years", type: "integer", minimum: 0),
                        new OA\Property(property: "city", type: "string", maxLength: 255),
                        new OA\Property(property: "area", type: "string", maxLength: 255),
                        new OA\Property(property: "availability", type: "string", enum: ["full_time", "part_time", "available"]),
                        new OA\Property(property: "bio", type: "string", nullable: true),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Helper profile created successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Helper profile created successfully!"),
                        new OA\Property(property: "helper", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - User is not a helper"),
            new OA\Response(response: 422, description: "Validation error"),
        ]
    )]
    public function store(Request $request)
    {
        $validated = $request->validate([
            'photo' => 'nullable|image|max:2048',
            'service_type' => 'required|in:maid,cook,babysitter,caregiver,cleaner,domestic_helper,driver,security_guard',
            'experience_years' => 'required|integer|min:0',
            'city' => 'required|string|max:255',
            'area' => 'required|string|max:255',
            'availability' => 'required|in:full_time,part_time,available',
            'bio' => 'nullable|string',
        ]);

        $user = Auth::user();

        if (!$user->hasRole('helper')) {
            abort(403);
        }

        if ($request->hasFile('photo')) {
            $validated['photo'] = $request->file('photo')->store('helpers/photos', 'public');
        }

        // Create or update profile
        $user->profile()->updateOrCreate(
            ['profileable_id' => $user->id, 'profileable_type' => 'App\Models\User'],
            $validated
        );

        return response()->json([
            'message' => 'Helper profile created successfully!',
            'helper' => new UserResource($user->load(['roles', 'profile'])),
        ]);
    }

    #[OA\Get(
        path: "/api/helpers/{helper}/edit",
        summary: "Get helper edit form",
        description: "Get helper profile data for editing",
        tags: ["Helpers"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "helper", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Helper user ID"),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Helper profile data",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "helper", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Can only edit own profile"),
            new OA\Response(response: 404, description: "Helper not found"),
        ]
    )]
    public function edit(User $helper)
    {
        if (!$helper->hasRole('helper')) {
            abort(404);
        }

        // Only allow editing own profile (unless admin)
        if (Auth::id() !== $helper->id && !Auth::user()->isAdmin()) {
            abort(403);
        }

        return response()->json([
            'helper' => $helper->load('roles'),
        ]);
    }

    #[OA\Put(
        path: "/api/helpers/{helper}",
        summary: "Update helper profile",
        description: "Update helper profile information",
        tags: ["Helpers"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "helper", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Helper user ID"),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    required: ["service_type", "experience_years", "city", "area", "availability"],
                    properties: [
                        new OA\Property(property: "photo", type: "string", format: "binary", description: "Helper profile photo"),
                        new OA\Property(property: "service_type", type: "string", enum: ["maid", "cook", "babysitter", "caregiver", "cleaner", "domestic_helper", "driver", "security_guard"]),
                        new OA\Property(property: "experience_years", type: "integer", minimum: 0),
                        new OA\Property(property: "city", type: "string", maxLength: 255),
                        new OA\Property(property: "area", type: "string", maxLength: 255),
                        new OA\Property(property: "availability", type: "string", enum: ["full_time", "part_time", "available"]),
                        new OA\Property(property: "bio", type: "string", nullable: true),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Helper profile updated successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Helper profile updated successfully!"),
                        new OA\Property(property: "helper", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Can only edit own profile"),
            new OA\Response(response: 404, description: "Helper not found"),
            new OA\Response(response: 422, description: "Validation error"),
        ]
    )]
    public function update(Request $request, User $helper)
    {
        if (!$helper->hasRole('helper')) {
            abort(404);
        }

        // Only allow editing own profile (unless admin)
        if (Auth::id() !== $helper->id && !Auth::user()->isAdmin()) {
            abort(403);
        }

        $validated = $request->validate([
            'photo' => 'nullable|image|max:2048',
            'service_type' => 'required|in:maid,cook,babysitter,caregiver,cleaner,domestic_helper,driver,security_guard',
            'experience_years' => 'required|integer|min:0',
            'city' => 'required|string|max:255',
            'area' => 'required|string|max:255',
            'availability' => 'required|in:full_time,part_time,available',
            'bio' => 'nullable|string',
        ]);

        if ($request->hasFile('photo')) {
            // Delete old photo
            if ($helper->profile && $helper->profile->photo) {
                Storage::disk('public')->delete($helper->profile->photo);
            }
            $validated['photo'] = $request->file('photo')->store('helpers/photos', 'public');
        }

        // Update or create profile
        $helper->profile()->updateOrCreate(
            ['profileable_id' => $helper->id, 'profileable_type' => 'App\Models\User'],
            $validated
        );

        return response()->json([
            'message' => 'Helper profile updated successfully!',
            'helper' => new UserResource($helper->load(['roles', 'profile'])),
        ]);
    }
}
