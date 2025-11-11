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
    if (!Role::where('name', 'business')->exists()) {
        Role::create(['name' => 'business']);
    }
});

test('helpers can view their service listings', function () {
    $helper = User::factory()->create();
    $helper->assignRole('helper');

    $profile = $helper->profile()->create([]);
    $listing = ServiceListing::factory()->create([
        'profile_id' => $profile->id,
    ]);
    
    $token = $helper->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->getJson('/api/service-listings/my-service-listings');

    $response->assertStatus(200);
    $response->assertJsonStructure(['listings']);
});

test('helpers can edit their service listing', function () {
    $helper = User::factory()->create();
    $helper->assignRole('helper');

    $profile = $helper->profile()->create([]);
    $listing = ServiceListing::factory()->create([
        'profile_id' => $profile->id,
    ]);

    // Service types and locations are now stored in JSON columns
    $location = Location::first();
    $listing->update([
        'service_types' => ['maid'],
        'locations' => [$location->id],
    ]);
    
    $token = $helper->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->getJson("/api/service-listings/{$listing->id}/edit");

    $response->assertStatus(200);
    $response->assertJsonStructure(['listing']);
});

test('helpers can delete their service listing', function () {
    $helper = User::factory()->create();
    $helper->assignRole('helper');

    $profile = $helper->profile()->create([]);
    $listing = ServiceListing::factory()->create([
        'profile_id' => $profile->id,
    ]);
    
    $token = $helper->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->deleteJson("/api/service-listings/{$listing->id}");

    $response->assertStatus(200);
    $this->assertDatabaseMissing('service_listings', [
        'id' => $listing->id,
    ]);
});

test('helpers cannot edit other helpers service listings', function () {
    $helper1 = User::factory()->create();
    $helper1->assignRole('helper');
    $helper2 = User::factory()->create();
    $helper2->assignRole('helper');

    $profile = $helper1->profile()->create([]);
    $listing = ServiceListing::factory()->create([
        'profile_id' => $profile->id,
    ]);
    
    $token = $helper2->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->getJson("/api/service-listings/{$listing->id}/edit");

    $response->assertStatus(403);
});

test('helpers cannot delete other helpers service listings', function () {
    $helper1 = User::factory()->create();
    $helper1->assignRole('helper');
    $helper2 = User::factory()->create();
    $helper2->assignRole('helper');

    $profile = $helper1->profile()->create([]);
    $listing = ServiceListing::factory()->create([
        'profile_id' => $profile->id,
    ]);
    
    $token = $helper2->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->deleteJson("/api/service-listings/{$listing->id}");

    $response->assertStatus(403);
});

test('businesses can view their service listings', function () {
    $business = User::factory()->create();
    $business->assignRole('business');

    $profile = $business->profile()->create([]);
    $listing = ServiceListing::factory()->create([
        'profile_id' => $profile->id,
    ]);
    
    $token = $business->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->getJson('/api/service-listings/my-service-listings');

    $response->assertStatus(200);
    $response->assertJsonStructure(['listings']);
});

test('guests can view individual service listing', function () {
    $helper = User::factory()->create();
    $helper->assignRole('helper');

    $profile = $helper->profile()->create([]);
    $listing = ServiceListing::factory()->create([
        'profile_id' => $profile->id,
        'is_active' => true,
        'status' => 'active',
    ]);

    // Service types and locations are now stored in JSON columns
    $location = Location::first();
    $listing->update([
        'service_types' => ['maid'],
        'locations' => [$location->id],
    ]);

    $response = $this->getJson("/api/service-listings/{$listing->id}");

    $response->assertStatus(200);
    $response->assertJsonStructure(['listing']);
});

