<?php

use App\Models\User;
use App\Models\JobPost;
use App\Models\JobApplication;
use App\Models\ServiceListing;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    if (!Role::where('name', 'helper')->exists()) {
        Role::create(['name' => 'helper']);
    }
    if (!Role::where('name', 'business')->exists()) {
        Role::create(['name' => 'business']);
    }
    if (!Role::where('name', 'user')->exists()) {
        Role::create(['name' => 'user']);
    }
    if (!Role::where('name', 'admin')->exists()) {
        Role::create(['name' => 'admin']);
    }
});

test('helpers can view available job applications', function () {
    $helper = User::factory()->create();
    $helper->assignRole('helper');

    // Helper needs to complete onboarding (have service listings)
    $profile = $helper->profile()->create([]);
    ServiceListing::factory()->create([
        'profile_id' => $profile->id,
    ]);

    $jobPost = JobPost::factory()->create([
        'status' => 'pending',
        'assigned_user_id' => null,
    ]);
    
    $token = $helper->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->getJson('/api/job-applications');

    $response->assertStatus(200);
    $response->assertJsonStructure(['job_posts']);
});

test('helpers can apply to a service request', function () {
    $helper = User::factory()->create();
    $helper->assignRole('helper');

    // Helper needs to complete onboarding (have service listings)
    $profile = $helper->profile()->create([]);
    ServiceListing::factory()->create([
        'profile_id' => $profile->id,
    ]);

    $user = User::factory()->create();
    $user->assignRole('user');

    $jobPost = JobPost::factory()->create([
        'user_id' => $user->id,
        'status' => 'pending',
    ]);
    
    $token = $helper->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->postJson("/api/job-posts/{$jobPost->id}/apply", [
        'message' => 'I am interested in this job',
        'proposed_rate' => 15000,
    ]);

    $response->assertStatus(200);
    $this->assertDatabaseHas('job_applications', [
        'job_post_id' => $jobPost->id,
        'user_id' => $helper->id,
        'status' => 'pending',
    ]);
});

