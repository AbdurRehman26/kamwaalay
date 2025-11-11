<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceListing extends Model
{
    use HasFactory;
    protected $fillable = [
        'profile_id',
        'service_types',
        'locations',
        'work_type',
        'monthly_rate',
        'description',
        'is_active',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'service_types' => 'array',
            'locations' => 'array',
            'monthly_rate' => 'decimal:2',
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
     * Scope for active listings
     */
    public function scopeActive($query)
    {
        return $query->where('service_listings.is_active', true)->where('service_listings.status', 'active');
    }

    /**
     * Scope for service type (using JSON column)
     */
    public function scopeByServiceType($query, $serviceType)
    {
        return $query->whereJsonContains('service_types', $serviceType);
    }

    /**
     * Scope for location ID (using JSON column)
     */
    public function scopeByLocationId($query, $locationId)
    {
        return $query->whereJsonContains('locations', $locationId);
    }

    /**
     * Get the first service type label (for display purposes)
     */
    public function getServiceTypeLabelAttribute(): string
    {
        $serviceTypes = $this->service_types ?? [];
        if (count($serviceTypes) > 0) {
            return str_replace('_', ' ', $serviceTypes[0]);
        }
        
        return 'Service';
    }

    /**
     * Get the first service type (for backward compatibility)
     */
    public function getServiceTypeAttribute(): ?string
    {
        $serviceTypes = $this->service_types ?? [];
        return $serviceTypes[0] ?? null;
    }
}
