<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
        ])->getJson('/api/profile');

        $response->assertOk();
    }

    public function test_profile_information_can_be_updated(): void
    {
        $user = User::factory()->create([
            'email' => 'original@example.com',
        ]);
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
        ])->patchJson('/api/profile', [
            'name' => 'Test User',
        ]);

        $response->assertStatus(200);

        $user->refresh();

        $this->assertSame('Test User', $user->name);
        // Email should remain unchanged as it's no longer part of profile updates
        $this->assertSame('original@example.com', $user->email);
    }

    public function test_email_verification_status_is_unchanged_when_profile_is_updated(): void
    {
        $user = User::factory()->create([
            'verified_at' => now(),
        ]);
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
        ])->patchJson('/api/profile', [
            'name' => 'Test User',
        ]);

        $response->assertStatus(200);

        // Email verification should remain unchanged as email is not part of profile updates
        $this->assertNotNull($user->refresh()->verified_at);
    }

    public function test_user_can_delete_their_account(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('password'),
        ]);
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
        ])->deleteJson('/api/profile', [
            'password' => 'password',
        ]);

        $response->assertStatus(200);
        $this->assertNull($user->fresh());
    }

    public function test_correct_password_must_be_provided_to_delete_account(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('password'),
        ]);
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
        ])->deleteJson('/api/profile', [
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);

        $this->assertNotNull($user->fresh());
    }
}
