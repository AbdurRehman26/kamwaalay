<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\City;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class HelperController extends Controller
{
    public function index(Request $request)
    {
        // Filter by user type: 'all', 'helper', or 'business'
        $userType = $request->get('user_type', 'all');
        
        // Base query for helpers and businesses
        $query = User::where(function ($q) use ($userType) {
            if ($userType === 'helper') {
                // Show only helpers
                $q->role('helper')
                  ->where('verification_status', 'verified')
                  ->where('is_active', true);
            } elseif ($userType === 'business') {
                // Show only businesses
                $q->role('business')
                  ->where('is_active', true);
            } else {
                // Show both helpers and businesses (default)
                $q->where(function ($subQ) {
                    $subQ->role('helper')
                         ->where('verification_status', 'verified')
                         ->where('is_active', true);
                })->orWhere(function ($subQ) {
                    $subQ->role('business')
                         ->where('is_active', true);
                });
            }
        });

                // Filter by service type
                if ($request->has('service_type') && $request->service_type) {
                    $query->byServiceType($request->service_type);
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
            // If city name provided, filter by city
            $query->where('city', $request->city_name);
            $locationDisplay = $request->city_name;
        } elseif ($request->has('area') && $request->area) {
            // If area provided, filter by area in any city
            $query->where('area', 'like', '%' . $request->area . '%');
        }

        // Filter by experience
        if ($request->has('min_experience')) {
            $query->where('experience_years', '>=', $request->min_experience);
        }

        // Sort by rating or experience
        $sortBy = $request->get('sort_by', 'rating');
        if ($sortBy === 'experience') {
            $query->orderBy('experience_years', 'desc');
        } else {
            $query->orderBy('rating', 'desc');
        }

        $helpers = $query->paginate(12);

        $filters = $request->only(['service_type', 'location_id', 'city_name', 'area', 'min_experience', 'sort_by', 'user_type']);
        if ($locationDisplay) {
            $filters['location_display'] = $locationDisplay;
        }
        
        return response()->json([
            'helpers' => $helpers,
            'filters' => $filters,
        ]);
    }

    public function show(User $helper)
    {
        if (!$helper->hasRole('helper')) {
            abort(404);
        }

        $helper->load(['helperReviews.user', 'documents', 'serviceListings' => function ($query) {
            $query->where('is_active', true)
                  ->where('status', 'active')
                  ->with(['serviceTypes', 'locations']);
        }]);

        return response()->json([
            'helper' => $helper,
        ]);
    }

    public function create(): JsonResponse
    {
        return response()->json(['message' => 'Helper creation form']);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'photo' => 'nullable|image|max:2048',
            'service_type' => 'required|in:maid,cook,babysitter,caregiver,cleaner,all_rounder',
            'skills' => 'nullable|string',
            'experience_years' => 'required|integer|min:0',
            'city' => 'required|string|max:255',
            'area' => 'required|string|max:255',
            'availability' => 'required|in:full_time,part_time,available',
            'monthly_rate' => 'nullable|numeric|min:0',
            'bio' => 'nullable|string',
        ]);

        $user = Auth::user();

        if (!$user->hasRole('helper')) {
            abort(403);
        }

        if ($request->hasFile('photo')) {
            $validated['photo'] = $request->file('photo')->store('helpers/photos', 'public');
        }

        $user->update($validated);

        return response()->json([
            'message' => 'Helper profile created successfully!',
            'helper' => $user->load('roles'),
        ]);
    }

    public function edit(User $helper)
    {
        if (!$helper->hasRole('helper')) {
            abort(404);
        }

        // Only allow editing own profile (unless admin)
        if (Auth::id() !== $helper->id && !Auth::user()->isAdmin()) {
            abort(403);
        }

        return response()->json([
            'helper' => $helper->load('roles'),
        ]);
    }

    public function update(Request $request, User $helper)
    {
        if (!$helper->hasRole('helper')) {
            abort(404);
        }

        // Only allow editing own profile (unless admin)
        if (Auth::id() !== $helper->id && !Auth::user()->isAdmin()) {
            abort(403);
        }

        $validated = $request->validate([
            'photo' => 'nullable|image|max:2048',
            'service_type' => 'required|in:maid,cook,babysitter,caregiver,cleaner,all_rounder',
            'skills' => 'nullable|string',
            'experience_years' => 'required|integer|min:0',
            'city' => 'required|string|max:255',
            'area' => 'required|string|max:255',
            'availability' => 'required|in:full_time,part_time,available',
            'monthly_rate' => 'nullable|numeric|min:0',
            'bio' => 'nullable|string',
        ]);

        if ($request->hasFile('photo')) {
            // Delete old photo
            if ($helper->photo) {
                Storage::disk('public')->delete($helper->photo);
            }
            $validated['photo'] = $request->file('photo')->store('helpers/photos', 'public');
        }

        $helper->update($validated);

        return response()->json([
            'message' => 'Helper profile updated successfully!',
            'helper' => $helper->load('roles'),
        ]);
    }
}
