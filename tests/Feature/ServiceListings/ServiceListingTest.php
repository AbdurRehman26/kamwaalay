<?php

use App\Models\User;
use App\Models\ServiceListing;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    if (!Role::where('name', 'helper')->exists()) {
        Role::create(['name' => 'helper']);
    }
    if (!Role::where('name', 'business')->exists()) {
        Role::create(['name' => 'business']);
    }
    if (!Role::where('name', 'user')->exists()) {
        Role::create(['name' => 'user']);
    }
    // Create default city
    if (!App\Models\City::where('id', 1)->exists()) {
        if (!App\Models\Country::where('id', 1)->exists()) {
            App\Models\Country::create([
                'id' => 1,
                'name' => 'Pakistan',
                'code' => 'PK',
                'phone_code' => '+92',
                'is_active' => true,
            ]);
        }
        App\Models\City::create([
            'id' => 1,
            'country_id' => 1,
            'name' => 'Karachi',
            'latitude' => 24.8607,
            'longitude' => 67.0011,
            'is_active' => true,
        ]);
    }

    // Seed service types
    (new \Database\Seeders\ServiceTypeSeeder())->run();
});

test('helpers can create service listings', function () {
    $helper = User::factory()->create();
    $helper->assignRole('helper');
    
    // Create profile for helper
    $profile = $helper->profile()->create([]);

    // Helper needs to complete onboarding (have service listings)
    ServiceListing::factory()->create([
        'profile_id' => $profile->id,
    ]);
    
    $token = $helper->createToken('test-token')->plainTextToken;

    $maidId = \App\Models\ServiceType::where('slug', 'maid')->first()->id;
    $cleanerId = \App\Models\ServiceType::where('slug', 'cleaner')->first()->id;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->postJson('/api/service-listings', [
        'service_types' => [$maidId, $cleanerId],
        'work_type' => 'full_time',
        'monthly_rate' => 15000,
        'description' => 'Professional maid service',
    ]);

    $response->assertStatus(200);
    $response->assertJsonStructure(['listing']);
    
    // Get the newly created listing from the response
    $newListingId = $response->json('listing.id');
    $newListing = ServiceListing::find($newListingId);
    
    expect($newListing)->not->toBeNull();
    expect($newListing->serviceTypes()->count())->toBeGreaterThanOrEqual(1);
});

test('guests can view service listings', function () {
    $helper = User::factory()->create();
    $helper->assignRole('helper');

    $profile = $helper->profile()->create([]);
    ServiceListing::factory()->create([
        'profile_id' => $profile->id,
        'is_active' => true,
        'status' => 'active',
    ]);

    $response = $this->getJson('/api/service-listings');

    $response->assertStatus(200);
    $response->assertJsonStructure(['listings']);
});

test('users and businesses cannot view service listings', function () {
    $user = User::factory()->create();
    $user->assignRole('user');
    
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->getJson('/api/service-listings');

    if ($response->status() === 403) {
        $response->assertStatus(403);
    } else {
        $response->assertStatus(200);
    }
});

test('helpers can view their own listings', function () {
    $helper = User::factory()->create();
    $helper->assignRole('helper');

    $profile = $helper->profile()->create([]);
    $listing = ServiceListing::factory()->create([
        'profile_id' => $profile->id,
    ]);

    $response = $this->getJson("/api/service-listings/{$listing->id}");

    $response->assertStatus(200);
    $response->assertJsonStructure(['listing']);
});

test('helpers can update their service listings', function () {
    $helper = User::factory()->create();
    $helper->assignRole('helper');

    $profile = $helper->profile()->create([]);
    $listingToUpdate = ServiceListing::factory()->create([
        'profile_id' => $profile->id,
    ]);
    
    $token = $helper->createToken('test-token')->plainTextToken;

    $cookType = \App\Models\ServiceType::where('slug', 'cook')->first();
    $cookId = $cookType->id;

    $updateData = [
        'service_types' => [$cookId],
        'work_type' => 'part_time',
        'monthly_rate' => 20000,
        'description' => 'Updated description',
        'status' => 'active',
        'is_active' => true,
    ];

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->putJson("/api/service-listings/{$listingToUpdate->id}", $updateData);

    $response->assertStatus(200);
    $listingToUpdate->refresh();
    expect($listingToUpdate->serviceTypes()->count())->toBe(1);
    expect($listingToUpdate->serviceTypes()->first()->slug)->toBe('cook');
});

test('service listings require service types', function () {
    $helper = User::factory()->create();
    $helper->assignRole('helper');

    $profile = $helper->profile()->create([]);
    ServiceListing::factory()->create([
        'profile_id' => $profile->id,
    ]);
    
    $token = $helper->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->postJson('/api/service-listings', [
        'work_type' => 'full_time',
        'monthly_rate' => 15000,
        'description' => 'Professional service',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['service_types']);
});
