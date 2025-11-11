<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Profile extends Model
{
    use HasFactory;

    protected $fillable = [
        'profileable_type',
        'profileable_id',
        'photo',
        'service_type',
        'skills',
        'experience_years',
        'city',
        'area',
        'availability',
        'bio',
        'verification_status',
        'police_verified',
        'is_active',
        'rating',
        'total_reviews',
    ];

    protected function casts(): array
    {
        return [
            'experience_years' => 'integer',
            'police_verified' => 'boolean',
            'is_active' => 'boolean',
            'rating' => 'decimal:2',
            'total_reviews' => 'integer',
        ];
    }

    /**
     * Get the parent profileable model (User).
     */
    public function profileable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the service listings for this profile
     */
    public function serviceListings(): HasMany
    {
        return $this->hasMany(ServiceListing::class);
    }

    /**
     * Get service type label
     */
    public function getServiceTypeLabelAttribute(): string
    {
        if (!$this->service_type) {
            return '';
        }
        
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
}
