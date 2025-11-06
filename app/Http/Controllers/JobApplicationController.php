<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\JobApplication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class JobApplicationController extends Controller
{
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
