<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    use HasFactory;
    protected $fillable = [
        'booking_id',
        'user_id',
        'rating',
        'comment',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the helper user from the booking's assigned_user_id
     * This is a helper method, not a relationship
     */
    public function getHelperAttribute()
    {
        // Load booking if not already loaded
        if (!$this->relationLoaded('booking')) {
            $this->load('booking');
        }
        return $this->booking?->assignedUser;
    }

    protected static function booted(): void
    {
        static::created(function (Review $review) {
            // Load booking relationship first
            if (!$review->relationLoaded('booking')) {
                $review->load('booking');
            }
            $helper = $review->helper;
            if ($helper && $helper->profile) {
                $reviews = $helper->helperReviews()->get();
                $avgRating = $reviews->avg('rating');
                $totalReviews = $reviews->count();
                
                $helper->profile->update([
                    'rating' => round($avgRating, 2),
                    'total_reviews' => $totalReviews,
                ]);
            }
        });

        static::updated(function (Review $review) {
            // Load booking relationship first
            if (!$review->relationLoaded('booking')) {
                $review->load('booking');
            }
            $helper = $review->helper;
            if ($helper && $helper->profile) {
                $reviews = $helper->helperReviews()->get();
                $avgRating = $reviews->avg('rating');
                
                $helper->profile->update([
                    'rating' => round($avgRating, 2),
                ]);
            }
        });

        static::deleted(function (Review $review) {
            // Load booking relationship first
            if (!$review->relationLoaded('booking')) {
                $review->load('booking');
            }
            $helper = $review->helper;
            if ($helper && $helper->profile) {
                $reviews = $helper->helperReviews()->get();
                $avgRating = $reviews->count() > 0 ? $reviews->avg('rating') : 0;
                $totalReviews = $reviews->count();
                
                $helper->profile->update([
                    'rating' => round($avgRating, 2),
                    'total_reviews' => $totalReviews,
                ]);
            }
        });
    }
}
