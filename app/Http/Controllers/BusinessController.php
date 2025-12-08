<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use App\Models\JobPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
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
                $query->where('service_listings.is_active', true)->where('service_listings.status', 'active');
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
            'total_bookings' => JobPost::whereIn('assigned_user_id', $business->helpers()->pluck('users.id')->toArray())->count(),
        ];

        $recentWorkers = $business->helpers()
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        $helperIds = $business->helpers()->pluck('users.id')->toArray();
        $recentBookings = JobPost::whereIn('assigned_user_id', $helperIds)
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
            ->with(['serviceListings' => function ($query) {
                $query->where('service_listings.is_active', true)
                      ->where('service_listings.status', 'active');
            }])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        // Transform workers using UserResource to get proper service_listings format
        $transformedWorkers = $workers->through(function ($worker) {
            return new UserResource($worker);
        });

        return response()->json([
            'workers' => $transformedWorkers,
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
                    required: ["name", "service_types", "locations", "experience_years", "availability"],
                    properties: [
                        new OA\Property(property: "name", type: "string", maxLength: 255),
                        new OA\Property(property: "phone", type: "string", maxLength: 20, nullable: true),
                        new OA\Property(property: "photo", type: "string", format: "binary", nullable: true),
                        new OA\Property(property: "service_types", type: "array", items: new OA\Items(type: "string", enum: ["maid", "cook", "babysitter", "caregiver", "cleaner", "all_rounder"])),
                        new OA\Property(property: "locations", type: "array", items: new OA\Items(
                            type: "object",
                            properties: [
                                new OA\Property(property: "city", type: "string"),
                                new OA\Property(property: "area", type: "string"),
                            ]
                        )),
                        new OA\Property(property: "skills", type: "string", nullable: true),
                        new OA\Property(property: "experience_years", type: "integer", minimum: 0),
                        new OA\Property(property: "availability", type: "string", enum: ["full_time", "part_time", "available"]),
                        new OA\Property(property: "bio", type: "string", nullable: true),
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
            'phone' => 'nullable|string|max:20',
            'photo' => 'nullable|image|max:2048',
            'service_types' => 'required|array|min:1',
            'service_types.*' => 'required|in:maid,cook,babysitter,caregiver,cleaner,all_rounder',
            'locations' => 'required|array|min:1',
            'locations.*.city' => 'required|string|max:255',
            'locations.*.area' => 'required|string|max:255',
            'skills' => 'nullable|string',
            'experience_years' => 'required|integer|min:0',
            'availability' => 'required|in:full_time,part_time,available',
            'bio' => 'nullable|string',
        ]);

        // Create user account for the worker
        // Generate a unique email if not provided (using phone or timestamp)
        $email = $request->input('email');
        if (!$email) {
            // Generate a unique email based on phone or timestamp
            $phone = $validated['phone'] ?? '';
            $baseEmail = $phone ? str_replace([' ', '-', '(', ')'], '', $phone) : 'worker_' . time();
            $email = $baseEmail . '@worker.kamwaalay.local';

            // Ensure uniqueness
            $counter = 1;
            while (User::where('email', $email)->exists()) {
                $email = $baseEmail . '_' . $counter . '@worker.kamwaalay.local';
                $counter++;
            }
        }

        // Generate a random password if not provided
        $password = $request->input('password');
        if (!$password) {
            $password = \Str::random(16);
        }

        $userData = [
            'name' => $validated['name'],
            'email' => $email,
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($password),
            'is_active' => true,
        ];

        $helper = User::create($userData);
        $helper->assignRole('helper');

        // Use first location for profile (primary location)
        $primaryLocation = $validated['locations'][0];

        // Create profile for the worker
        $profileData = [
            'service_type' => $validated['service_types'][0], // Primary service type
            'skills' => $validated['skills'] ?? null,
            'experience_years' => $validated['experience_years'],
            'city' => $primaryLocation['city'],
            'area' => $primaryLocation['area'],
            'availability' => $validated['availability'],
            'bio' => $validated['bio'] ?? null,
            'is_active' => true,
            'verification_status' => 'pending', // Default status
        ];

        if ($request->hasFile('photo')) {
            $profileData['photo'] = $request->file('photo')->store('helpers/photos', 'public');
        }

        $profile = $helper->profile()->create($profileData);

        // Create service listing with all service types and locations
        $serviceListingData = [
            'profile_id' => $profile->id,
            'work_type' => $validated['availability'], // Map availability to work_type
            'service_types' => $validated['service_types'], // JSON array
            'locations' => array_map(function($location) {
                // Find or create location ID
                $locationModel = \App\Models\Location::firstOrCreate([
                    'city_id' => \App\Models\City::firstOrCreate(['name' => $location['city']])->id,
                    'area' => $location['area'],
                ]);
                return $locationModel->id;
            }, $validated['locations']), // JSON array of location IDs
            'description' => $validated['bio'],
            'is_active' => true,
            'status' => 'active',
        ];

        \App\Models\ServiceListing::create($serviceListingData);

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
            'helper' => new UserResource($helper->load(['roles', 'serviceListings'])),
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

        // Handle FormData arrays - Laravel might not parse nested arrays correctly with PUT requests
        // Manually reconstruct arrays from request input
        $allInput = $request->all();

        // Reconstruct service_types array
        $parsedServiceTypes = [];
        if (isset($allInput['service_types']) && is_array($allInput['service_types'])) {
            $parsedServiceTypes = array_values($allInput['service_types']);
        } else {
            // Try to get from raw input if not parsed correctly
            $rawInput = $request->input();
            foreach ($rawInput as $key => $value) {
                if (preg_match('/^service_types\[(\d+)\]$/', $key, $matches)) {
                    $parsedServiceTypes[(int)$matches[1]] = $value;
                }
            }
            ksort($parsedServiceTypes);
            $parsedServiceTypes = array_values($parsedServiceTypes);
        }

        // Reconstruct locations array
        $parsedLocations = [];
        if (isset($allInput['locations']) && is_array($allInput['locations'])) {
            $parsedLocations = array_values($allInput['locations']);
        } else {
            // Try to get from raw input if not parsed correctly
            $rawInput = $request->input();
            $locationIndexes = [];
            foreach ($rawInput as $key => $value) {
                if (preg_match('/^locations\[(\d+)\]\[(city|area)\]$/', $key, $matches)) {
                    $index = (int)$matches[1];
                    $field = $matches[2];
                    if (!isset($locationIndexes[$index])) {
                        $locationIndexes[$index] = [];
                    }
                    $locationIndexes[$index][$field] = $value;
                }
            }
            ksort($locationIndexes);
            $parsedLocations = array_values($locationIndexes);
        }

        // Merge parsed data with request data for validation
        $dataToValidate = $allInput;
        $dataToValidate['service_types'] = $parsedServiceTypes;
        $dataToValidate['locations'] = $parsedLocations;

        $validated = \Validator::make($dataToValidate, [
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'photo' => 'nullable|image|max:2048',
            'service_types' => 'required|array|min:1',
            'service_types.*' => 'required|in:maid,cook,babysitter,caregiver,cleaner,all_rounder',
            'locations' => 'required|array|min:1',
            'locations.*.city' => 'required|string|max:255',
            'locations.*.area' => 'required|string|max:255',
            'skills' => 'nullable|string',
            'experience_years' => 'required|integer|min:0',
            'availability' => 'required|in:full_time,part_time,available',
            'bio' => 'nullable|string',
            'is_active' => 'boolean',
        ])->validate();

        // Update user basic data
        $userData = [
            'name' => $validated['name'],
        ];
        if (isset($validated['phone'])) {
            $userData['phone'] = $validated['phone'];
        }
        $helper->update($userData);

        // Get or create profile
        $profile = $helper->profile;
        if (!$profile) {
            $profile = $helper->profile()->create([]);
        }

        // Update profile data
        $profileData = [
            'skills' => $validated['skills'] ?? null,
            'experience_years' => $validated['experience_years'],
            'availability' => $validated['availability'],
            'bio' => $validated['bio'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ];

        if ($request->hasFile('photo')) {
            // Delete old photo
            if ($profile->photo) {
                Storage::disk('public')->delete($profile->photo);
            }
            $profileData['photo'] = $request->file('photo')->store('helpers/photos', 'public');
        }

        $profile->update($profileData);

        // Update service listings - delete old ones and create new ones
        $profile->serviceListings()->delete();

        // Create service listing with all service types and locations
        $serviceListingData = [
            'profile_id' => $profile->id,
            'work_type' => $validated['availability'], // Map availability to work_type
            'service_types' => $validated['service_types'], // JSON array
            'locations' => array_map(function($location) {
                // Find or create location ID
                $locationModel = \App\Models\Location::firstOrCreate([
                    'city_id' => \App\Models\City::firstOrCreate(['name' => $location['city']])->id,
                    'area' => $location['area'],
                ]);
                return $locationModel->id;
            }, $validated['locations']), // JSON array of location IDs
            'description' => $validated['bio'],
            'is_active' => true,
            'status' => 'active',
        ];

        \App\Models\ServiceListing::create($serviceListingData);

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
