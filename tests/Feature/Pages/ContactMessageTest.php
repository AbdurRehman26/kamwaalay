<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('guests can submit contact messages', function () {
    $response = $this
        ->withHeaders([
            'User-Agent' => 'KamwaalayTest/1.0',
            'Accept' => 'application/json',
        ])
        ->postJson('/api/contact', [
            'name' => 'Ayesha Siddiqui',
            'phone' => '3001234567',
            'message' => 'I would like help finding a verified babysitter in Clifton.',
        ]);

    $response
        ->assertOk()
        ->assertJson([
            'message' => 'Thank you for contacting us. We\'ll get back to you soon.',
        ]);

    $this->assertDatabaseHas('contact_messages', [
        'name' => 'Ayesha Siddiqui',
        'phone' => '3001234567',
        'message' => 'I would like help finding a verified babysitter in Clifton.',
        'user_agent' => 'KamwaalayTest/1.0',
        'is_read' => false,
    ]);
});

test('authenticated users contact messages are linked to their account', function () {
    $user = User::factory()->create();
    $token = $user->createToken('contact-test')->plainTextToken;

    $response = $this
        ->withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
        ])
        ->postJson('/api/contact', [
            'name' => $user->name,
            'phone' => '3012345678',
            'message' => 'Please contact me about agency worker availability.',
        ]);

    $response->assertOk();

    $this->assertDatabaseHas('contact_messages', [
        'user_id' => $user->id,
        'name' => $user->name,
        'phone' => '3012345678',
    ]);
});

test('contact messages require name and message', function () {
    $response = $this->postJson('/api/contact', []);

    $response
        ->assertStatus(422)
        ->assertJsonValidationErrors(['name', 'message']);
});
