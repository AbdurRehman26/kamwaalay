<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Booking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;

class BusinessController extends Controller
{
    public function __construct()
    {
        // Dashboard and worker management routes require auth
        $this->middleware('auth')->except(['index', 'show']);
    }

    /**
     * Display a listing of businesses (public)
     */
    public function index(Request $request)
    {
        $query = User::role('business')
            ->where('is_active', true);

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

        $businesses = $query->with('serviceListings')
            ->orderBy('created_at', 'desc')
            ->paginate(12);

        $filters = $request->only(['location_id', 'city_name', 'area']);
        if ($locationDisplay) {
            $filters['location_display'] = $locationDisplay;
        }

        return response()->json([
            'businesses' => $businesses,
            'filters' => $filters,
        ]);
    }

    /**
     * Display the specified business profile (public)
     */
    public function show(User $business)
    {
        if (!$business->hasRole('business')) {
            abort(404);
        }

        $business->load([
            'serviceListings' => function ($query) {
                $query->where('is_active', true)->where('status', 'active');
            },
            'helpers' => function ($query) {
                $query->where('is_active', true)
                      ->where('verification_status', 'verified')
                      ->with('serviceListings')
                      ->limit(10);
            }
        ]);

        return response()->json([
            'business' => $business,
        ]);
    }

    public function dashboard()
    {
        $business = Auth::user();
        
        if (!$business->isBusiness()) {
            abort(403);
        }

        $stats = [
            'total_workers' => $business->helpers()->count(),
            'active_workers' => $business->helpers()->where('is_active', true)->count(),
            'pending_verification' => $business->helpers()->where('verification_status', 'pending')->count(),
            'verified_workers' => $business->helpers()->where('verification_status', 'verified')->count(),
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

    public function createWorker()
    {
        $business = Auth::user();
        
        if (!$business->isBusiness()) {
            abort(403);
        }

        return response()->json(['message' => 'Worker creation form']);
    }

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
            'helper' => $helper->load('roles'),
        ]);
    }

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

        // Update user data
        $helperData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
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
            if ($helper->photo) {
                Storage::disk('public')->delete($helper->photo);
            }
            $helperData['photo'] = $request->file('photo')->store('helpers/photos', 'public');
        }

        $helper->update($helperData);

        return response()->json([
            'message' => 'Worker updated successfully!',
            'worker' => $helper->load('roles'),
        ]);
    }

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
