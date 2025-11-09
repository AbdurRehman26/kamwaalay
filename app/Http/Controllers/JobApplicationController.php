<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\JobApplication;
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
        // Only helpers can browse job applications
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

        $query = Booking::with(['user', 'jobApplications'])
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

        // Exclude bookings where helper already applied
        $query->whereDoesntHave('jobApplications', function ($q) {
            $q->where('user_id', Auth::id());
        });

        $bookings = $query->orderBy('created_at', 'desc')->paginate(12);

        $filters = $request->only(['service_type', 'location_id', 'city_name', 'area']);
        if ($locationDisplay) {
            $filters['location_display'] = $locationDisplay;
        }
        
        return response()->json([
            'bookings' => $bookings,
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
    public function create(Booking $booking)
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
        if (JobApplication::where('booking_id', $booking->id)
            ->where('user_id', Auth::id())
            ->exists()) {
            return response()->json([
                'message' => 'You have already applied to this service request.',
                'errors' => ['application' => ['You have already applied to this service request.']]
            ], 422);
        }

        $booking->load('user');

        return response()->json([
            'booking' => $booking->load('user'),
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
    public function store(Request $request, Booking $booking)
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
        if (JobApplication::where('booking_id', $booking->id)
            ->where('user_id', Auth::id())
            ->exists()) {
            return response()->json([
                'message' => 'You have already applied to this service request.',
                'errors' => ['application' => ['You have already applied to this service request.']]
            ], 422);
        }

        $validated = $request->validate([
            'message' => 'nullable|string|max:2000',
            'proposed_rate' => 'nullable|numeric|min:0',
        ]);

        $validated['booking_id'] = $booking->id;
        $validated['user_id'] = Auth::id();
        $validated['status'] = 'pending';
        $validated['applied_at'] = now();

        JobApplication::create($validated);

        return response()->json([
            'message' => 'Application submitted successfully!',
            'application' => JobApplication::where('booking_id', $booking->id)
                ->where('user_id', Auth::id())
                ->first()
                ->load(['booking.user', 'user']),
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
        // Only owner, booking owner, or admin can view
        $user = Auth::user();
        if (Auth::id() !== $jobApplication->user_id 
            && Auth::id() !== $jobApplication->booking->user_id 
            && !$user->hasRole(['admin', 'super_admin'])) {
            abort(403);
        }

        $jobApplication->load(['booking.user', 'user']);

        return response()->json([
            'application' => $jobApplication,
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

        $applications = JobApplication::with(['booking.user'])
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
        $applications = JobApplication::with(['user', 'booking'])
            ->whereHas('booking', function ($query) {
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
        // Only booking owner can accept
        if (Auth::id() !== $jobApplication->booking->user_id) {
            abort(403);
        }

        // Check if already accepted
        if ($jobApplication->status === 'accepted') {
            return response()->json([
                'message' => 'This application has already been accepted.',
                'errors' => ['application' => ['This application has already been accepted.']]
            ], 422);
        }

        // Reject other applications for the same booking
        JobApplication::where('booking_id', $jobApplication->booking_id)
            ->where('id', '!=', $jobApplication->id)
            ->update(['status' => 'rejected']);

        // Accept this application
        $jobApplication->update(['status' => 'accepted']);

        // Update booking with assigned helper
        $jobApplication->booking->update([
            'assigned_user_id' => $jobApplication->user_id,
            'status' => 'confirmed',
        ]);

        return response()->json([
            'message' => 'Application accepted! The helper has been assigned to your service request.',
            'application' => $jobApplication->load(['booking.user', 'user']),
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
        // Only booking owner can reject
        if (Auth::id() !== $jobApplication->booking->user_id) {
            abort(403);
        }

        $jobApplication->update(['status' => 'rejected']);

        return response()->json([
            'message' => 'Application rejected.',
            'application' => $jobApplication->load(['booking.user', 'user']),
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

        $jobApplication->update(['status' => 'withdrawn']);

        return response()->json([
            'message' => 'Application withdrawn.',
            'application' => $jobApplication->load(['booking.user', 'user']),
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
        // Only applicant, booking owner, or admin can delete
        $user = Auth::user();
        if (Auth::id() !== $jobApplication->user_id 
            && Auth::id() !== $jobApplication->booking->user_id 
            && !$user->hasRole(['admin', 'super_admin'])) {
            abort(403);
        }

        $jobApplication->delete();

        return response()->json([
            'message' => 'Application deleted successfully!',
        ]);
    }
}
