<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
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
            'job_post_id' => $this->job_post_id,
            'booking_id' => $this->job_post_id, // Backward compatibility
            'user_id' => $this->user_id,
            'rating' => $this->rating,
            'comment' => $this->comment,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'user' => $this->whenLoaded('user', function () {
                return new UserResource($this->user);
            }),
            'job_post' => $this->whenLoaded('jobPost', function () {
                return new JobPostResource($this->jobPost);
            }),
            'booking' => $this->whenLoaded('jobPost', function () {
                return new JobPostResource($this->jobPost);
            }), // Backward compatibility
        ];
    }
}

