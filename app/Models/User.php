<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'address',
        // Helper-specific fields
        'photo',
        'service_type',
        'skills',
        'experience_years',
        'city',
        'area',
        'availability',
        'monthly_rate',
        'bio',
        'verification_status',
        'police_verified',
        'is_active',
        'rating',
        'total_reviews',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'password' => 'hashed',
            'experience_years' => 'integer',
            'monthly_rate' => 'decimal:2',
            'police_verified' => 'boolean',
            'is_active' => 'boolean',
            'rating' => 'decimal:2',
            'total_reviews' => 'integer',
        ];
    }

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['role'];

    // Business relationships (many-to-many)
    public function businesses()
    {
        return $this->belongsToMany(User::class, 'business_helper', 'user_id', 'business_id')
                    ->withPivot('status', 'joined_at')
                    ->withTimestamps();
    }

    public function helpers()
    {
        return $this->belongsToMany(User::class, 'business_helper', 'business_id', 'user_id')
                    ->withPivot('status', 'joined_at')
                    ->withTimestamps()
                    ->whereHas('roles', function ($query) {
                        $query->where('roles.name', 'helper');
                    })
                    ->select('users.*'); // Explicitly select users table columns
    }

    // Bookings relationships
    public function bookings()
    {
        return $this->hasMany(Booking::class, 'user_id');
    }

    public function helperBookings()
    {
        return $this->hasMany(Booking::class, 'assigned_user_id');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class, 'user_id');
    }

    public function helperReviews()
    {
        // Get reviews where this user is the helper (from booking's assigned_user_id)
        return $this->hasManyThrough(Review::class, Booking::class, 'assigned_user_id', 'booking_id');
    }

    // Documents relationship (helpers can have documents)
    public function documents()
    {
        return $this->hasMany(Document::class, 'user_id');
    }

    // Service listings (services offered by helpers/businesses)
    public function serviceListings()
    {
        return $this->hasMany(ServiceListing::class);
    }

    /**
     * Check if user has completed onboarding (has at least one service listing)
     */
    public function hasCompletedOnboarding(): bool
    {
        if (!$this->hasRole(['helper', 'business'])) {
            return true; // Regular users don't need onboarding
        }

        return $this->serviceListings()->exists();
    }

    // Job applications (helpers applying to service requests)
    public function jobApplications()
    {
        return $this->hasMany(JobApplication::class);
    }

    // Role check methods (using Spatie Permission)
    public function isAdmin(): bool
    {
        return $this->hasRole('admin') || $this->hasRole('super_admin');
    }

    public function isHelper(): bool
    {
        return $this->hasRole('helper');
    }

    public function isUser(): bool
    {
        return $this->hasRole('user');
    }

    public function isBusiness(): bool
    {
        return $this->hasRole('business');
    }

    /**
     * Get primary role name (first role)
     */
    public function getRoleAttribute(): ?string
    {
        return $this->roles()->first()?->name;
    }

    // Helper-specific scopes and methods
    public function scopeVerifiedHelpers($query)
    {
        return $query->role('helper')
                    ->where('verification_status', 'verified')
                    ->where('is_active', true);
    }

    public function scopeByServiceType($query, ?string $serviceType)
    {
        if ($serviceType) {
            return $query->where('service_type', $serviceType);
        }
        return $query;
    }

    public function scopeByCity($query, string $city)
    {
        return $query->where('city', $city);
    }

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

    public function getIsVerifiedAttribute(): bool
    {
        return $this->verification_status === 'verified' && $this->is_active;
    }
}
