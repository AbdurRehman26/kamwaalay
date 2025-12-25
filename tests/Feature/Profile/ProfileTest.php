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
    ]);
    $user->assignRole('user');
    
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->patchJson('/api/profile', [
        'name' => 'New Name',
    ]);

    $response->assertStatus(200);
    $user->refresh();
    expect($user->name)->toBe('New Name');
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

test('email verification is not reset when profile is updated', function () {
    $user = User::factory()->create([
        'phone_verified_at' => now(),
    ]);
    $user->assignRole('user');
    
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->patchJson('/api/profile', [
        'name' => 'Updated Name',
    ]);

    $response->assertStatus(200);
    $user->refresh();
    $user->refresh();
    expect($user->phone_verified_at)->not->toBeNull();
});

