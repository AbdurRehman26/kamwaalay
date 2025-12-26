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

    public function test_business_can_complete_onboarding_by_adding_worker()
    {
        Storage::fake('public');

        // Create a business user
        $business = User::factory()->create();
        $business->assignRole('business');

        $this->actingAs($business);

        $language = \App\Models\Language::firstOrCreate(['code' => 'en'], ['name' => 'English', 'native_name' => 'English', 'is_active' => true]);

        // Prepare payload (Worker Data + Business Verification)
        $payload = [
            'name' => 'John Worker',
            'phone' => '03001234567',
            'experience_years' => 5,
            'availability' => 'full_time',
            'bio' => 'Experienced driver',
            'service_types' => json_encode(['driver']), // JSON string as per frontend
            'languages' => [$language->id],
            
            // Location (Pin Address)
            'pin_address' => 'Clifton, Karachi',
            'pin_latitude' => 24.8607,
            'pin_longitude' => 67.0011,
            'nic_number' => '42101-1234567-1',
            'nic' => UploadedFile::fake()->image('nic.jpg'),
        ];

        $response = $this->postJson('/api/onboarding/business', $payload);

        $response->assertStatus(200)
            ->assertJson(['message' => 'Welcome! Your business profile has been set up and your first worker added.']);

        // Assert Business Verification (NIC)
        $this->assertDatabaseHas('documents', [
            'user_id' => $business->id,
            'document_type' => 'nic',
            'document_number' => '42101-1234567-1',
        ]);

        // Assert Worker Created
        $this->assertDatabaseHas('users', [
            'name' => 'John Worker',
            'phone' => '03001234567',
        ]);

        $worker = User::where('phone', '03001234567')->first();
        $this->assertNotNull($worker);
        $this->assertTrue($worker->hasRole('helper'));

        // Assert Worker Linked to Business
        $this->assertTrue($business->helpers->contains($worker));

        // Assert Worker Profile
        // Assert Worker Profile
        $city = City::where('name', 'Karachi')->first();
        $this->assertDatabaseHas('profiles', [
            'profileable_id' => $worker->id,
            'city_id' => $city->id,
        ]);

        // Assert Service Listing Created
        $this->assertDatabaseHas('service_listings', [
            'description' => 'Experienced driver',
            'work_type' => 'full_time',
            'pin_address' => 'Clifton, Karachi',
        ]);
        
        // Assert Service Listing Service Types
        $listing = \App\Models\ServiceListing::where('description', 'Experienced driver')->first();
        $this->assertTrue($listing->serviceTypes->contains('slug', 'driver'));

        // Assert Business Has Completed Onboarding
        $this->assertTrue($business->fresh()->hasCompletedOnboarding());
    }


}
