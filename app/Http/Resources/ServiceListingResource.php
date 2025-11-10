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
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'work_type' => $this->work_type,
            'monthly_rate' => $this->monthly_rate,
            'description' => $this->description,
            'is_active' => $this->is_active,
            'status' => $this->status,
            'service_type' => $this->whenLoaded('serviceTypes', function () {
                return $this->serviceTypes->pluck('service_type');
            }),
            'service_type_label' => $this->service_type_label,
            'city' => $this->city,
            'area' => $this->area,
            'locations' => $this->whenLoaded('locations', function () {
                return $this->locations->map(function ($location) {
                    return [
                        'id' => $location->id,
                        'city' => $location->city,
                        'area' => $location->area,
                    ];
                });
            }),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'user' => $this->whenLoaded('user', function () {
                return new UserResource($this->user);
            }),
        ];
    }
}

