<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Profile extends Model
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
        'profileable_type',
        'profileable_id',
        'photo',
        'service_type',
        'experience_years',
        'age',
        'gender',
        'religion',
        'city_id',
        'availability',
        'bio',
        'verification_status',
        'police_verified',
        'is_active',
        'rating',
        'total_reviews',
        'pin_address',
        'pin_latitude',
        'pin_longitude',
    ];

    protected function casts(): array
    {
        return [
            'experience_years' => 'integer',
            'age' => 'integer',
            'religion' => \App\Enums\Religion::class,
            'police_verified' => 'boolean',
            'is_active' => 'boolean',
            'rating' => 'decimal:2',
            'total_reviews' => 'integer',
            'pin_latitude' => 'decimal:8',
            'pin_longitude' => 'decimal:8',
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
     * Get languages for this profile
     */
    public function languages(): BelongsToMany
    {
        return $this->belongsToMany(Language::class, 'profile_language');
    }

    public function city()
    {
        return $this->belongsTo(City::class, 'city_id', 'id');
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
            'domestic_helper' => 'Domestic Helper',
            'driver' => 'Driver',
            'security_guard' => 'Security Guard',
            default => ucfirst(str_replace('_', ' ', $this->service_type)),
        };
    }

    /**
     * Scope to filter by distance from a point (Haversine formula)
     */
    public function scopeNearLocation($query, $latitude, $longitude, $radius = 20)
    {
        $haversine = "(6371 * acos(cos(radians($latitude)) * cos(radians(pin_latitude)) * cos(radians(pin_longitude) - radians($longitude)) + sin(radians($latitude)) * sin(radians(pin_latitude))))";

        return $query->select('profiles.*')
                     ->selectRaw("{$haversine} AS distance")
                     ->whereRaw("{$haversine} < ?", [$radius]);
    }
}
