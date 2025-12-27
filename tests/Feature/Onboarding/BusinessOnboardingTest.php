<?php

namespace Tests\Feature\Onboarding;

use App\Models\City;
use Spatie\Permission\Models\Role;
use App\Models\ServiceType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BusinessOnboardingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create Roles
        if (!Role::where('name', 'business')->exists()) {
             Role::create(['name' => 'business', 'guard_name' => 'web']);
        }
        if (!Role::where('name', 'helper')->exists()) {
             Role::create(['name' => 'helper', 'guard_name' => 'web']);
        }

        // Create Service Types
        if (!ServiceType::where('slug', 'maid')->exists()) {
            ServiceType::create(['name' => 'Maid', 'slug' => 'maid']);
        }
        if (!ServiceType::where('slug', 'driver')->exists()) {
            ServiceType::create(['name' => 'Driver', 'slug' => 'driver']);
        }

        // Create Country
        if (!\App\Models\Country::where('id', 1)->exists()) {
             \App\Models\Country::create([
                'id' => 1,
                'name' => 'Pakistan',
                'code' => 'PK',
                'phone_code' => '+92',
                'is_active' => true,
             ]);
        }

        // Create Cities
        if (!City::where('slug', 'karachi')->exists()) {
            City::create([
                'country_id' => 1,
                'name' => 'Karachi', 
                'slug' => 'karachi', 
                'latitude' => 24.8607, 
                'longitude' => 67.0011
            ]);
        }
    }

    public function test_business_can_complete_onboarding_by_uploading_nic()
    {
        Storage::fake('public');

        // Create a business user
        $business = User::factory()->create();
        $business->assignRole('business');

        $this->actingAs($business);

        // Prepare payload (only NIC document and number required now)
        $payload = [
            'nic_number' => '42101-1234567-1',
            'nic' => UploadedFile::fake()->image('nic.jpg'),
        ];

        $response = $this->postJson('/api/onboarding/business', $payload);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Welcome! Your business verification has been submitted. You can now add workers to your profile.']);

        // Assert Business Verification (NIC)
        $this->assertDatabaseHas('documents', [
            'user_id' => $business->id,
            'document_type' => 'nic',
            'document_number' => '42101-1234567-1',
        ]);

        // Assert Business Has Completed Onboarding
        $this->assertTrue($business->fresh()->hasCompletedOnboarding());
    }

    public function test_business_onboarding_requires_nic_document()
    {
        Storage::fake('public');

        // Create a business user
        $business = User::factory()->create();
        $business->assignRole('business');

        $this->actingAs($business);

        // Payload without NIC document
        $payload = [
            'nic_number' => '42101-1234567-1',
        ];

        $response = $this->postJson('/api/onboarding/business', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nic']);
    }

    public function test_business_onboarding_requires_nic_number()
    {
        Storage::fake('public');

        // Create a business user
        $business = User::factory()->create();
        $business->assignRole('business');

        $this->actingAs($business);

        // Payload without NIC number
        $payload = [
            'nic' => UploadedFile::fake()->image('nic.jpg'),
        ];

        $response = $this->postJson('/api/onboarding/business', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nic_number']);
    }
}
