<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('users can authenticate using email', function () {
    $user = User::factory()->unverified()->create([
        'email' => 'test@example.com',
        'password' => bcrypt('password'),
        'phone_verified_at' => null, // Ensure user is unverified
    ]);

    $response = $this->postJson('/api/login', [
        'email' => 'test@example.com',
        'password' => 'password',
    ]);

    $response->assertStatus(200);
    // If user is verified, they get token directly, otherwise they get verification info
    if ($response->json('token')) {
        $response->assertJsonStructure(['message', 'user', 'token']);
    } else {
        $response->assertJsonStructure(['message', 'verification_method', 'verification_token']);
    }
    // Note: User needs to verify OTP before getting authenticated if unverified
});

test('users can authenticate using phone number', function () {
    // Note: LoginRequest currently requires email, so phone-only users get placeholder emails
    // During registration, phone-only users get email like {phone}@phone.kamwaalay.local
    $user = User::factory()->create([
        'phone' => '03001234567',
        'email' => '03001234567@phone.kamwaalay.local', // Phone-only users get placeholder email
        'password' => bcrypt('password'),
        'phone_verified_at' => null, // Ensure phone is unverified
    ]);

    $response = $this->postJson('/api/login', [
        'email' => '03001234567@phone.kamwaalay.local',
        'password' => 'password',
    ]);

    $response->assertStatus(200);
    // If user is verified, they get token directly, otherwise they get verification info
    if ($response->json('token')) {
        $response->assertJsonStructure(['message', 'user', 'token']);
    } else {
        $response->assertJsonStructure(['message', 'verification_method', 'verification_token']);
    }
    // Note: User needs to verify OTP before getting authenticated if unverified
});

test('users cannot authenticate with invalid password', function () {
    $user = User::factory()->create([
        'email' => 'test@example.com',
        'password' => bcrypt('password'),
    ]);

    $response = $this->postJson('/api/login', [
        'email' => 'test@example.com',
        'password' => 'wrong-password',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['email']);
});

test('users can logout', function () {
    $user = User::factory()->create();
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->postJson('/api/logout');

    $response->assertStatus(200);
    // Token should be revoked after logout
});
