<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    if (!Role::where('name', 'user')->exists()) {
        Role::create(['name' => 'user']);
    }
});

test('users can view their profile', function () {
    $user = User::factory()->create();
    $user->assignRole('user');
    
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->getJson('/api/profile');

    $response->assertStatus(200);
    $response->assertJsonStructure(['user']);
});

test('users can update their profile', function () {
    $user = User::factory()->create([
        'name' => 'Old Name',
        'email' => 'old@example.com',
    ]);
    $user->assignRole('user');
    
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->patchJson('/api/profile', [
        'name' => 'New Name',
        'email' => 'new@example.com',
    ]);

    $response->assertStatus(200);
    $user->refresh();
    expect($user->name)->toBe('New Name');
    expect($user->email)->toBe('new@example.com');
});

test('users can delete their account', function () {
    $user = User::factory()->create([
        'password' => bcrypt('password123'),
    ]);
    $user->assignRole('user');
    
    $token = $user->createToken('test-token')->plainTextToken;

    $userId = $user->id;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->deleteJson('/api/profile', [
        'password' => 'password123',
    ]);

    $response->assertStatus(200);
    $this->assertDatabaseMissing('users', [
        'id' => $userId,
    ]);
});

test('users must provide correct password to delete account', function () {
    $user = User::factory()->create([
        'password' => bcrypt('password123'),
    ]);
    $user->assignRole('user');
    
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->deleteJson('/api/profile', [
        'password' => 'wrong-password',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['password']);
    $this->assertDatabaseHas('users', [
        'id' => $user->id,
    ]);
});

test('email verification is reset when email is changed', function () {
    $user = User::factory()->create([
        'email' => 'old@example.com',
        'email_verified_at' => now(),
    ]);
    $user->assignRole('user');
    
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->patchJson('/api/profile', [
        'name' => $user->name,
        'email' => 'new@example.com',
    ]);

    $response->assertStatus(200);
    $user->refresh();
    expect($user->email_verified_at)->toBeNull();
});

