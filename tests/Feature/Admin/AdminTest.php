<?php

use App\Models\User;
use App\Models\JobPost;
use App\Models\Document;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    if (!Role::where('name', 'admin')->exists()) {
        Role::create(['name' => 'admin']);
    }
    if (!Role::where('name', 'helper')->exists()) {
        Role::create(['name' => 'helper']);
    }
    if (!Role::where('name', 'user')->exists()) {
        Role::create(['name' => 'user']);
    }
});

function createAdmin(): User
{
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    return $admin;
}

test('admins can view admin dashboard', function () {
    $admin = createAdmin();
    
    $token = $admin->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->getJson('/api/admin/dashboard');

    $response->assertStatus(200);
    $response->assertJsonStructure(['stats']);
});

test('non-admins cannot access admin dashboard', function () {
    $user = User::factory()->create();
    $user->assignRole('user');
    
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->getJson('/api/admin/dashboard');

    $response->assertStatus(403);
});

test('admins can view helpers list', function () {
    $admin = createAdmin();

    User::factory()->count(3)->create()->each(function ($user) {
        $user->assignRole('helper');
    });
    
    $token = $admin->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->getJson('/api/admin/helpers');

    $response->assertStatus(200);
    $response->assertJsonStructure(['helpers']);
});

test('admins can update helper verification status', function () {
    $admin = createAdmin();

    $helper = User::factory()->create();
    $helper->assignRole('helper');
    $helper->profile()->create([
        'verification_status' => 'pending',
        'is_active' => true,
    ]);
    
    $token = $admin->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->patchJson("/api/admin/helpers/{$helper->id}/status", [
        'verification_status' => 'verified',
        'is_active' => true,
    ]);

    $response->assertStatus(200);
    $helper->refresh();
    $helper->load('profile');
    expect($helper->profile->verification_status)->toBe('verified');
    expect($helper->profile->is_active)->toBeTrue();
});

test('admins can view bookings list', function () {
    $admin = createAdmin();

    JobPost::factory()->count(3)->create();
    
    $token = $admin->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->getJson('/api/admin/job-posts');

    $response->assertStatus(200);
    $response->assertJsonStructure(['bookings']);
});

test('admins can filter bookings by status', function () {
    $admin = createAdmin();

    JobPost::factory()->create(['status' => 'pending']);
    JobPost::factory()->create(['status' => 'confirmed']);
    
    $token = $admin->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->getJson('/api/admin/job-posts?status=pending');

    $response->assertStatus(200);
    $response->assertJsonStructure(['bookings']);
});

test('admins can view documents list', function () {
    $admin = createAdmin();

    $helper = User::factory()->create();
    $helper->assignRole('helper');
    
    $profile = $helper->profile()->create([]);

    Document::factory()->count(3)->create([
        'user_id' => $helper->id,
    ]);
    
    $token = $admin->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->getJson('/api/admin/documents');

    $response->assertStatus(200);
    $response->assertJsonStructure(['documents']);
});

test('admins can update document status', function () {
    $admin = createAdmin();

    $helper = User::factory()->create();
    $helper->assignRole('helper');
    
    $profile = $helper->profile()->create([]);

    $document = Document::factory()->create([
        'user_id' => $helper->id,
        'status' => 'pending',
    ]);
    
    $token = $admin->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->patchJson("/api/admin/documents/{$document->id}/status", [
        'status' => 'verified',
        'admin_notes' => 'All documents verified',
    ]);

    $response->assertStatus(200);
    $document->refresh();
    expect($document->status)->toBe('verified');
});

test('admin dashboard shows correct statistics', function () {
    $admin = createAdmin();

    $helper = User::factory()->create();
    $helper->assignRole('helper');
    $helper->profile()->create([
        'verification_status' => 'verified',
        'is_active' => true,
    ]);

    $pendingHelper = User::factory()->create();
    $pendingHelper->assignRole('helper');
    $pendingHelper->profile()->create([
        'verification_status' => 'pending',
        'is_active' => true,
    ]);

    JobPost::factory()->create(['status' => 'pending']);
    JobPost::factory()->create(['status' => 'confirmed']);
    
    $token = $admin->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->getJson('/api/admin/dashboard');

    $response->assertStatus(200);
    $response->assertJsonStructure(['stats']);
    $response->assertJsonPath('stats.total_helpers', 2);
    $response->assertJsonPath('stats.verified_helpers', 1);
    $response->assertJsonPath('stats.pending_helpers', 1);
    $response->assertJsonPath('stats.total_bookings', 2);
    $response->assertJsonPath('stats.pending_bookings', 1);
    $response->assertJsonPath('stats.confirmed_bookings', 1);
});

