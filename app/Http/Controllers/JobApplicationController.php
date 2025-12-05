<?php

namespace App\Http\Controllers;

use App\Models\JobPost;
use App\Models\JobApplication;
use App\Notifications\JobApplicationReceived;
use App\Notifications\JobApplicationStatusChanged;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Job Applications", description: "Job application management endpoints")]
class JobApplicationController extends Controller
{
    #[OA\Get(
        path: "/api/job-applications",
        summary: "Browse available service requests",
        description: "Browse available service requests for helpers/businesses to apply. Requires completed onboarding.",
        tags: ["Job Applications"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "service_type", in: "query", required: false, schema: new OA\Schema(type: "string", enum: ["maid", "cook", "babysitter", "caregiver", "cleaner", "all_rounder"])),
            new OA\Parameter(name: "location_id", in: "query", required: false, schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "city_name", in: "query", required: false, schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "area", in: "query", required: false, schema: new OA\Schema(type: "string")),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of available service requests",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "bookings", type: "object", description: "Paginated list of pending bookings"),
                        new OA\Property(property: "filters", type: "object", description: "Applied filters"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Only helpers and businesses can browse"),
            new OA\Response(response: 422, description: "Onboarding not completed"),
        ]
    )]
    /**
     * Display a listing of available service requests (for helpers to browse)
     */
    public function index(Request $request)
    {
        // Allow guests and all users to browse job applications
        // Only authenticated helpers/businesses with completed onboarding can apply

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

        // Show all job posts, even if user has already applied
        // This allows users to view their applications and see all available opportunities

        $jobPosts = $query->orderBy('created_at', 'desc')->paginate(12);

        // Get user's applications for the job posts to check if they've applied and get application IDs
        // Only check if user is authenticated
        $userApplications = [];
        if (Auth::check()) {
            $userApplications = \App\Models\JobApplication::where('user_id', Auth::id())
                ->whereIn('job_post_id', $jobPosts->pluck('id'))
                ->get()
                ->keyBy('job_post_id');
        }

        // Transform the paginated results to include has_applied flag and application_id
        $jobPosts->getCollection()->transform(function ($jobPost) use ($userApplications) {
            $application = !empty($userApplications) ? $userApplications->get($jobPost->id) : null;
            $jobPost->has_applied = $application !== null;
            $jobPost->application_id = $application ? $application->id : null;
            return $jobPost;
        });

        $filters = $request->only(['service_type', 'location_id', 'city_name', 'area']);
        if ($locationDisplay) {
            $filters['location_display'] = $locationDisplay;
        }

        return response()->json([
            'job_posts' => $jobPosts,
            'filters' => $filters,
        ]);
    }

    #[OA\Get(
        path: "/api/bookings/{booking}/apply",
        summary: "Get job application form",
        description: "Get booking data for creating a job application. Requires helper/business role and completed onboarding.",
        tags: ["Job Applications"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "booking", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Booking ID"),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Booking data for application",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "booking", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Only helpers and businesses can apply"),
            new OA\Response(response: 422, description: "Onboarding not completed or already applied"),
        ]
    )]
    /**
     * Show the form for creating a new application
     */
    public function create(JobPost $jobPost)
    {
        // Only helpers can apply
        $user = Auth::user();
        if (!$user->hasRole(['helper', 'business'])) {
            abort(403);
        }

        // Check if onboarding is completed
        if (!$user->hasCompletedOnboarding()) {
            $redirectRoute = $user->hasRole('helper') ? 'onboarding.helper' : 'onboarding.business';
            return response()->json([
                'message' => 'Please complete your onboarding before applying for services.',
                'redirect' => ['route' => $redirectRoute],
            ], 422);
        }

        // Check if already applied
        if (JobApplication::where('job_post_id', $jobPost->id)
            ->where('user_id', Auth::id())
            ->exists()) {
            return response()->json([
                'message' => 'You have already applied to this job post.',
                'errors' => ['application' => ['You have already applied to this job post.']]
            ], 422);
        }

        $jobPost->load('user.profile');

        return response()->json([
            'job_post' => $jobPost,
        ]);
    }

    #[OA\Post(
        path: "/api/bookings/{booking}/apply",
        summary: "Submit job application",
        description: "Submit a job application for a service request. Requires helper/business role and completed onboarding.",
        tags: ["Job Applications"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "booking", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Booking ID"),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "message", type: "string", nullable: true, maxLength: 2000, description: "Application message"),
                    new OA\Property(property: "proposed_rate", type: "number", nullable: true, minimum: 0, description: "Proposed rate"),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Application submitted successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Application submitted successfully!"),
                        new OA\Property(property: "application", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Only helpers and businesses can apply"),
            new OA\Response(response: 422, description: "Validation error, onboarding not completed, or already applied"),
        ]
    )]
    /**
     * Store a newly created application
     */
    public function store(Request $request, JobPost $jobPost)
    {
        // Only helpers can apply
        $user = Auth::user();
        if (!$user->hasRole(['helper', 'business'])) {
            abort(403);
        }

        // Check if onboarding is completed
        if (!$user->hasCompletedOnboarding()) {
            $redirectRoute = $user->hasRole('helper') ? 'onboarding.helper' : 'onboarding.business';
            return response()->json([
                'message' => 'Please complete your onboarding before applying for services.',
                'redirect' => ['route' => $redirectRoute],
            ], 422);
        }

        // Check if already applied
        if (JobApplication::where('job_post_id', $jobPost->id)
            ->where('user_id', Auth::id())
            ->exists()) {
            return response()->json([
                'message' => 'You have already applied to this job post.',
                'errors' => ['application' => ['You have already applied to this job post.']]
            ], 422);
        }

        $validated = $request->validate([
            'message' => 'nullable|string|max:2000',
            'proposed_rate' => 'nullable|numeric|min:0',
        ]);

        $validated['job_post_id'] = $jobPost->id;
        $validated['user_id'] = Auth::id();
        $validated['status'] = 'pending';
        $validated['applied_at'] = now();

        $application = JobApplication::create($validated);
        $application->load(['jobPost.user', 'user']);

        // Refresh job post to ensure it's up to date
        $jobPost->refresh();
        $jobPost->load('user');

        // Notify job post owner about new application
        $jobPost->user->notify(new JobApplicationReceived($application));

        return response()->json([
            'message' => 'Application submitted successfully!',
            'application' => $application,
        ]);
    }

    #[OA\Get(
        path: "/api/job-applications/{jobApplication}",
        summary: "Get job application details",
        description: "Get detailed information about a job application. Only owner, booking owner, or admin can view.",
        tags: ["Job Applications"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "jobApplication", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Job application ID"),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Job application details",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "application", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Can only view own applications or related bookings"),
        ]
    )]
    /**
     * Display the specified application
     */
    public function show(JobApplication $jobApplication)
    {
        // Only owner, job post owner, or admin can view
        $user = Auth::user();
        if (Auth::id() !== $jobApplication->user_id
            && Auth::id() !== $jobApplication->jobPost->user_id
            && !$user->hasRole(['admin', 'super_admin'])) {
            abort(403);
        }

        $jobApplication->load(['jobPost.user', 'user']);

        return response()->json([
            'application' => new \App\Http\Resources\JobApplicationResource($jobApplication),
        ]);
    }

    #[OA\Get(
        path: "/api/my-applications",
        summary: "Get my job applications",
        description: "Get paginated list of job applications submitted by the authenticated helper/business",
        tags: ["Job Applications"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of user's job applications",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "applications", type: "object", description: "Paginated list of applications"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Only helpers and businesses can view their applications"),
        ]
    )]
    /**
     * Show my applications (for helpers)
     */
    public function myApplications()
    {
        $user = Auth::user();
        if (!$user->hasRole(['helper', 'business'])) {
            abort(403);
        }

        $applications = JobApplication::with(['jobPost.user'])
            ->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->paginate(12);

        return response()->json([
            'applications' => $applications,
        ]);
    }

    #[OA\Get(
        path: "/api/my-request-applications",
        summary: "Get applications for my service requests",
        description: "Get paginated list of job applications received for the authenticated user's service requests",
        tags: ["Job Applications"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of applications for user's service requests",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "applications", type: "object", description: "Paginated list of applications"),
                    ]
                )
            ),
        ]
    )]
    /**
     * Show applications for my service requests (for users)
     */
    public function myRequestApplications()
    {
        $applications = JobApplication::with(['user', 'jobPost.user'])
            ->whereHas('jobPost', function ($query) {
                $query->where('user_id', Auth::id());
            })
            ->orderBy('created_at', 'desc')
            ->paginate(12);

        return response()->json([
            'applications' => $applications,
        ]);
    }

    #[OA\Post(
        path: "/api/job-applications/{jobApplication}/accept",
        summary: "Accept job application",
        description: "Accept a job application and assign the helper to the service request. Only booking owner can accept.",
        tags: ["Job Applications"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "jobApplication", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Job application ID"),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Application accepted successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Application accepted! The helper has been assigned to your service request."),
                        new OA\Property(property: "application", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Only booking owner can accept"),
            new OA\Response(response: 422, description: "Application already accepted"),
        ]
    )]
    /**
     * Accept an application (for users)
     */
    public function accept(JobApplication $jobApplication)
    {
        // Only job post owner can accept
        if (Auth::id() !== $jobApplication->jobPost->user_id) {
            abort(403);
        }

        // Check if already accepted
        if ($jobApplication->status === 'accepted') {
            return response()->json([
                'message' => 'This application has already been accepted.',
                'errors' => ['application' => ['This application has already been accepted.']]
            ], 422);
        }

        $oldStatus = $jobApplication->status;

        // Reject other applications for the same job post
        $otherApplications = JobApplication::where('job_post_id', $jobApplication->job_post_id)
            ->where('id', '!=', $jobApplication->id)
            ->where('status', '!=', 'rejected')
            ->with(['jobPost', 'user'])
            ->get();

        foreach ($otherApplications as $otherApp) {
            $otherOldStatus = $otherApp->status;
            $otherApp->update(['status' => 'rejected']);
            $otherApp->refresh();
            $otherApp->load(['jobPost', 'user']);
            // Notify helper about rejection
            $otherApp->user->notify(new JobApplicationStatusChanged($otherApp, $otherOldStatus, 'rejected'));
        }

        // Accept this application
        $jobApplication->update(['status' => 'accepted']);
        $jobApplication->refresh();
        $jobApplication->load(['jobPost', 'user']);

        // Notify helper about acceptance
        $jobApplication->user->notify(new JobApplicationStatusChanged($jobApplication, $oldStatus, 'accepted'));

        // Update job post with assigned helper
        $jobApplication->jobPost->update([
            'assigned_user_id' => $jobApplication->user_id,
            'status' => 'confirmed',
        ]);

        return response()->json([
            'message' => 'Application accepted! The helper has been assigned to your job post.',
            'application' => $jobApplication->load(['jobPost.user', 'user']),
        ]);
    }

    #[OA\Post(
        path: "/api/job-applications/{jobApplication}/reject",
        summary: "Reject job application",
        description: "Reject a job application. Only booking owner can reject.",
        tags: ["Job Applications"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "jobApplication", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Job application ID"),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Application rejected",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Application rejected."),
                        new OA\Property(property: "application", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Only booking owner can reject"),
        ]
    )]
    /**
     * Reject an application (for users)
     */
    public function reject(JobApplication $jobApplication)
    {
        // Only job post owner can reject
        if (Auth::id() !== $jobApplication->jobPost->user_id) {
            abort(403);
        }

        $oldStatus = $jobApplication->status;
        $jobApplication->update(['status' => 'rejected']);
        $jobApplication->refresh();
        $jobApplication->load(['jobPost', 'user']);

        // Notify helper about rejection
        $jobApplication->user->notify(new JobApplicationStatusChanged($jobApplication, $oldStatus, 'rejected'));

        return response()->json([
            'message' => 'Application rejected.',
            'application' => $jobApplication->load(['jobPost.user', 'user']),
        ]);
    }

    #[OA\Post(
        path: "/api/job-applications/{jobApplication}/withdraw",
        summary: "Withdraw job application",
        description: "Withdraw a job application. Only applicant can withdraw.",
        tags: ["Job Applications"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "jobApplication", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Job application ID"),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Application withdrawn",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Application withdrawn."),
                        new OA\Property(property: "application", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Only applicant can withdraw"),
        ]
    )]
    /**
     * Withdraw an application (for helpers)
     */
    public function withdraw(JobApplication $jobApplication)
    {
        // Only applicant can withdraw
        if (Auth::id() !== $jobApplication->user_id) {
            abort(403);
        }

        $oldStatus = $jobApplication->status;
        $jobApplication->update(['status' => 'withdrawn']);
        $jobApplication->refresh();
        $jobApplication->load(['jobPost.user', 'user']);

        // Notify job post owner about withdrawal
        $jobApplication->jobPost->user->notify(new JobApplicationStatusChanged($jobApplication, $oldStatus, 'withdrawn'));

        return response()->json([
            'message' => 'Application withdrawn.',
            'application' => $jobApplication->load(['jobPost.user', 'user']),
        ]);
    }

    #[OA\Delete(
        path: "/api/job-applications/{jobApplication}",
        summary: "Delete job application",
        description: "Delete a job application. Only applicant, booking owner, or admin can delete.",
        tags: ["Job Applications"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "jobApplication", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Job application ID"),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Application deleted successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Application deleted successfully!"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Can only delete own applications or related bookings"),
        ]
    )]
    /**
     * Remove the specified resource from storage
     */
    public function destroy(JobApplication $jobApplication)
    {
        // Only applicant, job post owner, or admin can delete
        $user = Auth::user();
        if (Auth::id() !== $jobApplication->user_id
            && Auth::id() !== $jobApplication->jobPost->user_id
            && !$user->hasRole(['admin', 'super_admin'])) {
            abort(403);
        }

        $jobApplication->delete();

        return response()->json([
            'message' => 'Application deleted successfully!',
        ]);
    }
}
