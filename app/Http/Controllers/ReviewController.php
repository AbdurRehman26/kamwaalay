<?php

namespace App\Http\Controllers;

use App\Models\JobPost;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use OpenApi\Attributes as OA;

#[OA\Tag(name: "Reviews", description: "Review management endpoints")]
class ReviewController extends Controller
{
    #[OA\Get(
        path: "/api/job-posts/{jobPost}/review/create",
        summary: "Get review creation form",
        description: "Get booking data for creating a review. Only booking owner can create reviews.",
        tags: ["Reviews"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "jobPost", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Job Post ID"),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Booking data for review",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "booking", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Can only review own bookings"),
        ]
    )]
    public function create(JobPost $jobPost)
    {
        if ($jobPost->user_id !== Auth::id()) {
            abort(403);
        }

        if ($jobPost->review) {
            return response()->json([
                'message' => 'Review already exists.',
                'review' => $jobPost->review->load(['jobPost.assignedUser', 'user']),
            ]);
        }

        return response()->json([
            'job_post' => $jobPost->load(['assignedUser', 'user']),
        ]);
    }

    #[OA\Post(
        path: "/api/job-posts/{jobPost}/review",
        summary: "Create review",
        description: "Create a review for a completed booking. Only booking owner can create reviews.",
        tags: ["Reviews"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "jobPost", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Job Post ID"),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["rating"],
                properties: [
                    new OA\Property(property: "rating", type: "integer", minimum: 1, maximum: 5, description: "Rating from 1 to 5"),
                    new OA\Property(property: "comment", type: "string", nullable: true, maxLength: 1000),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Review created successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Review submitted successfully!"),
                        new OA\Property(property: "review", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Can only review own bookings"),
            new OA\Response(response: 422, description: "Validation error or review already exists"),
        ]
    )]
    public function store(Request $request, JobPost $jobPost)
    {
        if ($jobPost->user_id !== Auth::id()) {
            abort(403);
        }

        if ($jobPost->review) {
            return response()->json([
                'message' => 'Review already exists.',
                'review' => $jobPost->review->load(['jobPost.assignedUser', 'user']),
            ]);
        }

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $validated['user_id'] = Auth::id();
        $validated['job_post_id'] = $jobPost->id;

        Review::create($validated);

        return response()->json([
            'message' => 'Review submitted successfully!',
            'review' => Review::where('job_post_id', $jobPost->id)
                ->where('user_id', Auth::id())
                ->first()
                ->load(['jobPost.assignedUser', 'user']),
        ]);
    }

    #[OA\Get(
        path: "/api/reviews/{review}/edit",
        summary: "Get review edit form",
        description: "Get review data for editing. Only review owner can edit.",
        tags: ["Reviews"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "review", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Review ID"),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Review data",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "review", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Can only edit own reviews"),
        ]
    )]
    public function edit(Review $review)
    {
        if ($review->user_id !== Auth::id()) {
            abort(403);
        }

        return response()->json([
            'review' => $review->load(['jobPost.assignedUser', 'user']),
        ]);
    }

    #[OA\Put(
        path: "/api/reviews/{review}",
        summary: "Update review",
        description: "Update a review. Only review owner can update.",
        tags: ["Reviews"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "review", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Review ID"),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["rating"],
                properties: [
                    new OA\Property(property: "rating", type: "integer", minimum: 1, maximum: 5),
                    new OA\Property(property: "comment", type: "string", nullable: true, maxLength: 1000),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: "Review updated successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Review updated successfully!"),
                        new OA\Property(property: "review", type: "object"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Can only update own reviews"),
            new OA\Response(response: 422, description: "Validation error"),
        ]
    )]
    public function update(Request $request, Review $review)
    {
        if ($review->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $review->update($validated);

        return response()->json([
            'message' => 'Review updated successfully!',
            'review' => $review->load(['jobPost.assignedUser', 'user']),
        ]);
    }

    #[OA\Delete(
        path: "/api/reviews/{review}",
        summary: "Delete review",
        description: "Delete a review. Only review owner can delete.",
        tags: ["Reviews"],
        security: [["sanctum" => []]],
        parameters: [
            new OA\Parameter(name: "review", in: "path", required: true, schema: new OA\Schema(type: "integer"), description: "Review ID"),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: "Review deleted successfully",
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: "message", type: "string", example: "Review deleted successfully!"),
                    ]
                )
            ),
            new OA\Response(response: 403, description: "Forbidden - Can only delete own reviews"),
        ]
    )]
    public function destroy(Review $review)
    {
        if ($review->user_id !== Auth::id()) {
            abort(403);
        }

        $jobPostId = $review->job_post_id;
        $review->delete();

        return response()->json([
            'message' => 'Review deleted successfully!',
        ]);
    }
}
