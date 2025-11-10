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
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
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
            // Helper-specific fields
            'photo' => $this->when(isset($this->photo), $this->photo),
            'service_type' => $this->when(isset($this->service_type), $this->service_type),
            'skills' => $this->when(isset($this->skills), $this->skills),
            'experience_years' => $this->when(isset($this->experience_years), $this->experience_years),
            'city' => $this->when(isset($this->city), $this->city),
            'area' => $this->when(isset($this->area), $this->area),
            'availability' => $this->when(isset($this->availability), $this->availability),
            'monthly_rate' => $this->when(isset($this->monthly_rate), $this->monthly_rate),
            'bio' => $this->when(isset($this->bio), $this->bio),
            'verification_status' => $this->when(isset($this->verification_status), $this->verification_status),
            'police_verified' => $this->when(isset($this->police_verified), $this->police_verified),
            'is_active' => $this->when(isset($this->is_active), $this->is_active),
            'rating' => $this->when(isset($this->rating), $this->rating),
            'total_reviews' => $this->when(isset($this->total_reviews), $this->total_reviews),
        ];
    }
}

