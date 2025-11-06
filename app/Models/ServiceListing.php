<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceListing extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'work_type',
        'monthly_rate',
        'description',
        'is_active',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'monthly_rate' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the user (helper or business) that owns this service listing
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the service types for this listing (many-to-many)
     */
    public function serviceTypes(): HasMany
    {
        return $this->hasMany(ServiceListingServiceType::class);
    }

    /**
     * Get the locations for this listing (many-to-many)
     */
    public function locations(): HasMany
    {
        return $this->hasMany(ServiceListingLocation::class);
    }

    /**
     * Scope for active listings
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)->where('status', 'active');
    }

    /**
     * Scope for service type (via pivot table)
     */
    public function scopeByServiceType($query, $serviceType)
    {
        return $query->whereHas('serviceTypes', function ($q) use ($serviceType) {
            $q->where('service_type', $serviceType);
        });
    }

    /**
     * Scope for city (via pivot table)
     */
    public function scopeByCity($query, $city)
    {
        return $query->whereHas('locations', function ($q) use ($city) {
            $q->where('city', $city);
        });
    }

    /**
     * Scope for location (city and area via pivot table)
     */
    public function scopeByLocation($query, $city, $area = null)
    {
        return $query->whereHas('locations', function ($q) use ($city, $area) {
            $q->where('city', $city);
            if ($area) {
                $q->where('area', $area);
            }
        });
    }

    /**
     * Get the first service type label (for display purposes)
     */
    public function getServiceTypeLabelAttribute(): string
    {
        if (!$this->relationLoaded('serviceTypes')) {
            $this->load('serviceTypes');
        }
        
        if ($this->serviceTypes && $this->serviceTypes->count() > 0) {
            return str_replace('_', ' ', $this->serviceTypes->first()->service_type);
        }
        
        return 'Service';
    }

    /**
     * Get the first location (for display purposes)
     */
    public function getCityAttribute(): ?string
    {
        if (!$this->relationLoaded('locations')) {
            $this->load('locations');
        }
        
        if ($this->locations && $this->locations->count() > 0) {
            return $this->locations->first()->city;
        }
        
        return null;
    }

    /**
     * Get the first area (for display purposes)
     */
    public function getAreaAttribute(): ?string
    {
        if (!$this->relationLoaded('locations')) {
            $this->load('locations');
        }
        
        if ($this->locations && $this->locations->count() > 0) {
            return $this->locations->first()->area;
        }
        
        return null;
    }

    /**
     * Get the first service type (for backward compatibility)
     */
    public function getServiceTypeAttribute(): ?string
    {
        if (!$this->relationLoaded('serviceTypes')) {
            $this->load('serviceTypes');
        }
        
        if ($this->serviceTypes && $this->serviceTypes->count() > 0) {
            return $this->serviceTypes->first()->service_type;
        }
        
        return null;
    }
}
