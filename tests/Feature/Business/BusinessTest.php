<?php

use App\Models\User;
use App\Models\JobPost;
use App\Models\Country;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    if (!Role::where('name', 'business')->exists()) {
        Role::create(['name' => 'business']);
    }
    if (!Role::where('name', 'helper')->exists()) {
        Role::create(['name' => 'helper']);
    }
    // Create a default country for cities
    if (!Country::where('id', 1)->exists()) {
        Country::create([
            'id' => 1,
            'name' => 'Pakistan',
            'code' => 'PK',
            'phone_code' => '+92',
            'is_active' => true,
        ]);
    }
});

test('businesses can view their dashboard', function () {
    $business = User::factory()->create();
    $business->assignRole('business');
    
    $token = $business->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->getJson('/api/business/dashboard');

    $response->assertStatus(200);
    $response->assertJsonStructure(['stats', 'recent_workers', 'recent_bookings']);
});

test('businesses can view their workers', function () {
    $business = User::factory()->create();
    $business->assignRole('business');

    $helper = User::factory()->create();
    $helper->assignRole('helper');
    $business->helpers()->attach($helper->id);
    
    $token = $business->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->getJson('/api/business/workers');

    $response->assertStatus(200);
    $response->assertJsonStructure(['workers']);
});

test('businesses can create a worker', function () {
    $business = User::factory()->create();
    $business->assignRole('business');
    
    $token = $business->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->postJson('/api/business/workers', [
        'name' => 'Worker Name',
        'email' => 'worker@example.com',
        'phone' => '03001234567',
        'service_types' => ['maid'],
        'locations' => [
            [
                'city' => 'Karachi',
                'area' => 'Saddar',
            ],
        ],
        'skills' => 'Cleaning, Laundry',
        'experience_years' => 5,
        'availability' => 'full_time',
        'bio' => 'Experienced worker',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertStatus(200);
    $this->assertDatabaseHas('users', [
        'email' => 'worker@example.com',
        'name' => 'Worker Name',
    ]);

    $helper = User::where('email', 'worker@example.com')->first();
    expect($business->helpers()->where('users.id', $helper->id)->exists())->toBeTrue();
});

test('businesses can update their worker', function () {
    $business = User::factory()->create();
    $business->assignRole('business');

    $helper = User::factory()->create([
        'name' => 'Old Name',
    ]);
    $helper->assignRole('helper');
    $profile = $helper->profile()->create([]);
    $business->helpers()->attach($helper->id);
    
    $token = $business->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->putJson("/api/business/workers/{$helper->id}", [
        'name' => 'New Name',
        'phone' => $helper->phone ?? '03001234567',
        'service_types' => ['cook'],
        'locations' => [
            [
                'city' => 'Karachi',
                'area' => 'PECHS',
            ],
        ],
        'skills' => 'Cooking',
        'experience_years' => 8,
        'availability' => 'part_time',
        'bio' => 'Updated bio',
        'is_active' => true,
    ]);

    $response->assertStatus(200);
    $helper->refresh();
    $helper->load(['profile', 'serviceListings']);
    expect($helper->name)->toBe('New Name');
    // Check that service listing was created with the correct service types
    expect($helper->serviceListings)->not->toBeEmpty();
    expect($helper->serviceListings->first()->service_types)->toContain('cook');
});

test('businesses can remove a worker', function () {
    $business = User::factory()->create();
    $business->assignRole('business');

    $helper = User::factory()->create();
    $helper->assignRole('helper');
    $business->helpers()->attach($helper->id);
    
    $token = $business->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->deleteJson("/api/business/workers/{$helper->id}");

    $response->assertStatus(200);
    expect($business->helpers()->where('users.id', $helper->id)->exists())->toBeFalse();
});

test('only business owner can manage their workers', function () {
    $business1 = User::factory()->create();
    $business1->assignRole('business');
    $business2 = User::factory()->create();
    $business2->assignRole('business');

    $helper = User::factory()->create();
    $helper->assignRole('helper');
    $business1->helpers()->attach($helper->id);
    
    $token = $business2->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->putJson("/api/business/workers/{$helper->id}", [
        'name' => 'Hacked Name',
        'phone' => $helper->phone ?? '03001234567',
        'service_types' => ['maid'],
        'locations' => [
            [
                'city' => 'Karachi',
                'area' => 'Saddar',
            ],
        ],
        'skills' => 'Cleaning',
        'experience_years' => 5,
        'availability' => 'full_time',
        'is_active' => true,
    ]);

    $response->assertStatus(403);
});

test('guests can view business profiles', function () {
    $business = User::factory()->create();
    $business->assignRole('business');

    $response = $this->getJson("/api/businesses/{$business->id}");

    $response->assertStatus(200);
    $response->assertJsonStructure(['business']);
});