test('helpers cannot apply twice to the same service request', function () {
    $helper = User::factory()->create();
    $helper->assignRole('helper');

    // Helper needs to complete onboarding (have service listings)
    $profile = $helper->profile()->create([]);
    ServiceListing::factory()->create([
        'profile_id' => $profile->id,
    ]);

    $user = User::factory()->create();
    $user->assignRole('user');

    $jobPost = JobPost::factory()->create([
        'user_id' => $user->id,
        'status' => 'pending',
    ]);

    JobApplication::create([
        'job_post_id' => $jobPost->id,
        'user_id' => $helper->id,
        'status' => 'pending',
    ]);
    
    $token = $helper->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->postJson("/api/job-posts/{$jobPost->id}/apply", [
        'message' => 'I am interested',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['application']);
});

test('users can accept a job application', function () {
    $user = User::factory()->create();
    $user->assignRole('user');

    $helper = User::factory()->create();
    $helper->assignRole('helper');

    $jobPost = JobPost::factory()->create([
        'user_id' => $user->id,
        'status' => 'pending',
    ]);

    $application = JobApplication::create([
        'job_post_id' => $jobPost->id,
        'user_id' => $helper->id,
        'status' => 'pending',
    ]);
    
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->postJson("/api/job-applications/{$application->id}/accept");

    $response->assertStatus(200);
    $application->refresh();
    expect($application->status)->toBe('accepted');
    $jobPost->refresh();
    expect($jobPost->status)->toBe('confirmed');
    expect($jobPost->assigned_user_id)->toBe($helper->id);
});

test('accepting an application rejects other applications', function () {
    $user = User::factory()->create();
    $user->assignRole('user');

    $helper1 = User::factory()->create();
    $helper1->assignRole('helper');
    $helper2 = User::factory()->create();
    $helper2->assignRole('helper');

    $jobPost = JobPost::factory()->create([
        'user_id' => $user->id,
        'status' => 'pending',
    ]);

    $application1 = JobApplication::create([
        'job_post_id' => $jobPost->id,
        'user_id' => $helper1->id,
        'status' => 'pending',
    ]);

    $application2 = JobApplication::create([
        'job_post_id' => $jobPost->id,
        'user_id' => $helper2->id,
        'status' => 'pending',
    ]);
    
    $token = $user->createToken('test-token')->plainTextToken;

    $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->postJson("/api/job-applications/{$application1->id}/accept");

    $application2->refresh();
    expect($application2->status)->toBe('rejected');
});

test('users can reject a job application', function () {
    $user = User::factory()->create();
    $user->assignRole('user');

    $helper = User::factory()->create();
    $helper->assignRole('helper');

    $jobPost = JobPost::factory()->create([
        'user_id' => $user->id,
        'status' => 'pending',
    ]);

    $application = JobApplication::create([
        'job_post_id' => $jobPost->id,
        'user_id' => $helper->id,
        'status' => 'pending',
    ]);
    
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->postJson("/api/job-applications/{$application->id}/reject");

    $response->assertStatus(200);
    $application->refresh();
    expect($application->status)->toBe('rejected');
});

test('helpers can withdraw their application', function () {
    $helper = User::factory()->create();
    $helper->assignRole('helper');

    $user = User::factory()->create();
    $user->assignRole('user');

    $jobPost = JobPost::factory()->create([
        'user_id' => $user->id,
        'status' => 'pending',
    ]);

    $application = JobApplication::create([
        'job_post_id' => $jobPost->id,
        'user_id' => $helper->id,
        'status' => 'pending',
    ]);
    
    $token = $helper->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->postJson("/api/job-applications/{$application->id}/withdraw");

    $response->assertStatus(200);
    $application->refresh();
    expect($application->status)->toBe('withdrawn');
});

test('helpers can view their applications', function () {
    $helper = User::factory()->create();
    $helper->assignRole('helper');

    $user = User::factory()->create();
    $user->assignRole('user');

    $jobPost = JobPost::factory()->create([
        'user_id' => $user->id,
    ]);

    JobApplication::create([
        'job_post_id' => $jobPost->id,
        'user_id' => $helper->id,
        'status' => 'pending',
    ]);
    
    $token = $helper->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->getJson('/api/my-applications');

    $response->assertStatus(200);
    $response->assertJsonStructure(['applications']);
});

test('users can view applications for their service requests', function () {
    $user = User::factory()->create();
    $user->assignRole('user');

    $helper = User::factory()->create();
    $helper->assignRole('helper');

    $jobPost = JobPost::factory()->create([
        'user_id' => $user->id,
    ]);

    JobApplication::create([
        'job_post_id' => $jobPost->id,
        'user_id' => $helper->id,
        'status' => 'pending',
    ]);
    
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->getJson('/api/my-request-applications');

    $response->assertStatus(200);
    $response->assertJsonStructure(['applications']);
});

test('only booking owner can accept applications', function () {
    $user1 = User::factory()->create();
    $user1->assignRole('user');
    $user2 = User::factory()->create();
    $user2->assignRole('user');

    $helper = User::factory()->create();
    $helper->assignRole('helper');

    $jobPost = JobPost::factory()->create([
        'user_id' => $user1->id,
    ]);

    $application = JobApplication::create([
        'job_post_id' => $jobPost->id,
        'user_id' => $helper->id,
        'status' => 'pending',
    ]);
    
    $token = $user2->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->postJson("/api/job-applications/{$application->id}/accept");

    $response->assertStatus(403);
});

test('only applicant can withdraw application', function () {
    $helper1 = User::factory()->create();
    $helper1->assignRole('helper');
    $helper2 = User::factory()->create();
    $helper2->assignRole('helper');

    $user = User::factory()->create();
    $user->assignRole('user');

    $jobPost = JobPost::factory()->create([
        'user_id' => $user->id,
    ]);

    $application = JobApplication::create([
        'job_post_id' => $jobPost->id,
        'user_id' => $helper1->id,
        'status' => 'pending',
    ]);
    
    $token = $helper2->createToken('test-token')->plainTextToken;

    $response = $this->withHeaders([
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'application/json',
    ])->postJson("/api/job-applications/{$application->id}/withdraw");

    $response->assertStatus(403);
});

