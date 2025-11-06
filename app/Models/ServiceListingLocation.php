<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceListingLocation extends Model
{
    protected $table = 'service_listing_locations';

    protected $fillable = [
        'service_listing_id',
        'city',
        'area',
    ];

    /**
     * Get the service listing that owns this location
     */
    public function serviceListing(): BelongsTo
    {
        return $this->belongsTo(ServiceListing::class);
    }

    /**
     * Get display text for location
     */
    public function getDisplayTextAttribute(): string
    {
        if ($this->area) {
            return $this->city . ', ' . $this->area;
        }
        return $this->city;
    }
}
