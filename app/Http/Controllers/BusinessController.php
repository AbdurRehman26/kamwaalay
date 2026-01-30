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

        // Filter by city name (from profile)
        $locationDisplay = '';
        if ($request->has('city_name') && $request->city_name) {
            $query->whereHas('profile', function ($q) use ($request) {
                $q->where('city', $request->city_name);
            });
            $locationDisplay = $request->city_name;
        }

        $businesses = $query->with(['roles', 'profile', 'serviceListings'])
            ->orderBy('created_at', 'desc')
            ->paginate(12);

        $filters = $request->only(['city_name']);
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
        $business = auth()->user();

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
                        new OA\Property(property: "service_types", type: "array", items: new OA\Items(type: "integer")),
                        new OA\Property(property: "locations", type: "array", items: new OA\Items(
                            type: "object",
                            properties: [
                                new OA\Property(property: "city", type: "string"),
                                new OA\Property(property: "area", type: "string"),
                            ]
                        )),
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
            'service_types.*' => 'required|exists:service_types,id',
            'pin_address' => 'required|string|max:500',
            'pin_latitude' => 'nullable|numeric',
            'pin_longitude' => 'nullable|numeric',
            'experience_years' => 'required|integer|min:0',
            'availability' => 'required|in:full_time,part_time,available',
            'bio' => 'nullable|string',
            'monthly_rate' => 'nullable|numeric|min:0',
            'age' => 'nullable|integer|min:18|max:100',
            'gender' => 'nullable|in:male,female,other',
            'religion' => 'nullable|string',
            'languages' => 'nullable|string', // JSON string of language IDs
        ]);

        // Create user account for the worker
        // Generate a unique email if not provided (using phone or timestamp)
        // Email generation logic removed as email column is dropped

        // Generate a random password if not provided
        $password = $request->input('password');
        if (!$password) {
            $password = \Str::random(16);
        }

        $userData = [
            'name' => $validated['name'],

            'phone' => isset($validated['phone']) ? $this->formatPhoneNumber($validated['phone']) : null,
            'password' => Hash::make($password),
            'is_active' => true,
        ];

        $helper = User::create($userData);
        $helper->assignRole('helper');

        // Try to extract city from pin_address or use default
        $pinAddress = $validated['pin_address'];
        $city = \App\Models\City::where('name', 'like', '%Karachi%')->first();
        $cityId = $city ? $city->id : 1; // Default to 1 if not found

        // Create profile for the worker (including pin location)
        $profileData = [
            'experience_years' => $validated['experience_years'],
            'city_id' => $cityId,
            'availability' => $validated['availability'],
            'bio' => $validated['bio'] ?? null,
            'age' => $validated['age'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'religion' => $validated['religion'] ?? null,
            'is_active' => true,
            'verification_status' => 'pending', // Default status
            'pin_address' => $validated['pin_address'],
            'pin_latitude' => $validated['pin_latitude'] ?? null,
            'pin_longitude' => $validated['pin_longitude'] ?? null,
        ];

        if ($request->hasFile('photo')) {
            $profileData['photo'] = $request->file('photo')->store('helpers/photos', 'public');
        }

        $profile = $helper->profile()->create($profileData);

        // Sync languages to profile_language table
        if (!empty($validated['languages'])) {
            $languageIds = json_decode($validated['languages'], true);
            if (is_array($languageIds) && count($languageIds) > 0) {
                $profile->languages()->sync($languageIds);
            }
        }

        $listing = \App\Models\ServiceListing::create([
            'user_id' => $helper->id,
            'profile_id' => $profile->id,
            'work_type' => $validated['availability'], // Map availability to work_type
            'description' => $validated['bio'],
            'city_id' => $cityId,
            'monthly_rate' => $validated['monthly_rate'] ?? null,
            'is_active' => true,
            'status' => 'active',
        ]);

        // Sync service types
        $listing->serviceTypes()->sync($validated['service_types']);

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

        // Load profile with languages and service listings with service types for the edit form
        // Using hasManyThrough relationship: user -> serviceListings (through profile) -> serviceTypes
        $helper->load([
            'roles',
            'profile.languages',
            'serviceListings.serviceTypes'
        ]);

        return response()->json([
            'helper' => new UserResource($helper),
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
                        new OA\Property(property: "service_types", type: "array", items: new OA\Items(type: "integer")),
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
            'service_types.*' => 'required|exists:service_types,id',
            'pin_address' => 'required|string|max:500',
            'pin_latitude' => 'nullable|numeric',
            'pin_longitude' => 'nullable|numeric',
            'experience_years' => 'required|integer|min:0',
            'availability' => 'required|in:full_time,part_time,available',
            'bio' => 'nullable|string',
            'monthly_rate' => 'nullable|numeric|min:0',
            'age' => 'nullable|integer|min:18|max:100',
            'gender' => 'nullable|in:male,female,other',
            'religion' => 'nullable|string',
            'languages' => 'nullable|string', // JSON string of language IDs
            'is_active' => 'boolean',
        ])->validate();

        // Update user basic data
        $userData = [
            'name' => $validated['name'],
        ];
        if (isset($validated['phone'])) {
            $userData['phone'] = $this->formatPhoneNumber($validated['phone']);
        }
        $helper->update($userData);

        // Get or create profile
        $profile = $helper->profile;
        if (!$profile) {
            $profile = $helper->profile()->create([]);
        }

        // Update profile data (including pin location)
        $profileData = [
            'experience_years' => $validated['experience_years'],
            'availability' => $validated['availability'],
            'bio' => $validated['bio'] ?? null,
            'age' => $validated['age'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'religion' => $validated['religion'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'pin_address' => $validated['pin_address'],
            'pin_latitude' => $validated['pin_latitude'] ?? null,
            'pin_longitude' => $validated['pin_longitude'] ?? null,
        ];

        if ($request->hasFile('photo')) {
            // Delete old photo
            if ($profile->photo) {
                Storage::disk('public')->delete($profile->photo);
            }
            $profileData['photo'] = $request->file('photo')->store('helpers/photos', 'public');
        }

        $profile->update($profileData);

        // Sync languages to profile_language table
        if (!empty($validated['languages'])) {
            $languageIds = json_decode($validated['languages'], true);
            if (is_array($languageIds)) {
                $profile->languages()->sync($languageIds);
            }
        } else {
            // Clear languages if empty
            $profile->languages()->detach();
        }

        // Update service listings - delete old ones and create new ones
        $profile->serviceListings()->delete();

        // Try to extract city or use default
        $city = \App\Models\City::where('name', 'like', '%Karachi%')->first();
        $cityId = $city ? $city->id : 1; // Default to 1 if not found

        $listing = \App\Models\ServiceListing::create([
            'user_id' => $helper->id,
            'profile_id' => $profile->id,
            'work_type' => $validated['availability'], // Map availability to work_type
            'description' => $validated['bio'],
            'city_id' => $cityId,
            'monthly_rate' => $validated['monthly_rate'] ?? null,
            'is_active' => true,
            'status' => 'active',
        ]);

        // Sync service types
        $listing->serviceTypes()->sync($validated['service_types']);

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

    /**
     * Format phone number to +92xxxxx format
     */
    private function formatPhoneNumber(string $phone): string
    {
        // Remove all non-numeric characters except +
        $phone = preg_replace('/[^0-9+]/', '', $phone);

        // Remove leading + if present (we'll add it back at the end)
        $phone = ltrim($phone, '+');

        // Handle different input formats
        if (strpos($phone, '0092') === 0) {
            // Format: 0092xxxxxxxxx -> +92xxxxxxxxx
            $phone = substr($phone, 2); // Remove 00, keep 92
        } elseif (strpos($phone, '92') === 0 && strlen($phone) >= 12) {
            // Format: 92xxxxxxxxx -> +92xxxxxxxxx (already has country code)
            // Keep as is
        } elseif (strpos($phone, '0') === 0 && strlen($phone) >= 10) {
            // Format: 03xxxxxxxxx -> +923xxxxxxxxx (local format starting with 0)
            $phone = '92' . substr($phone, 1); // Remove leading 0, add 92
        } elseif (strlen($phone) >= 10 && strlen($phone) <= 11) {
            // Format: 3xxxxxxxxx (10-11 digits without leading 0 or country code)
            // Assume it's a local number, add 92
            $phone = '92' . $phone;
        } elseif (strlen($phone) < 10) {
            // Too short, might be incomplete - still try to format
            if (strpos($phone, '92') !== 0) {
                $phone = '92' . $phone;
            }
        }

        // Ensure it starts with +
        if (strpos($phone, '+') !== 0) {
            $phone = '+' . $phone;
        }

        return $phone;
    }
}
