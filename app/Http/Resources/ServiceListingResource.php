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
        
        // Get locations from relationship
        $locationIds = [];
        $locationDetails = [];
        $firstLocation = null;
        
        if ($this->relationLoaded('locations')) {
            $locations = $this->locations;
            $locationIds = $locations->pluck('id')->toArray();
            
            $locationDetails = $locations->map(function ($location) {
                return [
                    'id' => $location->id,
                    'city_name' => $location->city->name ?? '',
                    'area' => $location->area ?? '',
                    'display_text' => $location->area 
                        ? ($location->city->name ?? '') . ', ' . $location->area 
                        : ($location->city->name ?? ''),
                ];
            })->toArray();
            
            // Get first location for backward compatibility
            if (!empty($locationDetails)) {
                $firstLocation = $locationDetails[0];
            }
        } else {
            // Fallback: load if not already loaded
            $locations = $this->locations()->with('city')->get();
            $locationIds = $locations->pluck('id')->toArray();
            
            $locationDetails = $locations->map(function ($location) {
                return [
                    'id' => $location->id,
                    'city_name' => $location->city->name ?? '',
                    'area' => $location->area ?? '',
                    'display_text' => $location->area 
                        ? ($location->city->name ?? '') . ', ' . $location->area 
                        : ($location->city->name ?? ''),
                ];
            })->toArray();
            
            // Get first location for backward compatibility
            if (!empty($locationDetails)) {
                $firstLocation = $locationDetails[0];
            }
        }
        
        return [
            'id' => $this->id,
            'profile_id' => $this->profile_id,
            'work_type' => $this->work_type,
            'monthly_rate' => $this->monthly_rate,
            'description' => $this->description,
            'pin_address' => $this->pin_address,
            'pin_latitude' => $this->pin_latitude,
            'pin_longitude' => $this->pin_longitude,
            'is_active' => $this->is_active,
            'status' => $this->status,
            'service_types' => $serviceTypes,
            'service_type' => $firstServiceType,
            'service_type_label' => $this->service_type_label,
            'locations' => $locationIds, // Keep IDs for backward compatibility
            'location_details' => $locationDetails, // Full location data array
            'city' => $firstLocation ? $firstLocation['city_name'] : null,
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

