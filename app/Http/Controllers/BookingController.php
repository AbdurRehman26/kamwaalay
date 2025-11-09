<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Bookings", description: "Service request (booking) management endpoints")]
class BookingController extends Controller
{
    #[OA\Get(
        path: "/api/bookings/create",
        summary: "Get booking creation form",
        description: "Get form data for creating a service request with optional prefill data",
        tags: ["Bookings"],
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
            'user' => Auth::user()?->load('roles'),
        ]);
    }

    #[OA\Post(
        path: "/api/bookings",
        summary: "Create service request",
        description: "Create a new service request (booking). Only users and businesses can create requests, not helpers.",
        tags: ["Bookings"],
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
                description: "Service request created successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Booking request submitted successfully!"),
                        new OA\Property(property: "booking", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Helpers cannot create service requests"),
            new OA\Response(response: 422, description: "Validation error"),
        ]
    )]
    public function store(Request $request)
    {
        // Only users and businesses can create service requests, not helpers
        $user = Auth::user();
        if ($user->hasRole('helper')) {
            abort(403, 'Helpers cannot create service requests.');
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

        $booking = Booking::create($validated);

        // Send notifications (you can add email/notification logic here)

        return response()->json([
            'message' => 'Booking request submitted successfully!',
            'booking' => $booking->load(['user', 'assignedUser']),
        ]);
    }

    #[OA\Get(
        path: "/api/bookings/{booking}",
        summary: "Get booking details",
        description: "Get detailed information about a specific service request (public access)",
        tags: ["Bookings"],
        parameters: [
            new OA\Parameter(name: "booking", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Booking ID"),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Booking details",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "booking", type: "object", description: "Booking object with user, assignedUser, review, and jobApplications"),
                    ]
                )
            ),
            new OA\Response(response: 404, description: "Booking not found"),
        ]
    )]
    public function show(Booking $booking)
    {
        // Allow public viewing of service requests
        $booking->load(['user', 'assignedUser', 'review', 'jobApplications']);

        return response()->json([
            'booking' => $booking,
        ]);
    }

    #[OA\Get(
        path: "/api/bookings",
        summary: "List user's bookings",
        description: "Get paginated list of service requests created by the authenticated user",
        tags: ["Bookings"],
        security: [["sanctum" => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: "List of user's bookings",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "bookings", type: "object", description: "Paginated list of bookings"),
                    ]
                )
            ),
        ]
    )]
    public function index()
    {
        $bookings = Booking::with(['user', 'assignedUser'])
            ->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json([
            'bookings' => $bookings,
        ]);
    }

    #[OA\Get(
        path: "/api/service-requests",
        summary: "Browse available service requests",
        description: "Browse all available pending service requests (for helpers/businesses to apply)",
        tags: ["Bookings"],
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
                description: "List of available service requests",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "bookings", type: "object", description: "Paginated list of pending bookings"),
                        new OA\Property(property: "filters", type: "object", description: "Applied filters"),
                    ]
                )
            ),
        ]
    )]
    /**
     * Display all available service requests publicly (for helpers/businesses to browse)
     */
    public function browse(Request $request)
    {
        // Show only pending requests that haven't been assigned yet
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

        // Filter by work type
        if ($request->has('work_type') && $request->work_type) {
            $query->where('work_type', $request->work_type);
        }

        // If user is logged in and is a helper/business, exclude bookings they already applied to
        if (Auth::check()) {
            $user = Auth::user();
            if ($user->hasRole(['helper', 'business'])) {
                $query->whereDoesntHave('jobApplications', function ($q) {
                    $q->where('user_id', Auth::id());
                });
            }
        }

        $bookings = $query->orderBy('created_at', 'desc')->paginate(12);

        $filters = $request->only(['service_type', 'location_id', 'city_name', 'area', 'work_type']);
        if ($locationDisplay) {
            $filters['location_display'] = $locationDisplay;
        }

        return response()->json([
            'bookings' => $bookings,
            'filters' => $filters,
        ]);
    }

    #[OA\Patch(
        path: "/api/bookings/{booking}",
        summary: "Update booking",
        description: "Update booking status and notes. Only booking owner can update.",
        tags: ["Bookings"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "booking", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Booking ID"),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["status"],
                properties: [
                    new OA\Property(property: "status", type: "string", enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"]),
                    new OA\Property(property: "admin_notes", type: "string", nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Booking updated successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Booking updated successfully!"),
                        new OA\Property(property: "booking", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Can only update own bookings"),
            new OA\Response(response: 422, description: "Validation error"),
        ]
    )]
    public function update(Request $request, Booking $booking)
    {
        // Only booking owner can update
        if (Auth::id() !== $booking->user_id) {
            abort(403, 'You can only update your own bookings.');
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,confirmed,in_progress,completed,cancelled',
            'admin_notes' => 'nullable|string',
        ]);

        $booking->update($validated);

        return response()->json([
            'message' => 'Booking updated successfully!',
            'booking' => $booking->load(['user', 'helper']),
        ]);
    }

    #[OA\Delete(
        path: "/api/bookings/{booking}",
        summary: "Delete booking",
        description: "Delete (cancel) a service request. Only booking owner can delete.",
        tags: ["Bookings"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "booking", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Booking ID"),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Booking cancelled successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Booking cancelled successfully!"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Can only delete own bookings"),
            new OA\Response(response: 404, description: "Booking not found"),
        ]
    )]
    public function destroy(Booking $booking)
    {
        // Only booking owner can delete
        if (Auth::id() !== $booking->user_id) {
            abort(403, 'You can only delete your own bookings.');
        }

        $booking->delete();

        return response()->json([
            'message' => 'Booking cancelled successfully!',
        ]);
    }
}
