<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceListingServiceType extends Model
{
    protected $table = 'service_listing_service_types';

    protected $fillable = [
        'service_listing_id',
        'service_type',
    ];

    /**
     * Get the service listing that owns this service type
     */
    public function serviceListing(): BelongsTo
    {
        return $this->belongsTo(ServiceListing::class);
    }

    /**
     * Get service type label
     */
    public function getServiceTypeLabelAttribute(): string
    {
        return match($this->service_type) {
            'maid' => 'Maid',
            'cook' => 'Cook',
            'babysitter' => 'Babysitter',
            'caregiver' => 'Caregiver',
            'cleaner' => 'Cleaner',
            'domestic_helper' => 'Domestic Helper',
            'driver' => 'Driver',
            'security_guard' => 'Security Guard',
            default => ucfirst(str_replace('_', ' ', $this->service_type)),
        };
    }
}
