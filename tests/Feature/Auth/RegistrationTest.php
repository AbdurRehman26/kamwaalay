<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Create roles if they don't exist
    if (!Role::where('name', 'user')->exists()) {
        Role::create(['name' => 'user']);
    }
    if (!Role::where('name', 'helper')->exists()) {
        Role::create(['name' => 'helper']);
    }
    if (!Role::where('name', 'business')->exists()) {
        Role::create(['name' => 'business']);
    }
});

test('users can register with phone number', function () {
    $response = $this->postJson('/api/register', [
        'name' => 'Test User',
        'phone' => '03001234567',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => 'user',
    ]);
    // User gets JSON response with verification info, not logged in yet
    $response->assertStatus(200)
        ->assertJsonStructure(['message', 'verification_method', 'identifier']);
    $this->assertGuest(); // User should NOT be logged in until OTP is verified
    // Phone number is formatted to include country code
    $this->assertDatabaseHas('users', [
        'phone' => '+923001234567',
        'name' => 'Test User',
    ]);
});

test('users cannot register without email or phone', function () {
    $response = $this->postJson('/api/register', [
        'name' => 'Test User',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => 'user',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email', 'phone']);
});

test('users cannot register with duplicate email', function () {
    User::factory()->create(['email' => 'test@example.com']);

    $response = $this->postJson('/api/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => 'user',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

test('password must be confirmed', function () {
    $response = $this->postJson('/api/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'different-password',
        'role' => 'user',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['password']);
});

test('registered user is assigned the correct role', function () {
    $response = $this->postJson('/api/register', [
        'name' => 'Test Helper',
        'email' => 'helper@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'role' => 'helper',
    ]);

    $response->assertStatus(200);
    $user = User::where('email', 'helper@example.com')->first();
    expect($user->hasRole('helper'))->toBeTrue();
});
