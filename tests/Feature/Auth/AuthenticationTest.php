<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('users can authenticate using phone number', function () {
    $user = User::factory()->create([
        'phone' => '03001234567',
        'password' => bcrypt('password'),
        'phone_verified_at' => now(),
    ]);

    $response = $this->postJson('/api/login', [
        'phone' => '03001234567',
        'password' => 'password',
    ]);

    $response->assertStatus(200);
    $response->assertJsonStructure(['message', 'user', 'token']);
});

test('users cannot authenticate with invalid password', function () {
    $user = User::factory()->create([
        'phone' => '03001234567',
        'password' => bcrypt('password'),
    ]);

    $response = $this->postJson('/api/login', [
        'phone' => '03001234567',
        'password' => 'wrong-password',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['phone']);
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
