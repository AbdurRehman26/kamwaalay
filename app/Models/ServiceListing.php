<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class ServiceListing extends Model
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
    protected $fillable = [
        'profile_id',
        'work_type',
        'monthly_rate',
        'description',
        'pin_address',
        'pin_latitude',
        'pin_longitude',
        'is_active',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'monthly_rate' => 'decimal:2',
            'pin_latitude' => 'decimal:8',
            'pin_longitude' => 'decimal:8',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the profile that owns this service listing
     */
    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }

    /**
     * Get the user through the profile
     */
    public function user()
    {
        return $this->profile?->profileable;
    }

    /**
     * Get the service types for this listing
     */
    public function serviceTypes(): BelongsToMany
    {
        return $this->belongsToMany(ServiceType::class, 'service_listing_service_types')
            ->withTimestamps();
    }

    /**
     * Scope for active listings
     */
    public function scopeActive($query)
    {
        return $query->where('service_listings.is_active', true)->where('service_listings.status', 'active');
    }

    /**
     * Scope for service type (using relationship)
     */
    public function scopeByServiceType($query, $serviceTypeSlug)
    {
        return $query->whereHas('serviceTypes', function ($q) use ($serviceTypeSlug) {
            $q->where('slug', $serviceTypeSlug);
        });
    }

    /**
     * Get the first service type label (for display purposes)
     */
    public function getServiceTypeLabelAttribute(): string
    {
        $firstServiceType = $this->serviceTypes()->first();
        if ($firstServiceType) {
            return $firstServiceType->name;
        }
        
        return 'Service';
    }

    /**
     * Get the first service type slug (for backward compatibility)
     */
    public function getServiceTypeAttribute(): ?string
    {
        $firstServiceType = $this->serviceTypes()->first();
        return $firstServiceType ? $firstServiceType->slug : null;
    }

    /**
     * Get service types as array of slugs (for backward compatibility)
     * Note: This accessor conflicts with the relationship name, so use serviceTypes() for relationship
     */
    public function getServiceTypesSlugsAttribute(): array
    {
        return $this->serviceTypes()->pluck('slug')->toArray();
    }

    /**
     * Scope to filter by distance from a point (Haversine formula)
     */
    public function scopeNearLocation($query, $latitude, $longitude, $radius = 20)
    {
        $haversine = "(6371 * acos(cos(radians($latitude)) * cos(radians(pin_latitude)) * cos(radians(pin_longitude) - radians($longitude)) + sin(radians($latitude)) * sin(radians(pin_latitude))))";

        return $query->select('*') // Select all columns
                     ->selectRaw("{$haversine} AS distance")
                     ->whereRaw("{$haversine} < ?", [$radius]);
    }
}
