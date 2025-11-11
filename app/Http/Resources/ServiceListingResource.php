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
        // Get service types from JSON column
        $serviceTypes = $this->service_types ?? [];
        $firstServiceType = !empty($serviceTypes) ? $serviceTypes[0] : null;
        
        // Get locations from JSON column (location IDs)
        $locationIds = $this->locations ?? [];
        
        // Get first location details for display (if needed)
        $firstLocation = null;
        if (!empty($locationIds)) {
            $location = \App\Models\Location::find($locationIds[0]);
            if ($location) {
                $location->load('city');
                $firstLocation = [
                    'city' => $location->city->name,
                    'area' => $location->area ?? '',
                ];
            }
        }
        
        return [
            'id' => $this->id,
            'profile_id' => $this->profile_id,
            'work_type' => $this->work_type,
            'monthly_rate' => $this->monthly_rate,
            'description' => $this->description,
            'is_active' => $this->is_active,
            'status' => $this->status,
            'service_types' => $serviceTypes,
            'service_type' => $firstServiceType,
            'service_type_label' => $this->service_type_label,
            'locations' => $locationIds,
            'city' => $firstLocation ? $firstLocation['city'] : null,
            'area' => $firstLocation ? $firstLocation['area'] : null,
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

