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
        $showContactDetails = $this->shouldShowContactDetails($request);
        
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'assigned_user_id' => $this->assigned_user_id,
            'service_type' => $this->serviceType ? $this->serviceType->slug : $this->service_type,
            'service_type_label' => $this->service_type_label,
            'work_type' => $this->work_type,
            'estimated_salary' => $this->estimated_salary,
            'city_id' => $this->city_id,
            'city' => $this->cityRelation ? [
                'id' => $this->cityRelation->id,
                'name' => $this->cityRelation->name,
            ] : null,
            'city_name' => $this->cityRelation ? $this->cityRelation->name : null, // Backward compatibility
            'start_date' => $this->start_date?->format('Y-m-d'),
            'start_time' => $this->start_time?->toIso8601String(),
            'name' => $this->name,
            'phone' => $showContactDetails ? $this->phone : null,
            'email' => $showContactDetails ? $this->email : null,
            'address' => $showContactDetails ? $this->address : null,
            'address_privacy_note' => !$showContactDetails ? 'Address and contact details are hidden until your application is accepted.' : null,
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

    private function shouldShowContactDetails(Request $request): bool
    {
        $user = $request->user('sanctum') ?? \Illuminate\Support\Facades\Auth::user();

        if (!$user) {
            return false;
        }

        // Job owner can see details
        if ($this->user_id === $user->id) {
            return true;
        }

        // Assigned helper (if job is confirmed) can see details
        if ($this->status === 'confirmed' && $this->assigned_user_id === $user->id) {
            return true;
        }

        // Admins can see details
        if ($user->hasRole(['admin', 'super_admin'])) {
            return true;
        }

        return false;
    }
}

