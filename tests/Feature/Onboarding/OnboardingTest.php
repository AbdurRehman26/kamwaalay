<?php

use App\Models\User;
use App\Models\ServiceListing;
use App\Models\City;
use App\Models\Location;
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

    // Create Karachi city and location for testing
    $karachi = City::factory()->create(['name' => 'Karachi']);
    Location::factory()->create([
        'city_id' => $karachi->id,
        'area' => 'Saddar',
    ]);
    Location::factory()->create([
        'city_id' => $karachi->id,
        'area' => 'DHA',
    ]);
});

test('helpers can view onboarding page', function () {
    $helper = User::factory()->create();
    $helper->assignRole('helper');

    $response = $this->get('/onboarding/helper');

    // React Router app - just check the page loads
    $response->assertStatus(200);
});

test('helpers can complete onboarding', function () {
    $helper = User::factory()->create();
    $helper->assignRole('helper');

    $location = Location::first();
    
    $token = $helper->createToken('test-token')->plainTextToken;

    // Create fake NIC file upload
    $nicFile = \Illuminate\Http\UploadedFile::fake()->create('nic.pdf', 100);

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->post('/api/onboarding/helper', [
        'services' => ['maid', 'cleaner'],
        'locations' => [$location->id],
        'work_type' => 'full_time',
        'monthly_rate' => 15000,
        'description' => 'Professional maid service',
        'experience_years' => 5,
        'bio' => 'Experienced helper',
        'nic' => $nicFile,
        'nic_number' => '12345-1234567-1',
    ]);

    $response->assertStatus(200);
    
    // Should create service listing
    $helper->refresh();
    $helper->load('profile');
    $profile = $helper->profile;
    expect($profile)->not->toBeNull();
    
    $listings = ServiceListing::where('profile_id', $profile->id)->get();
    expect($listings)->toHaveCount(1);
    
    // Check service types are in JSON column
    $listing = $listings->first();
    expect($listing->service_types)->toBeArray();
    expect($listing->service_types)->toContain('maid');
    expect($listing->service_types)->toContain('cleaner');
});

test('businesses can view onboarding page', function () {
    $business = User::factory()->create();
    $business->assignRole('business');

    $response = $this->get('/onboarding/business');

    // React Router app - just check the page loads
    $response->assertStatus(200);
});

test('businesses can complete onboarding', function () {
    $business = User::factory()->create();
    $business->assignRole('business');

    $location = Location::first();
    
    $token = $business->createToken('test-token')->plainTextToken;

    // Create fake NIC file upload
    $nicFile = \Illuminate\Http\UploadedFile::fake()->create('nic.pdf', 100);

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->post('/api/onboarding/business', [
        'services' => ['maid'],
        'locations' => [$location->id],
        'work_type' => 'full_time',
        'monthly_rate' => 15000,
        'description' => 'Professional service',
        'bio' => 'Professional business',
        'city' => 'Karachi',
        'area' => 'Saddar',
        'nic' => $nicFile,
        'nic_number' => '12345-1234567-1',
    ]);

    $response->assertStatus(200);
    
    $business->refresh();
    $business->load('profile');
    expect($business->profile->bio)->toBe('Professional business');
    expect($business->profile->city)->toBe('Karachi');
    
    $profile = $business->profile;
    $listings = ServiceListing::where('profile_id', $profile->id)->get();
    expect($listings)->toHaveCount(1);
});

test('only helpers can access helper onboarding', function () {
    if (!Role::where('name', 'user')->exists()) {
        Role::create(['name' => 'user']);
    }
    $user = User::factory()->create();
    $user->assignRole('user');
    
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->getJson('/api/onboarding/helper');

    $response->assertStatus(403);
});

test('only businesses can access business onboarding', function () {
    if (!Role::where('name', 'user')->exists()) {
        Role::create(['name' => 'user']);
    }
    $user = User::factory()->create();
    $user->assignRole('user');
    
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->getJson('/api/onboarding/business');

    $response->assertStatus(403);
});

test('onboarding requires at least one service', function () {
    $helper = User::factory()->create();
    $helper->assignRole('helper');
    
    $token = $helper->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->postJson('/api/onboarding/helper', [
        'services' => [],
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['services']);
});

