<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class TestLoginTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Seed roles
        \Artisan::call('db:seed', ['--class' => 'RolePermissionSeeder']);
    }

    public function test_dummy_login_skipped_in_production_mode()
    {
        Config::set('app.debug', false);

        // In production, this should fall back to regular login flow (sending OTP)
        // or fail if user doesn't exist
        $response = $this->postJson('/api/login', [
            'phone' => '+929876543212',
        ]);

        // Should NOT return the direct login success structure with token immediately
        $response->assertJsonMissing(['message' => 'Logged in as test user']);
    }

    public function test_login_as_test_user_works_in_debug_mode()
    {
        Config::set('app.debug', true);
        
        // Create a test user with role
        $role = 'user';
        $user = User::factory()->create();
        $user->assignRole($role);
        
        $response = $this->postJson('/api/login', [
            'phone' => '9876543212', // Dummy number for user
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => "Logged in as test {$role}",
            ])
            ->assertJsonStructure([
                'user',
                'token',
            ]);
            
        // Use the token to verify access
        $token = $response->json('token');
        $this->withToken($token)->getJson('/api/user')
            ->assertStatus(200)
            ->assertJson([
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                ]
            ]);
    }

    public function test_login_as_test_business_works_in_debug_mode()
    {
        Config::set('app.debug', true);
        
        $role = 'business';
        $user = User::factory()->create();
        $user->assignRole($role);
        
        $response = $this->postJson('/api/login', [
            'phone' => '9876543210', // Dummy number for business
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => "Logged in as test {$role}",
            ]);
    }
    
    public function test_strictly_ignores_users_with_multiple_roles()
    {
        Config::set('app.debug', true);
        
        $role = 'business';
        
        // Create a user with both 'business' and 'user' roles
        $multiRoleUser = User::factory()->create(['phone' => '03000000001']);
        $multiRoleUser->assignRole('business');
        $multiRoleUser->assignRole('user');
        
        // Create a user with ONLY 'business' role
        $singleRoleUser = User::factory()->create(['phone' => '03000000002']);
        $singleRoleUser->assignRole('business');
        
        $response = $this->postJson('/api/login', [
            'phone' => '9876543210', // Dummy number for business
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => "Logged in as test {$role}",
            ]);
            
        // Assert that the logged-in user is strictly the single-role user, NOT the multi-role user
        $this->assertEquals($singleRoleUser->id, $response->json('user.id'));
    }
    
    public function test_fails_if_only_multi_role_users_exist()
    {
        Config::set('app.debug', true);
        
        $role = 'business';
        
        // Create a user with both 'business' and 'user' roles, but NO single-role business user
        $multiRoleUser = User::factory()->create();
        $multiRoleUser->assignRole('business');
        $multiRoleUser->assignRole('user');
        
        $response = $this->postJson('/api/login', [
            'phone' => '9876543210', // Dummy number for business
        ]);

        // Should return 404 because strict check fails
        $response->assertStatus(404)
             ->assertJson([
                'message' => "No test user found with role: {$role}. Please seed the database.",
            ]);
    }
    
    public function test_fails_if_no_user_with_role_exists()
    {
        Config::set('app.debug', true);
        
        // Don't create any users

        $response = $this->postJson('/api/login', [
            'phone' => '9876543210', // Business dummy number
        ]);

        $response->assertStatus(404);
    }
}
