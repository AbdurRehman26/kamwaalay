<?php

use App\Models\User;
use App\Models\Booking;
use App\Models\Review;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    if (!Role::where('name', 'user')->exists()) {
        Role::create(['name' => 'user']);
    }
    if (!Role::where('name', 'helper')->exists()) {
        Role::create(['name' => 'helper']);
    }
});

test('users can create a review for completed booking', function () {
    $user = User::factory()->create();
    $user->assignRole('user');

    $helper = User::factory()->create();
    $helper->assignRole('helper');

    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'assigned_user_id' => $helper->id,
        'status' => 'completed',
    ]);

    // Ensure booking has assigned_user_id for the review booted event
    $booking->refresh();
    
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->postJson("/api/bookings/{$booking->id}/review", [
        'rating' => 5,
        'comment' => 'Excellent service!',
    ]);

    $response->assertStatus(200);
    $this->assertDatabaseHas('reviews', [
        'booking_id' => $booking->id,
        'user_id' => $user->id,
        'rating' => 5,
    ]);
});

test('only booking owner can create review', function () {
    $user1 = User::factory()->create();
    $user1->assignRole('user');
    $user2 = User::factory()->create();
    $user2->assignRole('user');

    $helper = User::factory()->create();
    $helper->assignRole('helper');

    $booking = Booking::factory()->create([
        'user_id' => $user1->id,
        'assigned_user_id' => $helper->id,
    ]);
    
    $token = $user2->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->postJson("/api/bookings/{$booking->id}/review", [
        'rating' => 5,
        'comment' => 'Great!',
    ]);

    $response->assertStatus(403);
});

test('users can update their review', function () {
    $user = User::factory()->create();
    $user->assignRole('user');

    $helper = User::factory()->create();
    $helper->assignRole('helper');

    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'assigned_user_id' => $helper->id,
    ]);

    $review = Review::create([
        'booking_id' => $booking->id,
        'user_id' => $user->id,
        'rating' => 3,
        'comment' => 'Average',
    ]);
    
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->putJson("/api/reviews/{$review->id}", [
        'rating' => 5,
        'comment' => 'Actually excellent!',
    ]);

    $response->assertStatus(200);
    $review->refresh();
    // Reload booking relationship to avoid helper() method issues
    $review->load('booking');
    expect($review->rating)->toBe(5);
    expect($review->comment)->toBe('Actually excellent!');
});

test('only review owner can update review', function () {
    $user1 = User::factory()->create();
    $user1->assignRole('user');
    $user2 = User::factory()->create();
    $user2->assignRole('user');

    $helper = User::factory()->create();
    $helper->assignRole('helper');

    $booking = Booking::factory()->create([
        'user_id' => $user1->id,
        'assigned_user_id' => $helper->id,
    ]);

    $review = Review::create([
        'booking_id' => $booking->id,
        'user_id' => $user1->id,
        'rating' => 4,
        'comment' => 'Good',
    ]);

    // Load booking relationship before update to avoid helper() method issues
    $review->load('booking');
    
    $token = $user2->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->putJson("/api/reviews/{$review->id}", [
        'rating' => 1,
        'comment' => 'Bad',
    ]);

    $response->assertStatus(403);
});

test('users can delete their review', function () {
    $user = User::factory()->create();
    $user->assignRole('user');

    $helper = User::factory()->create();
    $helper->assignRole('helper');

    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'assigned_user_id' => $helper->id,
    ]);

    $review = Review::create([
        'booking_id' => $booking->id,
        'user_id' => $user->id,
        'rating' => 4,
        'comment' => 'Good',
    ]);

    // Load booking relationship before deletion to avoid helper() method issues
    $review->load('booking');
    
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->deleteJson("/api/reviews/{$review->id}");

    $response->assertStatus(200);
    $this->assertDatabaseMissing('reviews', [
        'id' => $review->id,
    ]);
});

test('rating must be between 1 and 5', function () {
    $user = User::factory()->create();
    $user->assignRole('user');

    $helper = User::factory()->create();
    $helper->assignRole('helper');

    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'assigned_user_id' => $helper->id,
    ]);
    
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->postJson("/api/bookings/{$booking->id}/review", [
        'rating' => 6,
        'comment' => 'Invalid rating',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['rating']);
});

test('users cannot create multiple reviews for same booking', function () {
    $user = User::factory()->create();
    $user->assignRole('user');

    $helper = User::factory()->create();
    $helper->assignRole('helper');

    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'assigned_user_id' => $helper->id,
    ]);

    $firstReview = Review::create([
        'booking_id' => $booking->id,
        'user_id' => $user->id,
        'rating' => 4,
        'comment' => 'First review',
    ]);
    
    // Load booking relationship to avoid helper() method issues during boot events
    $firstReview->load('booking');
    
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->postJson("/api/bookings/{$booking->id}/review", [
        'rating' => 5,
        'comment' => 'Second review',
    ]);

    // Controller should redirect or return error if review already exists
    // Check that only one review exists
    expect(Review::where('booking_id', $booking->id)->count())->toBe(1);
});

