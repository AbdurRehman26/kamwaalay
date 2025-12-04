<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobApplication extends Model
{
    use HasFactory;
    protected $fillable = [
        'job_post_id',
        'user_id',
        'message',
        'proposed_rate',
        'status',
        'applied_at',
    ];

    protected function casts(): array
    {
        return [
            'proposed_rate' => 'decimal:2',
            'applied_at' => 'datetime',
        ];
    }

    /**
     * Get the job post this application is for
     */
    public function jobPost(): BelongsTo
    {
        return $this->belongsTo(JobPost::class);
    }

    /**
     * Alias for backward compatibility
     */
    public function booking(): BelongsTo
    {
        return $this->jobPost();
    }

    /**
     * Get the user (helper) who applied
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get status label
     */
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'pending' => 'Pending',
            'accepted' => 'Accepted',
            'rejected' => 'Rejected',
            'withdrawn' => 'Withdrawn',
            default => ucfirst($this->status),
        };
    }

    /**
     * Scope for pending applications
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for accepted applications
     */
    public function scopeAccepted($query)
    {
        return $query->where('status', 'accepted');
    }
}
