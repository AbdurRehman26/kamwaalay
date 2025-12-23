<?php

namespace App\Http\Controllers;

use App\Http\Resources\JobPostResource;
use App\Http\Resources\UserResource;
use App\Models\JobPost;
use App\Models\ServiceType;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "JobPosts", description: "Job post management endpoints")]
class JobPostController extends Controller
{
    #[OA\Get(
        path: "/api/job-posts/create",
        summary: "Get job post creation form",
        description: "Get form data for creating a job post with optional prefill data",
        tags: ["JobPosts"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "service_type", in: "query", required: false, schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "work_type", in: "query", required: false, schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "city", in: "query", required: false, schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "area", in: "query", required: false, schema: new OA\Schema(type: "string")),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Form data with prefill",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "prefill", type: "object"),
                        new OA\Property(property: "user", type: "object", nullable: true),
                    ]
                )
            ),
        ]
    )]
    public function create(Request $request)
    {
        // Pre-fill data from query parameters (e.g., from service listing)
        $prefill = $request->only(['service_type', 'work_type', 'city', 'area']);
        
        return response()->json([
            'prefill' => $prefill,
            'user' => Auth::user() ? new UserResource(Auth::user()->load('roles')) : null,
        ]);
    }

    #[OA\Post(
        path: "/api/job-posts",
        summary: "Create job post",
        description: "Create a new job post. Only users and businesses can create posts, not helpers. The city field is automatically set to 'Karachi'.",
        tags: ["JobPosts"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["service_type", "work_type", "name", "phone"],
                properties: [
                    new OA\Property(property: "service_type", type: "string", enum: ["maid", "cook", "babysitter", "caregiver", "cleaner", "domestic_helper", "driver", "security_guard"]),
                    new OA\Property(property: "work_type", type: "string", enum: ["full_time", "part_time"]),
                    new OA\Property(property: "start_date", type: "string", format: "date", nullable: true),
                    new OA\Property(property: "start_time", type: "string", format: "time", nullable: true, example: "09:00"),
                    new OA\Property(property: "name", type: "string", maxLength: 255),
                    new OA\Property(property: "phone", type: "string", maxLength: 20),
                    new OA\Property(property: "email", type: "string", format: "email", maxLength: 255, nullable: true),
                    new OA\Property(property: "address", type: "string", nullable: true),
                    new OA\Property(property: "latitude", type: "number", format: "float", nullable: true),
                    new OA\Property(property: "longitude", type: "number", format: "float", nullable: true),
                    new OA\Property(property: "special_requirements", type: "string", nullable: true),
                    new OA\Property(property: "assigned_user_id", type: "integer", nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Job post created successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Job post submitted successfully!"),
                        new OA\Property(
                            property: "job_post",
                            type: "object",
                            description: "JobPostResource with user and assignedUser relations loaded",
                            properties: [
                                new OA\Property(property: "id", type: "integer"),
                                new OA\Property(property: "user_id", type: "integer"),
                                new OA\Property(property: "service_type", type: "string"),
                                new OA\Property(property: "work_type", type: "string"),
                                new OA\Property(property: "city", type: "string", example: "Karachi"),
                                new OA\Property(property: "latitude", type: "number", format: "float", nullable: true),
                                new OA\Property(property: "longitude", type: "number", format: "float", nullable: true),
                                new OA\Property(property: "status", type: "string", example: "pending"),
                                new OA\Property(property: "user", type: "object", nullable: true),
                                new OA\Property(property: "assigned_user", type: "object", nullable: true),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Helpers cannot create job posts"),
            new OA\Response(response: 422, description: "Validation error"),
        ]
    )]
    public function store(Request $request)
    {
        // Only users and businesses can create job posts, not helpers
        $user = Auth::user();
        if ($user->hasRole('helper')) {
            abort(403, 'Helpers cannot create job posts.');
        }

        $validated = $request->validate([
            'service_type' => 'required|in:maid,cook,babysitter,caregiver,cleaner,domestic_helper,driver,security_guard',
            'work_type' => 'required|in:full_time,part_time',
            'city_id' => 'required|exists:cities,id',
            'start_date' => 'nullable|date',
            'start_time' => 'nullable|date_format:H:i',
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'special_requirements' => 'nullable|string',
            'assigned_user_id' => 'nullable|exists:users,id',
            'estimated_salary' => 'nullable|numeric|min:0',
        ]);

        // Get city name from city model
        $city = \App\Models\City::find($validated['city_id']);
        $validated['city'] = $city ? $city->name : 'Karachi';
        $validated['user_id'] = Auth::id();

        // Map service_type string to ID
        $serviceType = ServiceType::where('slug', $validated['service_type'])->firstOrFail();
        $validated['service_type_id'] = $serviceType->id;
        unset($validated['service_type']);

        $jobPost = JobPost::create($validated);

        // Send notifications (you can add email/notification logic here)

        return response()->json([
            'message' => 'Job post submitted successfully!',
            'job_post' => new JobPostResource($jobPost->load(['user', 'assignedUser'])),
        ]);
    }

    #[OA\Get(
        path: "/api/job-posts/{jobPost}",
        summary: "Get job post details",
        description: "Get detailed information about a specific job post (public access)",
        tags: ["JobPosts"],
        parameters: [
            new OA\Parameter(name: "jobPost", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Job Post ID"),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Job post details",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: "job_post",
                            type: "object",
                            description: "JobPostResource with user, assignedUser, review, and jobApplications relations loaded",
                            properties: [
                                new OA\Property(property: "id", type: "integer"),
                                new OA\Property(property: "user_id", type: "integer"),
                                new OA\Property(property: "service_type", type: "string"),
                                new OA\Property(property: "work_type", type: "string"),
                                new OA\Property(property: "city", type: "string"),
                                new OA\Property(property: "area", type: "string"),
                                new OA\Property(property: "status", type: "string"),
                                new OA\Property(property: "user", type: "object", nullable: true),
                                new OA\Property(property: "assigned_user", type: "object", nullable: true),
                                new OA\Property(property: "review", type: "object", nullable: true),
                                new OA\Property(
                                    property: "job_applications",
                                    type: "array",
                                    nullable: true,
                                    description: "List of job applications with applicant details",
                                    items: new OA\Items(
                                        type: "object",
                                        properties: [
                                            new OA\Property(property: "id", type: "integer"),
                                            new OA\Property(property: "user_id", type: "integer"),
                                            new OA\Property(property: "message", type: "string", nullable: true),
                                            new OA\Property(property: "proposed_rate", type: "number", nullable: true),
                                            new OA\Property(property: "status", type: "string"),
                                            new OA\Property(property: "status_label", type: "string"),
                                            new OA\Property(property: "applied_at", type: "string", format: "date-time", nullable: true),
                                            new OA\Property(
                                                property: "user",
                                                type: "object",
                                                description: "Applicant user details including profile information",
                                                properties: [
                                                    new OA\Property(property: "id", type: "integer"),
                                                    new OA\Property(property: "name", type: "string"),
                                                    new OA\Property(property: "phone", type: "string", nullable: true),
                                                    new OA\Property(property: "photo", type: "string", nullable: true),
                                                    new OA\Property(property: "age", type: "integer", nullable: true),
                                                    new OA\Property(property: "gender", type: "string", nullable: true, enum: ["male", "female", "other"]),
                                                    new OA\Property(property: "religion", type: "string", nullable: true, enum: ["sunni_nazar_niyaz", "sunni_no_nazar_niyaz", "shia", "christian"]),
                                                    new OA\Property(property: "experience_years", type: "integer", nullable: true),
                                                    new OA\Property(property: "bio", type: "string", nullable: true),
                                                    new OA\Property(property: "city", type: "string", nullable: true),
                                                    new OA\Property(property: "area", type: "string", nullable: true),
                                                    new OA\Property(
                                                        property: "languages",
                                                        type: "array",
                                                        nullable: true,
                                                        items: new OA\Items(
                                                            type: "object",
                                                            properties: [
                                                                new OA\Property(property: "id", type: "integer"),
                                                                new OA\Property(property: "name", type: "string"),
                                                                new OA\Property(property: "code", type: "string"),
                                                            ]
                                                        )
                                                    ),
                                                ]
                                            ),
                                        ]
                                    )
                                ),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(response: 404, description: "Job post not found"),
        ]
    )]
    public function show(JobPost $jobPost)
    {
        // Allow public viewing of job posts
        // Load job applications with user profile details
        $jobPost->load([
            'user', 
            'assignedUser', 
            'review', 
            'jobApplications.user.profile.languages',
            'jobApplications.user.roles'
        ]);

        return response()->json([
            'job_post' => new JobPostResource($jobPost),
        ]);
    }

    #[OA\Get(
        path: "/api/my-job-posts",
        summary: "List user's job posts",
        description: "Get paginated list of job posts created by the authenticated user",
        tags: ["JobPosts"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of user's job posts",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: "job_posts",
                            type: "object",
                            description: "Paginated list of job posts",
                            properties: [
                                new OA\Property(property: "data", type: "array", items: new OA\Items(type: "object")),
                                new OA\Property(property: "current_page", type: "integer"),
                                new OA\Property(property: "per_page", type: "integer"),
                                new OA\Property(property: "total", type: "integer"),
                                new OA\Property(property: "last_page", type: "integer"),
                            ]
                        ),
                    ]
                )
            ),
        ]
    )]
    public function index()
    {
        $jobPosts = JobPost::with(['user', 'assignedUser'])
            ->withCount('jobApplications')
            ->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json([
            'job_posts' => JobPostResource::collection($jobPosts)->response()->getData(true),
        ]);
    }

    #[OA\Get(
        path: "/api/job-posts/browse",
        summary: "Browse available job posts",
        description: "Browse all available pending job posts (public access). Shows only pending posts that haven't been assigned yet. If user is authenticated and is a helper/business, excludes job posts they already applied to.",
        tags: ["JobPosts"],
        parameters: [
            new OA\Parameter(name: "service_type", in: "query", required: false, schema: new OA\Schema(type: "string", enum: ["maid", "cook", "babysitter", "caregiver", "cleaner", "domestic_helper", "driver", "security_guard"])),
            new OA\Parameter(name: "location_id", in: "query", required: false, schema: new OA\Schema(type: "integer"), description: "Location ID to filter by city and area"),
            new OA\Parameter(name: "city_name", in: "query", required: false, schema: new OA\Schema(type: "string"), description: "City name to filter by"),
            new OA\Parameter(name: "area", in: "query", required: false, schema: new OA\Schema(type: "string"), description: "Area name to filter by (partial match)"),
            new OA\Parameter(name: "work_type", in: "query", required: false, schema: new OA\Schema(type: "string", enum: ["full_time", "part_time"])),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of available job posts",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(
                            property: "job_posts",
                            type: "object",
                            description: "Paginated list of pending job posts",
                            properties: [
                                new OA\Property(property: "data", type: "array", items: new OA\Items(type: "object")),
                                new OA\Property(property: "current_page", type: "integer"),
                                new OA\Property(property: "per_page", type: "integer"),
                                new OA\Property(property: "total", type: "integer"),
                                new OA\Property(property: "last_page", type: "integer"),
                            ]
                        ),
                        new OA\Property(
                            property: "filters",
                            type: "object",
                            description: "Applied filters",
                            properties: [
                                new OA\Property(property: "service_type", type: "string", nullable: true),
                                new OA\Property(property: "location_id", type: "integer", nullable: true),
                                new OA\Property(property: "city_name", type: "string", nullable: true),
                                new OA\Property(property: "area", type: "string", nullable: true),
                                new OA\Property(property: "work_type", type: "string", nullable: true),
                                new OA\Property(property: "location_display", type: "string", nullable: true),
                            ]
                        ),
                    ]
                )
            ),
        ]
    )]
    /**
     * Display all available job posts publicly (for helpers/businesses to browse)
     */
    public function browse(Request $request)
    {
        // Show only pending posts that haven't been assigned yet
        $query = JobPost::with(['user', 'jobApplications'])
            ->where('status', 'pending')
            ->whereNull('assigned_user_id');

        // Filter by service type
        if ($request->has('service_type') && $request->service_type) {
            $query->where('service_type', $request->service_type);
        }

        // Filter by city name
        $locationDisplay = '';
        if ($request->has('city_name') && $request->city_name) {
            $query->whereHas('city', function ($q) use ($request) {
                $q->where('name', $request->city_name);
            });
            $locationDisplay = $request->city_name;
        }

        // Filter by work type
        if ($request->has('work_type') && $request->work_type) {
            $query->where('work_type', $request->work_type);
        }

        // If user is logged in and is a helper/business, exclude job posts they already applied to
        if (Auth::check()) {
            $user = Auth::user();
            if ($user->hasRole(['helper', 'business'])) {
                $query->whereDoesntHave('jobApplications', function ($q) {
                    $q->where('user_id', Auth::id());
                });
            }
        }

        $jobPosts = $query->orderBy('created_at', 'desc')->paginate(12);

        $filters = $request->only(['service_type', 'city_name', 'work_type']);
        if ($locationDisplay) {
            $filters['location_display'] = $locationDisplay;
        }

        return response()->json([
            'job_posts' => JobPostResource::collection($jobPosts)->response()->getData(true),
            'filters' => $filters,
        ]);
    }

    #[OA\Patch(
        path: "/api/job-posts/{jobPost}",
        summary: "Update job post",
        description: "Update job post. Only job post owner can update. All fields are optional (use 'sometimes' validation). If area is updated, city is automatically set to 'Karachi'.",
        tags: ["JobPosts"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "jobPost", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Job Post ID"),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "service_type", type: "string", enum: ["maid", "cook", "babysitter", "caregiver", "cleaner", "domestic_helper", "driver", "security_guard"]),
                    new OA\Property(property: "work_type", type: "string", enum: ["full_time", "part_time"]),
                    new OA\Property(property: "area", type: "string", maxLength: 255),
                    new OA\Property(property: "start_date", type: "string", format: "date", nullable: true),
                    new OA\Property(property: "start_time", type: "string", format: "time", nullable: true),
                    new OA\Property(property: "name", type: "string", maxLength: 255),
                    new OA\Property(property: "phone", type: "string", maxLength: 20),
                    new OA\Property(property: "email", type: "string", format: "email", maxLength: 255, nullable: true),
                    new OA\Property(property: "address", type: "string", nullable: true),
                    new OA\Property(property: "latitude", type: "number", format: "float", nullable: true),
                    new OA\Property(property: "longitude", type: "number", format: "float", nullable: true),
                    new OA\Property(property: "special_requirements", type: "string", nullable: true),
                    new OA\Property(property: "status", type: "string", enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"]),
                    new OA\Property(property: "admin_notes", type: "string", nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Job post updated successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Job post updated successfully!"),
                        new OA\Property(
                            property: "job_post",
                            type: "object",
                            description: "JobPostResource with user and assignedUser relations loaded",
                            properties: [
                                new OA\Property(property: "id", type: "integer"),
                                new OA\Property(property: "user_id", type: "integer"),
                                new OA\Property(property: "service_type", type: "string"),
                                new OA\Property(property: "work_type", type: "string"),
                                new OA\Property(property: "city", type: "string"),
                                new OA\Property(property: "area", type: "string"),
                                new OA\Property(property: "latitude", type: "number", format: "float", nullable: true),
                                new OA\Property(property: "longitude", type: "number", format: "float", nullable: true),
                                new OA\Property(property: "status", type: "string"),
                                new OA\Property(property: "user", type: "object", nullable: true),
                                new OA\Property(property: "assigned_user", type: "object", nullable: true),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Can only update own job posts"),
            new OA\Response(response: 422, description: "Validation error"),
        ]
    )]
    public function update(Request $request, JobPost $jobPost)
    {
        // Only job post owner can update
        if (Auth::id() !== $jobPost->user_id) {
            abort(403, 'You can only update your own job posts.');
        }

        // Allow updating all job post fields if provided, otherwise just status/admin_notes
        $validated = $request->validate([
            'service_type' => 'sometimes|in:maid,cook,babysitter,caregiver,cleaner,domestic_helper,driver,security_guard',
            'work_type' => 'sometimes|in:full_time,part_time',
            'start_date' => 'nullable|date',
            'start_time' => 'nullable|date_format:H:i',
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'special_requirements' => 'nullable|string',
            'status' => 'sometimes|in:pending,confirmed,in_progress,completed,cancelled',
            'admin_notes' => 'nullable|string',
            'estimated_salary' => 'nullable|numeric|min:0',
        ]);

        if (isset($validated['service_type'])) {
            $serviceType = ServiceType::where('slug', $validated['service_type'])->firstOrFail();
            $validated['service_type_id'] = $serviceType->id;
            unset($validated['service_type']);
        }

        $jobPost->update($validated);

        return response()->json([
            'message' => 'Job post updated successfully!',
            'job_post' => new JobPostResource($jobPost->load(['user', 'assignedUser'])),
        ]);
    }

    #[OA\Delete(
        path: "/api/job-posts/{jobPost}",
        summary: "Delete job post",
        description: "Delete (cancel) a job post. Only job post owner can delete.",
        tags: ["JobPosts"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "jobPost", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Job Post ID"),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Job post cancelled successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Job post cancelled successfully!"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Can only delete own job posts"),
            new OA\Response(response: 404, description: "Job post not found"),
        ]
    )]
    public function destroy(JobPost $jobPost)
    {
        // Only job post owner can delete
        if (Auth::id() !== $jobPost->user_id) {
            abort(403, 'You can only delete your own job posts.');
        }

        $jobPost->delete();

        return response()->json([
            'message' => 'Job post cancelled successfully!',
        ]);
    }
}

