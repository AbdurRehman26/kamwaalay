<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use App\Models\Booking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Business", description: "Business management endpoints")]
class BusinessController extends Controller
{
    public function __construct()
    {
        // Dashboard and worker management routes require auth
        $this->middleware('auth')->except(['index', 'show']);
    }

    #[OA\Get(
        path: "/api/businesses",
        summary: "List businesses",
        description: "Get a paginated list of active businesses with filtering options (public access)",
        tags: ["Business"],
        parameters: [
            new OA\Parameter(name: "location_id", in: "query", required: false, schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "city_name", in: "query", required: false, schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "area", in: "query", required: false, schema: new OA\Schema(type: "string")),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of businesses",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "businesses", type: "object", description: "Paginated list of businesses"),
                        new OA\Property(property: "filters", type: "object", description: "Applied filters"),
                    ]
                )
            ),
        ]
    )]
    /**
     * Display a listing of businesses (public)
     */
    public function index(Request $request)
    {
        $query = User::role('business')
            ->where('users.is_active', true);

        // Filter by location (from profile)
        $locationDisplay = '';
        if ($request->has('location_id') && $request->location_id) {
            $location = \App\Models\Location::find($request->location_id);
            if ($location) {
                $location->load('city');
                $query->whereHas('profile', function ($q) use ($location) {
                    $q->where('city', $location->city->name)
                      ->where('area', $location->area);
                });
                $locationDisplay = $location->area 
                    ? $location->city->name . ', ' . $location->area 
                    : $location->city->name;
            }
        } elseif ($request->has('city_name') && $request->city_name) {
            $query->whereHas('profile', function ($q) use ($request) {
                $q->where('city', $request->city_name);
            });
            $locationDisplay = $request->city_name;
        } elseif ($request->has('area') && $request->area) {
            $query->whereHas('profile', function ($q) use ($request) {
                $q->where('area', 'like', '%' . $request->area . '%');
            });
        }

        $businesses = $query->with(['roles', 'profile', 'serviceListings'])
            ->orderBy('created_at', 'desc')
            ->paginate(12);

        $filters = $request->only(['location_id', 'city_name', 'area']);
        if ($locationDisplay) {
            $filters['location_display'] = $locationDisplay;
        }

        return response()->json([
            'businesses' => UserResource::collection($businesses)->response()->getData(true),
            'filters' => $filters,
        ]);
    }

    #[OA\Get(
        path: "/api/businesses/{business}",
        summary: "Get business details",
        description: "Get detailed information about a specific business including service listings and helpers (public access)",
        tags: ["Business"],
        parameters: [
            new OA\Parameter(name: "business", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Business user ID"),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Business details",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "business", type: "object", description: "Business user object with service listings and helpers"),
                    ]
                )
            ),
            new OA\Response(response: 404, description: "Business not found"),
        ]
    )]
    /**
     * Display the specified business profile (public)
     */
    public function show(User $business)
    {
        if (!$business->hasRole('business')) {
            abort(404);
        }

        $business->load([
            'roles',
            'profile',
            'serviceListings' => function ($query) {
                $query->where('is_active', true)->where('status', 'active');
            },
            'helpers' => function ($query) {
                $query->where('users.is_active', true)
                      ->with(['roles', 'profile', 'serviceListings'])
                      ->whereHas('profile', function ($q) {
                          $q->where('verification_status', 'verified');
                      })
                      ->limit(10);
            }
        ]);

        return response()->json([
            'business' => new UserResource($business),
        ]);
    }

    #[OA\Get(
        path: "/api/business/dashboard",
        summary: "Get business dashboard",
        description: "Get business dashboard statistics and recent activity",
        tags: ["Business"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "Business dashboard data",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "stats", type: "object", description: "Business statistics"),
                        new OA\Property(property: "recent_workers", type: "array", items: new OA\Items(type: "object")),
                        new OA\Property(property: "recent_bookings", type: "array", items: new OA\Items(type: "object")),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Only businesses can access dashboard"),
        ]
    )]
    public function dashboard()
    {
        $business = Auth::user();
        
        if (!$business->isBusiness()) {
            abort(403);
        }

        $stats = [
            'total_workers' => $business->helpers()->count(),
            'active_workers' => $business->helpers()->whereHas('profile', function ($q) {
                $q->where('is_active', true);
            })->count(),
            'pending_verification' => $business->helpers()->whereHas('profile', function ($q) {
                $q->where('verification_status', 'pending');
            })->count(),
            'verified_workers' => $business->helpers()->whereHas('profile', function ($q) {
                $q->where('verification_status', 'verified');
            })->count(),
            'total_bookings' => Booking::whereIn('assigned_user_id', $business->helpers()->pluck('users.id')->toArray())->count(),
        ];

        $recentWorkers = $business->helpers()
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        $helperIds = $business->helpers()->pluck('users.id')->toArray();
        $recentBookings = Booking::whereIn('assigned_user_id', $helperIds)
        ->with(['user', 'assignedUser'])
        ->orderBy('created_at', 'desc')
        ->take(10)
        ->get();

        return response()->json([
            'stats' => $stats,
            'recent_workers' => $recentWorkers,
            'recent_bookings' => $recentBookings,
        ]);
    }

    #[OA\Get(
        path: "/api/business/workers",
        summary: "List business workers",
        description: "Get paginated list of workers associated with the business",
        tags: ["Business"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of workers",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "workers", type: "object", description: "Paginated list of workers"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Only businesses can view workers"),
        ]
    )]
    public function workers(Request $request)
    {
        $business = Auth::user();
        
        if (!$business->isBusiness()) {
            abort(403);
        }

        $workers = $business->helpers()
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'workers' => $workers,
        ]);
    }

    #[OA\Get(
        path: "/api/business/workers/create",
        summary: "Get worker creation form",
        description: "Get form data for creating a new worker",
        tags: ["Business"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "Form data",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Worker creation form"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Only businesses can create workers"),
        ]
    )]
    public function createWorker()
    {
        $business = Auth::user();
        
        if (!$business->isBusiness()) {
            abort(403);
        }

        return response()->json(['message' => 'Worker creation form']);
    }

    #[OA\Post(
        path: "/api/business/workers",
        summary: "Create worker",
        description: "Create a new worker account and associate it with the business",
        tags: ["Business"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: "multipart/form-data",
                schema: new OA\Schema(
                    required: ["name", "email", "phone", "service_type", "experience_years", "city", "area", "availability", "password"],
                    properties: [
                        new OA\Property(property: "name", type: "string", maxLength: 255),
                        new OA\Property(property: "email", type: "string", format: "email", maxLength: 255),
                        new OA\Property(property: "phone", type: "string", maxLength: 20),
                        new OA\Property(property: "photo", type: "string", format: "binary", nullable: true),
                        new OA\Property(property: "service_type", type: "string", enum: ["maid", "cook", "babysitter", "caregiver", "cleaner", "all_rounder"]),
                        new OA\Property(property: "skills", type: "string", nullable: true),
                        new OA\Property(property: "experience_years", type: "integer", minimum: 0),
                        new OA\Property(property: "city", type: "string", maxLength: 255),
                        new OA\Property(property: "area", type: "string", maxLength: 255),
                        new OA\Property(property: "availability", type: "string", enum: ["full_time", "part_time", "available"]),
                        new OA\Property(property: "bio", type: "string", nullable: true),
                        new OA\Property(property: "password", type: "string", format: "password", minLength: 8),
                        new OA\Property(property: "password_confirmation", type: "string", format: "password"),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Worker created successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Worker added successfully!"),
                        new OA\Property(property: "worker", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Only businesses can create workers"),
            new OA\Response(response: 422, description: "Validation error"),
        ]
    )]
    public function storeWorker(Request $request)
    {
        $business = Auth::user();
        
        if (!$business->isBusiness()) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|max:20',
            'photo' => 'nullable|image|max:2048',
            'service_type' => 'required|in:maid,cook,babysitter,caregiver,cleaner,all_rounder',
            'skills' => 'nullable|string',
            'experience_years' => 'required|integer|min:0',
            'city' => 'required|string|max:255',
            'area' => 'required|string|max:255',
            'availability' => 'required|in:full_time,part_time,available',
            'bio' => 'nullable|string',
            'password' => 'required|min:8|confirmed',
        ]);

        // Create user account for the worker
        $helperData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
            'service_type' => $validated['service_type'],
            'skills' => $validated['skills'] ?? null,
            'experience_years' => $validated['experience_years'],
            'city' => $validated['city'],
            'area' => $validated['area'],
            'availability' => $validated['availability'],
            'bio' => $validated['bio'] ?? null,
        ];

        if ($request->hasFile('photo')) {
            $helperData['photo'] = $request->file('photo')->store('helpers/photos', 'public');
        }

        $helper = User::create($helperData);
        $helper->assignRole('helper');

        // Attach to business via pivot table
        $business->helpers()->attach($helper->id, [
            'status' => 'active',
            'joined_at' => now(),
        ]);

        return response()->json([
            'message' => 'Worker added successfully!',
            'worker' => $helper->load('roles'),
        ]);
    }

    #[OA\Get(
        path: "/api/business/workers/{helper}/edit",
        summary: "Get worker edit form",
        description: "Get worker data for editing. Only business owner can edit their workers.",
        tags: ["Business"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "helper", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Helper user ID"),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Worker data",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "worker", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Can only edit own business workers"),
        ]
    )]
    public function editWorker(User $helper)
    {
        $business = Auth::user();
        
        if (!$business->isBusiness() || !$business->helpers()->where('users.id', $helper->id)->exists()) {
            abort(403);
        }

        if (!$helper->hasRole('helper')) {
            abort(404);
        }

        return response()->json([
            'helper' => new UserResource($helper->load('roles')),
        ]);
    }

    #[OA\Put(
        path: "/api/business/workers/{helper}",
        summary: "Update worker",
        description: "Update worker information. Only business owner can update their workers.",
        tags: ["Business"],
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
                        new OA\Property(property: "photo", type: "string", format: "binary", nullable: true),
                        new OA\Property(property: "service_type", type: "string", enum: ["maid", "cook", "babysitter", "caregiver", "cleaner", "all_rounder"]),
                        new OA\Property(property: "skills", type: "string", nullable: true),
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
                description: "Worker updated successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Worker updated successfully!"),
                        new OA\Property(property: "worker", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Can only update own business workers"),
            new OA\Response(response: 422, description: "Validation error"),
        ]
    )]
    public function updateWorker(Request $request, User $helper)
    {
        $business = Auth::user();
        
        if (!$business->isBusiness() || !$business->helpers()->where('users.id', $helper->id)->exists()) {
            abort(403);
        }

        if (!$helper->hasRole('helper')) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $helper->id,
            'phone' => 'required|string|max:20',
            'photo' => 'nullable|image|max:2048',
            'service_type' => 'required|in:maid,cook,babysitter,caregiver,cleaner,all_rounder',
            'skills' => 'nullable|string',
            'experience_years' => 'required|integer|min:0',
            'city' => 'required|string|max:255',
            'area' => 'required|string|max:255',
            'availability' => 'required|in:full_time,part_time,available',
            'bio' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        // Update user basic data
        $userData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
        ];
        $helper->update($userData);

        // Update or create profile
        $profileData = [
            'service_type' => $validated['service_type'],
            'skills' => $validated['skills'] ?? null,
            'experience_years' => $validated['experience_years'],
            'city' => $validated['city'],
            'area' => $validated['area'],
            'availability' => $validated['availability'],
            'bio' => $validated['bio'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ];

        if ($request->hasFile('photo')) {
            // Delete old photo
            if ($helper->profile && $helper->profile->photo) {
                Storage::disk('public')->delete($helper->profile->photo);
            }
            $profileData['photo'] = $request->file('photo')->store('helpers/photos', 'public');
        }

        $helper->profile()->updateOrCreate(
            ['profileable_id' => $helper->id, 'profileable_type' => 'App\Models\User'],
            $profileData
        );

        return response()->json([
            'message' => 'Worker updated successfully!',
            'worker' => new UserResource($helper->load(['roles', 'profile'])),
        ]);
    }

    #[OA\Delete(
        path: "/api/business/workers/{helper}",
        summary: "Delete worker",
        description: "Remove a worker from the business. Only business owner can delete their workers.",
        tags: ["Business"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "helper", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Helper user ID"),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Worker removed successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Worker removed successfully!"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Can only delete own business workers"),
        ]
    )]
    public function destroyWorker(User $helper)
    {
        $business = Auth::user();
        
        if (!$business->isBusiness() || !$business->helpers()->where('users.id', $helper->id)->exists()) {
            abort(403);
        }

        // Detach from business (don't delete the user, just remove relationship)
        $business->helpers()->detach($helper->id);

        return response()->json([
            'message' => 'Worker removed from your agency successfully!',
        ]);
    }
}
