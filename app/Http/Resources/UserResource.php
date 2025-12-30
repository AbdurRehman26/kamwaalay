<?php

namespace App\Http\Resources;


use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;

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
            $this->load('profile.languages');
        } elseif ($this->profile && !$this->profile->relationLoaded('languages')) {
            $this->profile->load('languages');
        }
    }

    /**
     * Safely convert date to ISO8601 string
     * Handles both Carbon instances and strings
     */
    private function toIso8601String($date): ?string
    {
        if ($date === null) {
            return null;
        }

        if (is_string($date)) {
            try {
                return Carbon::parse($date)->toIso8601String();
            } catch (\Exception $e) {
                return $date; // Return as-is if parsing fails
            }
        }

        if ($date instanceof \Carbon\Carbon || $date instanceof \DateTime) {
            return $date->toIso8601String();
        }

        return null;
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
            'verified_at' => $this->toIso8601String($this->verified_at),
            'profile_updated_at' => $this->toIso8601String($this->profile_updated_at),
            'created_at' => $this->toIso8601String($this->created_at),
            'updated_at' => $this->toIso8601String($this->updated_at),
            'onboarding_complete' => $this->hasCompletedOnboarding(),
            'role' => $this->getRoleAttribute(),
            'roles' => $this->getRolesArray(),
            // Profile fields (from profile - works for both helpers and businesses)
            'photo' => $this->when($this->profile, $this->profile?->photo),
            'service_type' => $this->when($this->profile, $this->profile?->service_type),
            'experience_years' => $this->when($this->profile, $this->profile?->experience_years),
            'age' => $this->when($this->profile, $this->profile?->age),
            'gender' => $this->when($this->profile, $this->profile?->gender ? (string) $this->profile->gender : null),
            'religion' => $this->when($this->profile, $this->profile?->religion ? [
                'value' => $this->profile->religion instanceof \App\Enums\Religion ? $this->profile->religion->value : $this->profile->religion,
                'label' => $this->profile->religion instanceof \App\Enums\Religion ? $this->profile->religion->label() : str_replace('_', ' ', $this->profile->religion),
            ] : null),
            'city_id' => $this->when($this->profile, $this->profile?->city_id),
            'city' => $this->when($this->profile, $this->profile?->city),
            'availability' => $this->when($this->profile, $this->profile?->availability),
            'bio' => $this->when($this->profile, $this->profile?->bio),
            'languages' => $this->when($this->profile && $this->profile->relationLoaded('languages'), function () {
                return $this->profile->languages->map(function ($language) {
                    return [
                        'id' => $language->id,
                        'name' => $language->name,
                        'code' => $language->code,
                    ];
                });
            }),
            'verification_status' => $this->when($this->profile, $this->profile?->verification_status),
            'police_verified' => $this->when($this->profile, $this->profile?->police_verified),
            'is_active' => $this->when(isset($this->is_active), $this->is_active),
            'rating' => $this->when($this->profile, $this->profile?->rating),
            'total_reviews' => $this->when($this->profile, $this->profile?->total_reviews),
            'profile' => $this->when($this->profile, function () {
                return [
                    'id' => $this->profile->id,
                    'pin_address' => $this->profile->pin_address,
                    'pin_latitude' => $this->profile->pin_latitude,
                    'pin_longitude' => $this->profile->pin_longitude,
                ];
            }),
            // Service listings (if loaded) - use ServiceListingResource for consistency
            'service_listings' => $this->when($this->relationLoaded('serviceListings'), function () {
                return $this->serviceListings->map(function ($listing) {
                    return (new ServiceListingResource($listing))->toArray(request());
                });
            }),
            // Helper reviews (if loaded)
            'helper_reviews' => $this->when($this->relationLoaded('helperReviews'), function () {
                return $this->helperReviews->map(function ($review) {
                    return [
                        'id' => $review->id,
                        'rating' => $review->rating,
                        'comment' => $review->comment,
                        'created_at' => $this->toIso8601String($review->created_at),
                        'user' => $review->relationLoaded('user') ? [
                            'id' => $review->user->id,
                            'name' => $review->user->name,
                        ] : null,
                    ];
                });
            }),
            // Business info for agency workers
            'business' => $this->when($this->relationLoaded('businesses') && $this->businesses->isNotEmpty(), function () {
                $business = $this->businesses->first();
                return [
                    'id' => $business->id,
                    'name' => $business->name,
                ];
            }),
            // Helpers (workers) list for businesses
            'helpers' => $this->when($this->relationLoaded('helpers'), function () {
                return $this->helpers->map(function ($helper) {
                    return (new UserResource($helper))->toArray(request());
                });
            }),
        ];
    }
}

