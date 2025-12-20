<?php

use App\Models\User;
use App\Models\ServiceListing;
use App\Models\Location;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    if (!Role::where('name', 'helper')->exists()) {
        Role::create(['name' => 'helper']);
    }
    if (!Role::where('name', 'user')->exists()) {
        Role::create(['name' => 'user']);
    }
});

test('guests can view helper profiles', function () {
    $helper = User::factory()->create();
    $helper->assignRole('helper');

    $response = $this->getJson("/api/helpers/{$helper->id}");

    $response->assertStatus(200);
    $response->assertJsonStructure(['helper']);
});

test('helpers can view their own profile', function () {
    $helper = User::factory()->create();
    $helper->assignRole('helper');

    $response = $this->getJson("/api/helpers/{$helper->id}");

    $response->assertStatus(200);
    $response->assertJsonStructure(['helper']);
});

test('helpers can create their profile', function () {
    $helper = User::factory()->create();
    $helper->assignRole('helper');
    
    $token = $helper->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->postJson('/api/helpers', [
        'service_type' => 'maid',
        'experience_years' => 5,
        'city' => 'Karachi',
        'area' => 'Saddar',
        'availability' => 'full_time',
        'bio' => 'Experienced maid',
    ]);

    $response->assertStatus(200);
    $this->assertDatabaseHas('profiles', [
        'profileable_id' => $helper->id,
        'profileable_type' => 'App\Models\User',
        'service_type' => 'maid',
    ]);
});

test('helpers can update their profile', function () {
    $helper = User::factory()->create();
    $helper->assignRole('helper');
    $helper->profile()->create([
        'service_type' => 'maid',
    ]);
    
    $token = $helper->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->putJson("/api/helpers/{$helper->id}", [
        'service_type' => 'cook',
        'experience_years' => 8,
        'city' => 'Karachi',
        'area' => 'PECHS',
        'availability' => 'part_time',
        'bio' => 'Professional cook',
    ]);

    $response->assertStatus(200);
    $this->assertDatabaseHas('profiles', [
        'profileable_id' => $helper->id,
        'profileable_type' => 'App\Models\User',
        'service_type' => 'cook',
    ]);
});

test('helpers can see their service listings on profile', function () {
    $helper = User::factory()->create();
    $helper->assignRole('helper');
    
    // Create profile for helper
    $profile = $helper->profile()->create([]);

    $listing = ServiceListing::factory()->create([
        'profile_id' => $profile->id,
        'is_active' => true,
        'status' => 'active',
    ]);

    // Service types and locations are now stored in pivot tables
    $serviceType = \App\Models\ServiceType::where('slug', 'maid')->first();
    $location = Location::first();
    if ($serviceType) {
        $listing->serviceTypes()->sync([$serviceType->id]);
    }
    if ($location) {
        $listing->locations()->sync([$location->id]);
    }

    $response = $this->getJson("/api/helpers/{$helper->id}");

    $response->assertStatus(200);
    $response->assertJsonStructure(['helper' => ['service_listings']]);
    expect($response->json('helper.service_listings'))->toBeArray();
});

