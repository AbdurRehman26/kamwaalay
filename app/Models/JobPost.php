<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobPost extends Model
{
    use HasFactory;
    
    protected $table = 'job_posts';
    
    protected static function newFactory()
    {
        return \Database\Factories\JobPostFactory::new();
    }
    
    protected $fillable = [
        'user_id',
        'assigned_user_id',
        'service_type',
        'work_type',
        'city',
        'area',
        'start_date',
        'start_time',
        'name',
        'phone',
        'email',
        'address',
        'special_requirements',
        'status',
        'admin_notes',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'start_time' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function helper(): BelongsTo
    {
        return $this->assignedUser();
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }

    /**
     * Get job applications for this job post
     */
    public function jobApplications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }

    /**
     * Get accepted job application
     */
    public function acceptedApplication(): HasOne
    {
        return $this->hasOne(JobApplication::class)->where('status', 'accepted');
    }

    public function getServiceTypeLabelAttribute(): string
    {
        return match($this->service_type) {
            'maid' => 'Maid',
            'cook' => 'Cook',
            'babysitter' => 'Babysitter',
            'caregiver' => 'Caregiver',
            'cleaner' => 'Cleaner',
            'all_rounder' => 'All Rounder',
            default => ucfirst($this->service_type),
        };
    }

    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'pending' => 'Pending',
            'confirmed' => 'Confirmed',
            'in_progress' => 'In Progress',
            'completed' => 'Completed',
            'cancelled' => 'Cancelled',
            default => ucfirst($this->status),
        };
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }
}

