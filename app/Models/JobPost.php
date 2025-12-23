<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class JobPost extends Model
{
    use HasFactory, LogsActivity;

    /**
     * Configure activity log options for this model.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected $table = 'job_posts';

    protected static function newFactory()
    {
        return \Database\Factories\JobPostFactory::new();
    }

    protected $fillable = [
        'user_id',
        'assigned_user_id',
        'service_type_id',
        'work_type',
        'estimated_salary',
        'city_id',
        'start_date',
        'start_time',
        'name',
        'phone',
        'address',
        'latitude',
        'longitude',
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

    public function serviceType(): BelongsTo
    {
        return $this->belongsTo(ServiceType::class);
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

    /**
     * Get the city for this job post
     */
    public function cityRelation(): BelongsTo
    {
        return $this->belongsTo(City::class, 'city_id');
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
        if ($this->serviceType) {
            return $this->serviceType->name;
        }

        return match($this->service_type) {
            'maid' => 'Maid',
            'cook' => 'Cook',
            'babysitter' => 'Babysitter',
            'caregiver' => 'Caregiver',
            'cleaner' => 'Cleaner',
            'domestic_helper' => 'Domestic Helper',
            'driver' => 'Driver',
            'security_guard' => 'Security Guard',
            default => ucfirst(str_replace('_', ' ', (string)$this->service_type)),
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

