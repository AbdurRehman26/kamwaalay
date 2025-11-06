<?php

namespace App\Http\Controllers;

use App\Models\ServiceListing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OnboardingController extends Controller
{
    /**
     * Show helper onboarding
     */
    public function helper(): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user->hasRole('helper')) {
            abort(403);
        }

        return response()->json([
            'user' => $user->load('roles'),
        ]);
    }

    /**
     * Complete helper onboarding
     */
    public function completeHelper(Request $request)
    {
        $user = Auth::user();
        
        if (!$user->hasRole('helper')) {
            abort(403);
        }

        $validated = $request->validate([
            'services' => 'required|array|min:1',
            'services.*.service_type' => 'required|in:maid,cook,babysitter,caregiver,cleaner,all_rounder',
            'services.*.work_type' => 'required|in:full_time,part_time',
            'services.*.location_id' => 'required',
            'services.*.monthly_rate' => 'nullable|numeric|min:0',
            'services.*.description' => 'nullable|string|max:2000',
            // Profile verification fields
            'nic' => 'required|file|mimes:jpeg,jpg,png,pdf|max:5120',
            'nic_number' => 'required|string|max:255',
            // Optional helper profile fields
            'photo' => 'nullable|image|max:2048',
            'skills' => 'nullable|string',
            'experience_years' => 'nullable|integer|min:0',
            'bio' => 'nullable|string',
        ]);

        // Update user profile if provided
        $userData = [];
        if ($request->has('photo')) {
            $userData['photo'] = $request->file('photo')->store('helpers/photos', 'public');
        }
        if ($request->has('skills')) {
            $userData['skills'] = $validated['skills'];
        }
        if ($request->has('experience_years')) {
            $userData['experience_years'] = $validated['experience_years'];
        }
        if ($request->has('bio')) {
            $userData['bio'] = $validated['bio'];
        }
        if (!empty($userData)) {
            $user->update($userData);
        }

        // Store NIC document
        if ($request->hasFile('nic')) {
            $nicPath = $request->file('nic')->store('documents/nic', 'public');
            \App\Models\Document::create([
                'user_id' => $user->id,
                'document_type' => 'nic',
                'document_number' => $validated['nic_number'],
                'file_path' => $nicPath,
                'status' => 'pending',
            ]);
        }

        // Group services by common fields (work_type, monthly_rate, description)
        $groupedServices = [];
        foreach ($validated['services'] as $serviceData) {
            $location = \App\Models\Location::find($serviceData['location_id']);
            if (!$location) {
                continue;
            }

            $location->load('city');
            
            $key = md5(serialize([
                $serviceData['work_type'] ?? 'full_time',
                $serviceData['monthly_rate'] ?? null,
                $serviceData['description'] ?? null,
            ]));
            
            if (!isset($groupedServices[$key])) {
                $groupedServices[$key] = [
                    'common' => [
                        'user_id' => $user->id,
                        'work_type' => $serviceData['work_type'] ?? 'full_time',
                        'monthly_rate' => $serviceData['monthly_rate'] ?? null,
                        'description' => $serviceData['description'] ?? null,
                        'is_active' => true,
                        'status' => 'active',
                    ],
                    'service_types' => [],
                    'locations' => [],
                ];
            }
            
            // Add service type
            if (!in_array($serviceData['service_type'], $groupedServices[$key]['service_types'])) {
                $groupedServices[$key]['service_types'][] = $serviceData['service_type'];
            }
            
            // Add location
            $locationKey = $location->city->name . '|' . ($location->area ?? '');
            if (!isset($groupedServices[$key]['locations'][$locationKey])) {
                $groupedServices[$key]['locations'][$locationKey] = [
                    'city' => $location->city->name,
                    'area' => $location->area ?? '',
                ];
            }
        }
        
        // Create service listings for each group
        foreach ($groupedServices as $group) {
            $listing = ServiceListing::create($group['common']);
            
            // Attach service types
            foreach ($group['service_types'] as $serviceType) {
                \App\Models\ServiceListingServiceType::create([
                    'service_listing_id' => $listing->id,
                    'service_type' => $serviceType,
                ]);
            }
            
            // Attach locations
            foreach ($group['locations'] as $location) {
                \App\Models\ServiceListingLocation::create([
                    'service_listing_id' => $listing->id,
                    'city' => $location['city'],
                    'area' => $location['area'],
                ]);
            }
        }

        return response()->json([
            'message' => 'Welcome! Your profile has been set up successfully.',
            'user' => $user->load('roles'),
        ]);
    }

    /**
     * Show business onboarding
     */
    public function business(): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user->hasRole('business')) {
            abort(403);
        }

        return response()->json([
            'user' => $user->load('roles'),
        ]);
    }

    /**
     * Complete business onboarding
     */
    public function completeBusiness(Request $request)
    {
        $user = Auth::user();
        
        if (!$user->hasRole('business')) {
            abort(403);
        }

        $validated = $request->validate([
            'services' => 'required|array|min:1',
            'services.*.service_type' => 'required|in:maid,cook,babysitter,caregiver,cleaner,all_rounder',
            'services.*.work_type' => 'required|in:full_time,part_time',
            'services.*.location_id' => 'required',
            'services.*.monthly_rate' => 'nullable|numeric|min:0',
            'services.*.description' => 'nullable|string|max:2000',
            // Profile verification fields
            'nic' => 'required|file|mimes:jpeg,jpg,png,pdf|max:5120',
            'nic_number' => 'required|string|max:255',
            // Optional business profile fields
            'bio' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'area' => 'nullable|string|max:255',
        ]);

        // Update user profile if provided
        $userData = [];
        if ($request->has('bio')) {
            $userData['bio'] = $validated['bio'];
        }
        if ($request->has('city')) {
            $userData['city'] = $validated['city'];
        }
        if ($request->has('area')) {
            $userData['area'] = $validated['area'];
        }
        if (!empty($userData)) {
            $user->update($userData);
        }

        // Store NIC document
        if ($request->hasFile('nic')) {
            $nicPath = $request->file('nic')->store('documents/nic', 'public');
            \App\Models\Document::create([
                'user_id' => $user->id,
                'document_type' => 'nic',
                'document_number' => $validated['nic_number'],
                'file_path' => $nicPath,
                'status' => 'pending',
            ]);
        }

        // Group services by common fields (work_type, monthly_rate, description)
        $groupedServices = [];
        foreach ($validated['services'] as $serviceData) {
            $location = \App\Models\Location::find($serviceData['location_id']);
            if (!$location) {
                continue;
            }

            $location->load('city');
            
            $key = md5(serialize([
                $serviceData['work_type'] ?? 'full_time',
                $serviceData['monthly_rate'] ?? null,
                $serviceData['description'] ?? null,
            ]));
            
            if (!isset($groupedServices[$key])) {
                $groupedServices[$key] = [
                    'common' => [
                        'user_id' => $user->id,
                        'work_type' => $serviceData['work_type'] ?? 'full_time',
                        'monthly_rate' => $serviceData['monthly_rate'] ?? null,
                        'description' => $serviceData['description'] ?? null,
                        'is_active' => true,
                        'status' => 'active',
                    ],
                    'service_types' => [],
                    'locations' => [],
                ];
            }
            
            // Add service type
            if (!in_array($serviceData['service_type'], $groupedServices[$key]['service_types'])) {
                $groupedServices[$key]['service_types'][] = $serviceData['service_type'];
            }
            
            // Add location
            $locationKey = $location->city->name . '|' . ($location->area ?? '');
            if (!isset($groupedServices[$key]['locations'][$locationKey])) {
                $groupedServices[$key]['locations'][$locationKey] = [
                    'city' => $location->city->name,
                    'area' => $location->area ?? '',
                ];
            }
        }
        
        // Create service listings for each group
        foreach ($groupedServices as $group) {
            $listing = ServiceListing::create($group['common']);
            
            // Attach service types
            foreach ($group['service_types'] as $serviceType) {
                \App\Models\ServiceListingServiceType::create([
                    'service_listing_id' => $listing->id,
                    'service_type' => $serviceType,
                ]);
            }
            
            // Attach locations
            foreach ($group['locations'] as $location) {
                \App\Models\ServiceListingLocation::create([
                    'service_listing_id' => $listing->id,
                    'city' => $location['city'],
                    'area' => $location['area'],
                ]);
            }
        }

        return response()->json([
            'message' => 'Welcome! Your business profile has been set up successfully.',
            'user' => $user->load('roles'),
        ]);
    }
}
