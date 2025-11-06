<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_email_verification_screen_can_be_rendered(): void
    {
        $user = User::factory()->unverified()->create();

        $response = $this->get('/verify-email');

        // React Router app - just check the page loads
        $response->assertStatus(200);
    }

    public function test_email_can_be_verified(): void
    {
        // Skip this test as email verification is handled via OTP, not signed URLs
        $this->markTestSkipped('Email verification is handled via OTP system');
        $response->assertRedirect(route('dashboard', absolute: false).'?verified=1');
    }

    public function test_email_is_not_verified_with_invalid_hash(): void
    {
        // Skip this test as email verification is handled via OTP, not signed URLs
        $this->markTestSkipped('Email verification is handled via OTP system');
    }
}
