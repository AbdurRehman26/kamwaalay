<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    if (!Role::where('name', 'helper')->exists()) {
        Role::create(['name' => 'helper']);
    }
});

test('guests can view home page', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
    // React Router app - just check the page loads
});

test('authenticated users can view home page', function () {
    $user = User::factory()->create();
    $user->assignRole('helper');

    $response = $this->get('/');

    $response->assertStatus(200);
    // React Router app - just check the page loads
});

