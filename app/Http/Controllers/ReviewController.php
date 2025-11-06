<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    public function create(Booking $booking)
    {
        if ($booking->user_id !== Auth::id()) {
            abort(403);
        }

        if ($booking->review) {
            return response()->json([
                'message' => 'Review already exists.',
                'review' => $booking->review->load(['booking.assignedUser', 'user']),
            ]);
        }

        return response()->json([
            'booking' => $booking->load(['assignedUser', 'user']),
        ]);
    }

    public function store(Request $request, Booking $booking)
    {
        if ($booking->user_id !== Auth::id()) {
            abort(403);
        }

        if ($booking->review) {
            return response()->json([
                'message' => 'Review already exists.',
                'review' => $booking->review->load(['booking.assignedUser', 'user']),
            ]);
        }

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $validated['user_id'] = Auth::id();
        $validated['booking_id'] = $booking->id;

        Review::create($validated);

        return response()->json([
            'message' => 'Review submitted successfully!',
            'review' => Review::where('booking_id', $booking->id)
                ->where('user_id', Auth::id())
                ->first()
                ->load(['booking.assignedUser', 'user']),
        ]);
    }

    public function edit(Review $review)
    {
        if ($review->user_id !== Auth::id()) {
            abort(403);
        }

        return response()->json([
            'review' => $review->load(['booking.assignedUser', 'user']),
        ]);
    }

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
            'review' => $review->load(['booking.assignedUser', 'user']),
        ]);
    }

    public function destroy(Review $review)
    {
        if ($review->user_id !== Auth::id()) {
            abort(403);
        }

        $bookingId = $review->booking_id;
        $review->delete();

        return response()->json([
            'message' => 'Review deleted successfully!',
        ]);
    }
}
