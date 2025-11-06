<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BookingController extends Controller
{
    public function create(Request $request)
    {
        // Pre-fill data from query parameters (e.g., from service listing)
        $prefill = $request->only(['service_type', 'work_type', 'city', 'area']);
        
        return response()->json([
            'prefill' => $prefill,
            'user' => Auth::user()?->load('roles'),
        ]);
    }

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

    public function show(Booking $booking)
    {
        // Allow public viewing of service requests
        $booking->load(['user', 'assignedUser', 'review', 'jobApplications']);

        return response()->json([
            'booking' => $booking,
        ]);
    }

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
