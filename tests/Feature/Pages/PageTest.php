<?php

use App\Models\City;
use App\Models\Location;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('guests can view about page', function () {
    $response = $this->get('/about');

    $response->assertStatus(200);
    // React Router app - just check the page loads
});

test('guests can view contact page', function () {
    $response = $this->get('/contact');

    $response->assertStatus(200);
    // React Router app - just check the page loads
});

test('guests can view faq page', function () {
    $response = $this->get('/faq');

    $response->assertStatus(200);
    // React Router app - just check the page loads
});

test('guests can view terms page', function () {
    $response = $this->get('/terms');

    $response->assertStatus(200);
    // React Router app - just check the page loads
});

test('guests can view privacy page', function () {
    $response = $this->get('/privacy');

    $response->assertStatus(200);
    // React Router app - just check the page loads
});

test('api can search karachi locations', function () {
    $karachi = City::factory()->create(['name' => 'Karachi']);
    Location::factory()->create([
        'city_id' => $karachi->id,
        'area' => 'Saddar',
        'is_active' => true,
    ]);
    Location::factory()->create([
        'city_id' => $karachi->id,
        'area' => 'DHA Phase 5',
        'is_active' => true,
    ]);

    $response = $this->get('/api/karachi-locations/search?q=Saddar');

    $response->assertStatus(200);
    $response->assertJson(['Saddar']);
});

test('api can search all locations', function () {
    $karachi = City::factory()->create(['name' => 'Karachi']);
    $location = Location::factory()->create([
        'city_id' => $karachi->id,
        'area' => 'Saddar',
        'is_active' => true,
    ]);

    $response = $this->get('/api/locations/search?q=Saddar');

    $response->assertStatus(200);
    $response->assertJsonCount(1);
    expect($response->json()[0])->toHaveKey('area', 'Saddar');
});

test('location search returns empty array when no matches', function () {
    $response = $this->get('/api/locations/search?q=Nonexistent');

    $response->assertStatus(200);
    $response->assertJson([]);
});

test('location search limits results to 10', function () {
    $karachi = City::factory()->create(['name' => 'Karachi']);
    Location::factory()->count(15)->create([
        'city_id' => $karachi->id,
        'area' => 'Area',
        'is_active' => true,
    ]);

    $response = $this->get('/api/locations/search?q=Area');

    $response->assertStatus(200);
    expect(count($response->json()))->toBeLessThanOrEqual(10);
});

