<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements FilamentUser
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, HasRoles, LogsActivity;

    /**
     * Configure activity log options for this model.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'email', 'phone', 'address', 'is_active', 'verified_at'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    /**
     * Determine if the user can access the Filament admin panel.
     */
    public function canAccessPanel(Panel $panel): bool
    {
        return $this->hasRole('admin') || $this->hasRole('super_admin');
    }

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
        'is_active',
        'verified_at',
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
            'verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
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

    // Job posts relationships
    public function jobPosts()
    {
        return $this->hasMany(JobPost::class, 'user_id');
    }

    public function helperJobPosts()
    {
        return $this->hasMany(JobPost::class, 'assigned_user_id');
    }

    /**
     * Alias for backward compatibility
     */
    public function bookings()
    {
        return $this->jobPosts();
    }

    /**
     * Alias for backward compatibility
     */
    public function helperBookings()
    {
        return $this->helperJobPosts();
    }

    public function reviews()
    {
        return $this->hasMany(Review::class, 'user_id');
    }

    public function helperReviews()
    {
        // Get reviews where this user is the helper (from job post's assigned_user_id)
        return $this->hasManyThrough(Review::class, JobPost::class, 'assigned_user_id', 'job_post_id');
    }

    // Documents relationship (helpers can have documents)
    public function documents()
    {
        return $this->hasMany(Document::class, 'user_id');
    }

    // Profile relationship (polymorphic one-to-one)
    public function profile()
    {
        return $this->morphOne(Profile::class, 'profileable');
    }

    // Service listings (services offered by helpers/businesses) - through profile
    public function serviceListings()
    {
        return $this->hasManyThrough(
            ServiceListing::class,
            Profile::class,
            'profileable_id', // Foreign key on profiles table
            'profile_id', // Foreign key on service_listings table
            'id', // Local key on users table
            'id' // Local key on profiles table
        )->where('profiles.profileable_type', 'App\Models\User');
    }

    /**
     * Check if user has completed onboarding
     * - Helper/Business: completed when they have at least one service listing
     * - Normal user: completed when they have updated their profile for the first time
     */
    public function hasCompletedOnboarding(): bool
    {
        if ($this->hasRole('helper') || $this->hasRole('business')) {
            // Check if user has a profile with service listings
            $profile = $this->profile;

            if (!$profile) {
                return false;
            }
            return $profile->serviceListings()->exists();
        }

        // Normal user onboarding is complete when they have updated their profile
        return $this->profile_updated_at !== null;
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
                    ->whereHas('profile', function ($q) {
                        $q->where('verification_status', 'verified')
                          ->where('profiles.is_active', true);
                    })
                    ->where('users.is_active', true);
    }

    public function scopeByServiceType($query, ?string $serviceType)
    {
        if ($serviceType) {
            return $query->whereHas('profile', function ($q) use ($serviceType) {
                $q->where('service_type', $serviceType);
            });
        }
        return $query;
    }

    public function scopeByCity($query, string $city)
    {
        return $query->whereHas('profile', function ($q) use ($city) {
            $q->where('city', $city);
        });
    }

    // Accessors to get profile fields
    public function getPhotoAttribute()
    {
        return $this->profile?->photo;
    }

    public function getServiceTypeAttribute()
    {
        return $this->profile?->service_type;
    }


    public function getExperienceYearsAttribute()
    {
        return $this->profile?->experience_years;
    }

    public function getCityAttribute()
    {
        return $this->profile?->city;
    }

    public function getAreaAttribute()
    {
        return $this->profile?->area;
    }

    public function getAvailabilityAttribute()
    {
        return $this->profile?->availability;
    }


    public function getBioAttribute()
    {
        return $this->profile?->bio;
    }

    public function getVerificationStatusAttribute()
    {
        return $this->profile?->verification_status;
    }

    public function getPoliceVerifiedAttribute()
    {
        return $this->profile?->police_verified;
    }

    public function getRatingAttribute()
    {
        return $this->profile?->rating ?? 0.00;
    }

    public function getTotalReviewsAttribute()
    {
        return $this->profile?->total_reviews ?? 0;
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
            'domestic_helper' => 'Domestic Helper',
            'driver' => 'Driver',
            'security_guard' => 'Security Guard',
            default => ucfirst(str_replace('_', ' ', $this->service_type)),
        };
    }

    public function getIsVerifiedAttribute(): bool
    {
        return $this->verification_status === 'verified' && $this->is_active;
    }
}
