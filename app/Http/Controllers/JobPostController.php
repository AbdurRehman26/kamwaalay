<?php

namespace App\Http\Controllers;

use App\Http\Resources\JobPostResource;
use App\Http\Resources\UserResource;
use App\Models\JobPost;
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
        description: "Create a new job post. Only users and businesses can create posts, not helpers.",
        tags: ["JobPosts"],
        security: [["sanctum" => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["service_type", "work_type", "area", "name", "phone", "email"],
                properties: [
                    new OA\Property(property: "service_type", type: "string", enum: ["maid", "cook", "babysitter", "caregiver", "cleaner", "all_rounder"]),
                    new OA\Property(property: "work_type", type: "string", enum: ["full_time", "part_time"]),
                    new OA\Property(property: "area", type: "string", maxLength: 255),
                    new OA\Property(property: "start_date", type: "string", format: "date", nullable: true),
                    new OA\Property(property: "start_time", type: "string", format: "time", nullable: true, example: "09:00"),
                    new OA\Property(property: "name", type: "string", maxLength: 255),
                    new OA\Property(property: "phone", type: "string", maxLength: 20),
                    new OA\Property(property: "email", type: "string", format: "email", maxLength: 255),
                    new OA\Property(property: "address", type: "string", nullable: true),
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
                        new OA\Property(property: "job_post", type: "object"),
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
            'service_type' => 'required|in:maid,cook,babysitter,caregiver,cleaner,all_rounder',
            'work_type' => 'required|in:full_time,part_time',
            'area' => 'required|string|max:255',
            'start_date' => 'nullable|date',
            'start_time' => 'nullable|date_format:H:i',
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'required|email|max:255',
            'address' => 'nullable|string',
            'special_requirements' => 'nullable|string',
            'assigned_user_id' => 'nullable|exists:users,id',
        ]);

        // Always set city to Karachi
        $validated['city'] = 'Karachi';
        $validated['user_id'] = Auth::id();

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
                        new OA\Property(property: "job_post", type: "object", description: "Job post object with user, assignedUser, review, and jobApplications"),
                    ]
                )
            ),
            new OA\Response(response: 404, description: "Job post not found"),
        ]
    )]
    public function show(JobPost $jobPost)
    {
        // Allow public viewing of job posts
        $jobPost->load(['user', 'assignedUser', 'review', 'jobApplications']);

        return response()->json([
            'job_post' => new JobPostResource($jobPost),
        ]);
    }

    #[OA\Get(
        path: "/api/job-posts",
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
                        new OA\Property(property: "job_posts", type: "object", description: "Paginated list of job posts"),
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
        path: "/api/service-requests",
        summary: "Browse available job posts",
        description: "Browse all available pending job posts (for helpers/businesses to apply)",
        tags: ["JobPosts"],
        parameters: [
            new OA\Parameter(name: "service_type", in: "query", required: false, schema: new OA\Schema(type: "string", enum: ["maid", "cook", "babysitter", "caregiver", "cleaner", "all_rounder"])),
            new OA\Parameter(name: "location_id", in: "query", required: false, schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "city_name", in: "query", required: false, schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "area", in: "query", required: false, schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "work_type", in: "query", required: false, schema: new OA\Schema(type: "string", enum: ["full_time", "part_time"])),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of available job posts",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "job_posts", type: "object", description: "Paginated list of pending job posts"),
                        new OA\Property(property: "filters", type: "object", description: "Applied filters"),
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

        // Filter by location
        $locationDisplay = '';
        if ($request->has('location_id') && $request->location_id) {
            $location = \App\Models\Location::find($request->location_id);
            if ($location) {
                $location->load('city');
                $query->where('city', $location->city->name)
                      ->where('area', $location->area);
                $locationDisplay = $location->area 
                    ? $location->city->name . ', ' . $location->area 
                    : $location->city->name;
            }
        } elseif ($request->has('city_name') && $request->city_name) {
            $query->where('city', $request->city_name);
            $locationDisplay = $request->city_name;
        } elseif ($request->has('area') && $request->area) {
            $query->where('area', 'like', '%' . $request->area . '%');
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

        $filters = $request->only(['service_type', 'location_id', 'city_name', 'area', 'work_type']);
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
        description: "Update job post. Only job post owner can update.",
        tags: ["JobPosts"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "jobPost", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Job Post ID"),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "service_type", type: "string", enum: ["maid", "cook", "babysitter", "caregiver", "cleaner", "all_rounder"]),
                    new OA\Property(property: "work_type", type: "string", enum: ["full_time", "part_time"]),
                    new OA\Property(property: "area", type: "string", maxLength: 255),
                    new OA\Property(property: "start_date", type: "string", format: "date", nullable: true),
                    new OA\Property(property: "start_time", type: "string", format: "time", nullable: true),
                    new OA\Property(property: "name", type: "string", maxLength: 255),
                    new OA\Property(property: "phone", type: "string", maxLength: 20),
                    new OA\Property(property: "email", type: "string", format: "email", maxLength: 255),
                    new OA\Property(property: "address", type: "string", nullable: true),
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
                        new OA\Property(property: "job_post", type: "object"),
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
            'service_type' => 'sometimes|in:maid,cook,babysitter,caregiver,cleaner,all_rounder',
            'work_type' => 'sometimes|in:full_time,part_time',
            'area' => 'sometimes|string|max:255',
            'start_date' => 'nullable|date',
            'start_time' => 'nullable|date_format:H:i',
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:20',
            'email' => 'sometimes|email|max:255',
            'address' => 'nullable|string',
            'special_requirements' => 'nullable|string',
            'status' => 'sometimes|in:pending,confirmed,in_progress,completed,cancelled',
            'admin_notes' => 'nullable|string',
        ]);

        // Always set city to Karachi if updating location fields
        if (isset($validated['area'])) {
            $validated['city'] = 'Karachi';
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

