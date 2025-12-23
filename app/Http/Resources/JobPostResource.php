<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JobPostResource extends JsonResource
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
            'assigned_user_id' => $this->assigned_user_id,
            'service_type' => $this->serviceType ? $this->serviceType->slug : $this->service_type,
            'service_type_label' => $this->service_type_label,
            'work_type' => $this->work_type,
            'estimated_salary' => $this->estimated_salary,
            'city' => $this->cityRelation ? $this->cityRelation->name : null,
            'start_date' => $this->start_date?->format('Y-m-d'),
            'start_time' => $this->start_time?->toIso8601String(),
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'address_privacy_note' => 'Your address will not be displayed to helpers unless you accept their application',
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'special_requirements' => $this->special_requirements,
            'status' => $this->status,
            'status_label' => $this->status_label,
            'admin_notes' => $this->admin_notes,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'user' => $this->whenLoaded('user', function () {
                return new UserResource($this->user);
            }),
            'assigned_user' => $this->whenLoaded('assignedUser', function () {
                return new UserResource($this->assignedUser);
            }),
            'review' => $this->whenLoaded('review', function () {
                return new ReviewResource($this->review);
            }),
            'job_applications' => $this->whenLoaded('jobApplications', function () {
                return JobApplicationResource::collection($this->jobApplications);
            }),
            'job_applications_count' => $this->job_applications_count ?? 0,
            'has_applied' => $this->has_applied ?? false,
            'application_id' => $this->application_id ?? null,
        ];
    }
}

