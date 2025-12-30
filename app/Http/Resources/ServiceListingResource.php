<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceListingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Get service types from relationship
        $serviceTypes = [];
        $firstServiceType = null;
        if ($this->relationLoaded('serviceTypes')) {
            $serviceTypes = $this->serviceTypes->pluck('slug')->toArray();
            $firstServiceType = $serviceTypes[0] ?? null;
        } else {
            // Fallback: load if not already loaded
            $serviceTypes = $this->serviceTypes()->pluck('slug')->toArray();
            $firstServiceType = $serviceTypes[0] ?? null;
        }
        
        // Get city from profile if available
        $city = null;
        $pinAddress = null;
        $pinLatitude = null;
        $pinLongitude = null;
        if ($this->relationLoaded('profile') && $this->profile) {
            $city = $this->profile->city ?? null;
            $pinAddress = $this->profile->pin_address ?? null;
            $pinLatitude = $this->profile->pin_latitude ?? null;
            $pinLongitude = $this->profile->pin_longitude ?? null;
        }
        
        return [
            'id' => $this->id,
            'profile_id' => $this->profile_id,
            'work_type' => $this->work_type,
            'monthly_rate' => $this->monthly_rate,
            'description' => $this->description,
            'pin_address' => $pinAddress,
            'address' => $pinAddress,
            'pin_latitude' => $pinLatitude,
            'pin_longitude' => $pinLongitude,
            'is_active' => $this->is_active,
            'status' => $this->status,
            'service_types' => $serviceTypes,
            'service_type' => $firstServiceType,
            'service_type_label' => $this->service_type_label,
            'city' => $city,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'user' => $this->when(
                $this->relationLoaded('profile') && $this->profile && $this->profile->relationLoaded('profileable') && $this->profile->profileable instanceof \App\Models\User,
                function () {
                    return new UserResource($this->profile->profileable);
                }
            ),
            'profile' => $this->whenLoaded('profile', function () {
                return $this->profile;
            }),
        ];
    }
}
