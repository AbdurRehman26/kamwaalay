<?php

use App\Models\User;
use App\Models\Booking;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    if (!Role::where('name', 'user')->exists()) {
        Role::create(['name' => 'user']);
    }
});

test('users can view their bookings', function () {
    $user = User::factory()->create();
    $user->assignRole('user');

    Booking::factory()->create([
        'user_id' => $user->id,
    ]);
    
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->getJson('/api/bookings');

    $response->assertStatus(200);
    $response->assertJsonStructure(['bookings']);
});

test('users can update their booking status', function () {
    $user = User::factory()->create();
    $user->assignRole('user');

    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'status' => 'pending',
    ]);
    
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->patchJson("/api/bookings/{$booking->id}", [
        'status' => 'cancelled',
    ]);

    $response->assertStatus(200);
    $booking->refresh();
    expect($booking->status)->toBe('cancelled');
});

test('users can delete their booking', function () {
    $user = User::factory()->create();
    $user->assignRole('user');

    $booking = Booking::factory()->create([
        'user_id' => $user->id,
    ]);
    
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->deleteJson("/api/bookings/{$booking->id}");

    $response->assertStatus(200);
    $this->assertDatabaseMissing('bookings', [
        'id' => $booking->id,
    ]);
});

test('users cannot update other users bookings', function () {
    $user1 = User::factory()->create();
    $user1->assignRole('user');
    $user2 = User::factory()->create();
    $user2->assignRole('user');

    $booking = Booking::factory()->create([
        'user_id' => $user1->id,
    ]);
    
    $token = $user2->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->patchJson("/api/bookings/{$booking->id}", [
        'status' => 'cancelled',
    ]);

    $response->assertStatus(403);
});

test('users cannot delete other users bookings', function () {
    $user1 = User::factory()->create();
    $user1->assignRole('user');
    $user2 = User::factory()->create();
    $user2->assignRole('user');

    $booking = Booking::factory()->create([
        'user_id' => $user1->id,
    ]);
    
    $token = $user2->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->deleteJson("/api/bookings/{$booking->id}");

    $response->assertStatus(403);
});

