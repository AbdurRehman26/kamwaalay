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
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'phone_verified_at' => $this->phone_verified_at?->toIso8601String(),
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
        ];
    }
}

