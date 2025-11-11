<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Get roles as array, loading if necessary
     */
    private function getRolesArray(): array
    {
        if (!$this->relationLoaded('roles')) {
            $this->load('roles');
        }
        return $this->roles->pluck('name')->toArray();
    }

    /**
     * Ensure profile is loaded if user is a helper/business
     */
    private function ensureProfileLoaded(): void
    {
        if ($this->hasRole(['helper', 'business']) && !$this->relationLoaded('profile')) {
            $this->load('profile');
        }
    }

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $this->ensureProfileLoaded();
        
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'address' => $this->address,
            'verified_at' => $this->verified_at?->toIso8601String(),
            'profile_updated_at' => $this->profile_updated_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'onboarding_complete' => $this->hasCompletedOnboarding(),
            'role' => $this->getRoleAttribute(),
            'roles' => $this->getRolesArray(),
            // Profile fields (from profile - works for both helpers and businesses)
            'photo' => $this->when($this->profile, $this->photo),
            'service_type' => $this->when($this->profile, $this->service_type),
            'skills' => $this->when($this->profile, $this->skills),
            'experience_years' => $this->when($this->profile, $this->experience_years),
            'city' => $this->when($this->profile, $this->city),
            'area' => $this->when($this->profile, $this->area),
            'availability' => $this->when($this->profile, $this->availability),
            'bio' => $this->when($this->profile, $this->bio),
            'verification_status' => $this->when($this->profile, $this->verification_status),
            'police_verified' => $this->when($this->profile, $this->police_verified),
            'is_active' => $this->when(isset($this->is_active), $this->is_active),
            'rating' => $this->when($this->profile, $this->rating),
            'total_reviews' => $this->when($this->profile, $this->total_reviews),
            'profile' => $this->when($this->profile, function () {
                return [
                    'id' => $this->profile->id,
                ];
            }),
            // Service listings (if loaded)
            'service_listings' => $this->when($this->relationLoaded('serviceListings'), function () {
                return $this->serviceListings->map(function ($listing) {
                    // Get service types from JSON column
                    $serviceTypes = $listing->service_types ?? [];
                    
                    // Get locations from JSON column (location IDs)
                    $locationIds = $listing->locations ?? [];
                    $locationDetails = [];
                    
                    // Fetch location details if location IDs exist
                    if (!empty($locationIds)) {
                        $locations = \App\Models\Location::whereIn('id', $locationIds)->with('city')->get();
                        $locationDetails = $locations->map(function ($location) {
                            return [
                                'id' => $location->id,
                                'city' => $location->city->name,
                                'area' => $location->area ?? '',
                            ];
                        })->toArray();
                    }
                    
                    return [
                        'id' => $listing->id,
                        'work_type' => $listing->work_type,
                        'description' => $listing->description,
                        'is_active' => $listing->is_active,
                        'status' => $listing->status,
                        'monthly_rate' => $listing->monthly_rate,
                        'service_types' => $serviceTypes,
                        'locations' => $locationDetails,
                    ];
                });
            }),
        ];
    }
}

