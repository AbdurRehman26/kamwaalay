<?php

namespace App\Http\Controllers;

use App\Models\ServiceListing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ServiceListingController extends Controller
{
    /**
     * Display a listing of the resource (only visible to helpers and guests)
     */
    public function index(Request $request)
    {
        // Only helpers and guests can view service listings
        // Users and businesses should not see this page
        if (Auth::check()) {
            $user = Auth::user();
            if ($user->hasRole(['user', 'business'])) {
                abort(403, 'Service listings are only available to helpers.');
            }
        }
        $query = ServiceListing::with(['user', 'serviceTypes', 'locations'])
            ->where('is_active', true)
            ->where('status', 'active');

        // Filter by service type (via pivot table)
        if ($request->has('service_type') && $request->service_type) {
            $query->whereHas('serviceTypes', function ($q) use ($request) {
                $q->where('service_type', $request->service_type);
            });
        }

        // Filter by location (via pivot table)
        $locationDisplay = '';
        if ($request->has('location_id') && $request->location_id) {
            $location = \App\Models\Location::find($request->location_id);
            if ($location) {
                $location->load('city');
                $query->whereHas('locations', function ($q) use ($location) {
                    $q->where('city', $location->city->name)
                      ->where('area', $location->area);
                });
                $locationDisplay = $location->area
                    ? $location->city->name . ', ' . $location->area
                    : $location->city->name;
            }
        } elseif ($request->has('city_name') && $request->city_name) {
            $query->whereHas('locations', function ($q) use ($request) {
                $q->where('city', $request->city_name);
            });
            $locationDisplay = $request->city_name;
        } elseif ($request->has('area') && $request->area) {
            $query->whereHas('locations', function ($q) use ($request) {
                $q->where('area', 'like', '%' . $request->area . '%');
            });
        }

        // Filter by work type
        if ($request->has('work_type') && $request->work_type) {
            $query->where('work_type', $request->work_type);
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        if ($sortBy === 'rate_low') {
            $query->orderBy('monthly_rate', 'asc');
        } elseif ($sortBy === 'rate_high') {
            $query->orderBy('monthly_rate', 'desc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $listings = $query->paginate(12);

        $filters = $request->only(['service_type', 'location_id', 'city_name', 'area', 'work_type', 'sort_by']);
        if ($locationDisplay) {
            $filters['location_display'] = $locationDisplay;
        }

        return response()->json([
            'listings' => $listings,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new resource
     */
    public function create()
    {
        // Only helpers and businesses can create service listings
        $user = Auth::user();
        if (!$user || !$user->hasRole(['helper', 'business'])) {
            abort(403, 'Only helpers and businesses can create service listings.');
        }

        // Check if onboarding is completed - if not, redirect to onboarding
        if (!$user->hasCompletedOnboarding()) {
            $redirectRoute = $user->hasRole('helper') ? 'onboarding.helper' : 'onboarding.business';
            return response()->json([
                'message' => 'Please complete your onboarding before creating service listings.',
                'redirect' => ['route' => $redirectRoute],
            ], 422);
        }

        return response()->json(['message' => 'Service listing creation form']);
    }

    /**
     * Store a newly created resource in storage
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        if (!$user || !$user->hasRole(['helper', 'business'])) {
            abort(403, 'Only helpers and businesses can create service listings.');
        }

        // Check if onboarding is completed - if not, redirect to onboarding
        if (!$user->hasCompletedOnboarding()) {
            $redirectRoute = $user->hasRole('helper') ? 'onboarding.helper' : 'onboarding.business';
            return response()->json([
                'message' => 'Please complete your onboarding before creating service listings.',
                'redirect' => ['route' => $redirectRoute],
            ], 422);
        }

        // Check if we're receiving listings array (new format) or single listing (old format)
        if ($request->has('listings') && is_array($request->listings)) {
            // New format: Create ONE listing with multiple service types and locations
            $validated = $request->validate([
                'listings' => 'required|array|min:1',
                'listings.*.service_type' => 'required|in:maid,cook,babysitter,caregiver,cleaner,all_rounder',
                'listings.*.work_type' => 'required|in:full_time,part_time',
                'listings.*.city' => 'required|string|max:255',
                'listings.*.area' => 'required|string|max:255',
                'listings.*.monthly_rate' => 'nullable|numeric|min:0',
                'listings.*.description' => 'nullable|string|max:2000',
            ]);

            // Get unique service types and locations from all listings
            $serviceTypes = array_unique(array_column($validated['listings'], 'service_type'));
            $locations = [];
            foreach ($validated['listings'] as $listing) {
                $locationKey = $listing['city'] . '|' . $listing['area'];
                if (!isset($locations[$locationKey])) {
                    $locations[$locationKey] = [
                        'city' => $listing['city'],
                        'area' => $listing['area'],
                    ];
                }
            }

            // Get common fields from first listing (they should all be the same)
            $firstListing = $validated['listings'][0];

            // Create ONE service listing
            $listing = ServiceListing::create([
                'user_id' => Auth::id(),
                'work_type' => $firstListing['work_type'],
                'monthly_rate' => $firstListing['monthly_rate'] ?? null,
                'description' => $firstListing['description'] ?? null,
                'status' => 'active',
                'is_active' => true,
            ]);

            // Attach service types
            foreach ($serviceTypes as $serviceType) {
                \App\Models\ServiceListingServiceType::create([
                    'service_listing_id' => $listing->id,
                    'service_type' => $serviceType,
                ]);
            }

            // Attach locations
            foreach ($locations as $location) {
                \App\Models\ServiceListingLocation::create([
                    'service_listing_id' => $listing->id,
                    'city' => $location['city'],
                    'area' => $location['area'],
                ]);
            }

            $message = 'Service listing created successfully with ' . count($serviceTypes) . ' service type(s) and ' . count($locations) . ' location(s)!';

            return response()->json([
                'message' => $message,
                'listing' => $listing->load(['serviceTypes', 'locations']),
            ]);
        } else {
            // Single listing (backward compatibility - will need to be updated)
            $validated = $request->validate([
                'service_type' => 'required|in:maid,cook,babysitter,caregiver,cleaner,all_rounder',
                'work_type' => 'required|in:full_time,part_time',
                'city' => 'required|string|max:255',
                'area' => 'required|string|max:255',
                'monthly_rate' => 'nullable|numeric|min:0',
                'description' => 'nullable|string|max:2000',
                'status' => 'nullable|in:active,paused,closed',
            ]);

            // Create ONE listing with single service type and location
            $listing = ServiceListing::create([
                'user_id' => Auth::id(),
                'work_type' => $validated['work_type'],
                'monthly_rate' => $validated['monthly_rate'] ?? null,
                'description' => $validated['description'] ?? null,
                'status' => $validated['status'] ?? 'active',
                'is_active' => true,
            ]);

            // Attach service type
            \App\Models\ServiceListingServiceType::create([
                'service_listing_id' => $listing->id,
                'service_type' => $validated['service_type'],
            ]);

            // Attach location
            \App\Models\ServiceListingLocation::create([
                'service_listing_id' => $listing->id,
                'city' => $validated['city'],
                'area' => $validated['area'],
            ]);

            return response()->json([
                'message' => 'Service listing created successfully!',
                'listing' => $listing->load(['serviceTypes', 'locations']),
            ]);
        }
    }

    /**
     * Display the specified resource (only visible to helpers and guests)
     */
    public function show(ServiceListing $serviceListing)
    {
        // Only helpers and guests can view service listings
        // Users and businesses should not see this page
        if (Auth::check()) {
            $user = Auth::user();
            if ($user->hasRole(['user', 'business'])) {
                abort(403, 'Service listings are only available to helpers.');
            }
        }

        $serviceListing->load(['user', 'serviceTypes', 'locations']);

        // Get other active service listings from the same user
        $otherListings = ServiceListing::with(['user', 'serviceTypes', 'locations'])
            ->where('user_id', $serviceListing->user_id)
            ->where('id', '!=', $serviceListing->id)
            ->where('is_active', true)
            ->where('status', 'active')
            ->limit(4)
            ->get();

        return response()->json([
            'listing' => $serviceListing,
            'other_listings' => $otherListings,
            'user' => Auth::user()?->load('roles'),
        ]);
    }

    /**
     * Show the form for editing the specified resource
     */
    public function edit(ServiceListing $serviceListing)
    {
                // Only owner or admin can edit
                $user = Auth::user();
                if (Auth::id() !== $serviceListing->user_id && !$user->hasRole(['admin', 'super_admin'])) {
                    abort(403);
                }

        $serviceListing->load(['user', 'serviceTypes', 'locations']);

        return response()->json([
            'listing' => $serviceListing,
        ]);
    }

    /**
     * Update the specified resource in storage
     */
    public function update(Request $request, ServiceListing $serviceListing)
    {
                // Only owner or admin can update
                $user = Auth::user();
                if (Auth::id() !== $serviceListing->user_id && !$user->hasRole(['admin', 'super_admin'])) {
                    abort(403);
                }

        $validated = $request->validate([
            'service_types' => 'required|array|min:1',
            'service_types.*' => 'required|in:maid,cook,babysitter,caregiver,cleaner,all_rounder',
            'locations' => 'required|array|min:1',
            'locations.*.city' => 'required|string|max:255',
            'locations.*.area' => 'required|string|max:255',
            'work_type' => 'required|in:full_time,part_time',
            'monthly_rate' => 'nullable|numeric|min:0',
            'description' => 'nullable|string|max:2000',
            'status' => 'required|in:active,paused,closed',
            'is_active' => 'boolean',
        ]);

        // Update main listing fields
        $serviceListing->update([
            'work_type' => $validated['work_type'],
            'monthly_rate' => $validated['monthly_rate'] ?? null,
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        // Update service types (delete old, create new)
        $serviceListing->serviceTypes()->delete();
        foreach ($validated['service_types'] as $serviceType) {
            \App\Models\ServiceListingServiceType::create([
                'service_listing_id' => $serviceListing->id,
                'service_type' => $serviceType,
            ]);
        }

        // Update locations (delete old, create new)
        $serviceListing->locations()->delete();
        foreach ($validated['locations'] as $location) {
            \App\Models\ServiceListingLocation::create([
                'service_listing_id' => $serviceListing->id,
                'city' => $location['city'],
                'area' => $location['area'],
            ]);
        }

        return response()->json([
            'message' => 'Service listing updated successfully!',
            'listing' => $serviceListing->load(['serviceTypes', 'locations']),
        ]);
    }

    /**
     * Remove the specified resource from storage
     */
    public function destroy(ServiceListing $serviceListing)
    {
                // Only owner or admin can delete
                $user = Auth::user();
                if (Auth::id() !== $serviceListing->user_id && !$user->hasRole(['admin', 'super_admin'])) {
                    abort(403);
                }

        $serviceListing->delete();

        return response()->json([
            'message' => 'Service listing deleted successfully!',
        ]);
    }

    /**
     * Show my service listings (for helpers/businesses)
     */
    public function myListings()
    {
        $user = Auth::user();
        if (!$user->hasRole(['helper', 'business'])) {
            abort(403);
        }

        $listings = ServiceListing::with(['serviceTypes', 'locations'])
            ->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->paginate(12);

        return response()->json([
            'listings' => $listings,
        ]);
    }
}
