<?php

namespace Tests\Feature\Pages;

use App\Models\City;
use App\Models\Location;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LocationSelectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_fetch_cities()
    {
        // Create cities
        $city1 = City::factory()->create(['name' => 'City A', 'is_active' => true]);
        $city2 = City::factory()->create(['name' => 'City B', 'is_active' => true]);

        // Create main locations for whole city
        Location::factory()->create(['city_id' => $city1->id, 'area' => null]);
        
        $response = $this->getJson('/api/cities');

        $response->assertStatus(200)
            ->assertJsonCount(2)
            ->assertJsonFragment(['name' => 'City A'])
            ->assertJsonFragment(['name' => 'City B']);
            
        // Check structure
        $response->assertJsonStructure([
            '*' => ['id', 'name', 'code', 'main_location_id']
        ]);
        
        // Check main_location_id correctness
        $cityAData = collect($response->json())->firstWhere('id', $city1->id);
        $this->assertNotNull($cityAData['main_location_id']);
        
        $cityBData = collect($response->json())->firstWhere('id', $city2->id);
        $this->assertNull($cityBData['main_location_id']);
    }

    public function test_search_locations_filtered_by_city()
    {
        $city1 = City::factory()->create(['name' => 'Islamabad']);
        $city2 = City::factory()->create(['name' => 'Karachi']);

        Location::factory()->create(['city_id' => $city1->id, 'area' => 'F-6 Markaz', 'is_active' => true]);
        Location::factory()->create(['city_id' => $city1->id, 'area' => 'F-7 Markaz', 'is_active' => true]);
        Location::factory()->create(['city_id' => $city1->id, 'area' => 'Blue Area', 'is_active' => true]);
        
        // Same area name but in diff city
        Location::factory()->create(['city_id' => $city2->id, 'area' => 'Blue Area', 'is_active' => true]);

        // Search for "Blue" in Islamabad
        $response = $this->getJson('/api/locations/search?q=Blue&city_id=' . $city1->id);

        $response->assertStatus(200);
        $this->assertEquals(1, count($response->json()));
        $this->assertEquals('Blue Area', $response->json()[0]['area']);
        $this->assertEquals($city1->id, $response->json()[0]['city_id']);

        // Search for "Blue" in Karachi
        $responseKarachi = $this->getJson('/api/locations/search?q=Blue&city_id=' . $city2->id);
        $responseKarachi->assertStatus(200);
        $this->assertEquals(1, count($responseKarachi->json()));
        $this->assertEquals('Blue Area', $responseKarachi->json()[0]['area']);
        $this->assertEquals($city2->id, $responseKarachi->json()[0]['city_id']);
        
    }
}
