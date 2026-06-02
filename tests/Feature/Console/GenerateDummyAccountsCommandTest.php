<?php

use App\Models\JobPost;
use App\Models\Profile;
use App\Models\ServiceListing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('it generates system generated users helpers services and jobs', function () {
    $this->artisan('demo:generate-accounts', [
        '--helpers' => 2,
        '--users' => 3,
        '--services' => 2,
        '--jobs' => 2,
    ])->assertSuccessful();

    expect(User::where('is_system_generated', true)->count())->toBe(5)
        ->and(User::role('helper')->where('is_system_generated', true)->count())->toBe(2)
        ->and(User::role('user')->where('is_system_generated', true)->count())->toBe(3)
        ->and(Profile::where('is_system_generated', true)->count())->toBe(5)
        ->and(ServiceListing::where('is_system_generated', true)->count())->toBe(4)
        ->and(JobPost::where('is_system_generated', true)->count())->toBe(6);

    ServiceListing::where('is_system_generated', true)
        ->get()
        ->each(fn (ServiceListing $listing) => expect($listing->serviceTypes()->count())->toBe(1));
});

test('it can reset existing system generated data before generating', function () {
    $this->artisan('demo:generate-accounts', [
        '--helpers' => 2,
        '--users' => 2,
        '--services' => 1,
        '--jobs' => 1,
    ])->assertSuccessful();

    $this->artisan('demo:generate-accounts', [
        '--helpers' => 1,
        '--users' => 1,
        '--services' => 1,
        '--jobs' => 1,
        '--reset' => true,
    ])->assertSuccessful();

    expect(User::where('is_system_generated', true)->count())->toBe(2)
        ->and(ServiceListing::where('is_system_generated', true)->count())->toBe(1)
        ->and(JobPost::where('is_system_generated', true)->count())->toBe(1);
});
