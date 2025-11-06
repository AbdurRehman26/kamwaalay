<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Spatie\Permission\Models\Role;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        // Ensure roles exist for the home page query
        if (!Role::where('name', 'helper')->exists()) {
            Role::create(['name' => 'helper']);
        }
        
        $response = $this->get('/');

        $response->assertStatus(200);
    }
}
