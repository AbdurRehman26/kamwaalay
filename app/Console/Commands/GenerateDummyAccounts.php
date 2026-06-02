<?php

namespace App\Console\Commands;

use App\Models\City;
use App\Models\Country;
use App\Models\JobPost;
use App\Models\Profile;
use App\Models\ServiceListing;
use App\Models\ServiceType;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class GenerateDummyAccounts extends Command
{
    protected $signature = 'demo:generate-accounts
        {--helpers=12 : Number of helper accounts to generate}
        {--users=8 : Number of customer user accounts to generate}
        {--services=2 : Service listings to generate per helper}
        {--jobs=2 : Job posts to generate per user}
        {--reset : Delete existing system-generated users, profiles, service listings, and jobs first}';

    protected $description = 'Generate system-generated dummy users, helpers, service listings, and job posts.';

    private array $serviceTypes = [
        ['slug' => 'maid', 'name' => 'Maid'],
        ['slug' => 'cook', 'name' => 'Cook'],
        ['slug' => 'babysitter', 'name' => 'Babysitter'],
        ['slug' => 'caregiver', 'name' => 'Caregiver'],
        ['slug' => 'cleaner', 'name' => 'Cleaner'],
        ['slug' => 'domestic_helper', 'name' => 'Domestic Helper'],
        ['slug' => 'driver', 'name' => 'Driver'],
        ['slug' => 'security_guard', 'name' => 'Security Guard'],
    ];

    private array $locations = [
        ['area' => 'DHA Phase 5', 'latitude' => 24.8058, 'longitude' => 67.0359],
        ['area' => 'Clifton Block 2', 'latitude' => 24.8138, 'longitude' => 67.0305],
        ['area' => 'Gulshan-e-Iqbal', 'latitude' => 24.9176, 'longitude' => 67.0971],
        ['area' => 'PECHS Block 6', 'latitude' => 24.8639, 'longitude' => 67.0620],
        ['area' => 'North Nazimabad', 'latitude' => 24.9336, 'longitude' => 67.0423],
        ['area' => 'Bahadurabad', 'latitude' => 24.8844, 'longitude' => 67.0677],
    ];

    public function handle(): int
    {
        $helperCount = max(0, (int) $this->option('helpers'));
        $userCount = max(0, (int) $this->option('users'));
        $servicesPerHelper = max(0, (int) $this->option('services'));
        $jobsPerUser = max(0, (int) $this->option('jobs'));

        DB::transaction(function () use ($helperCount, $userCount, $servicesPerHelper, $jobsPerUser): void {
            if ($this->option('reset')) {
                $this->deleteSystemGeneratedData();
            }

            $city = $this->ensureCity();
            $serviceTypes = $this->ensureServiceTypes();
            $this->ensureRoles();

            $users = $this->generateUsers($userCount, $city);
            $helpers = $this->generateHelpers($helperCount, $city, $serviceTypes, $servicesPerHelper);
            $jobCount = $this->generateJobs($users, $helpers, $city, $serviceTypes, $jobsPerUser);
            $serviceCount = $helpers->count() * $servicesPerHelper;

            $this->components->info("Generated {$users->count()} users, {$helpers->count()} helpers, {$serviceCount} services, and {$jobCount} jobs.");
            $this->components->info('All generated records were marked as system generated.');
        });

        return self::SUCCESS;
    }

    private function deleteSystemGeneratedData(): void
    {
        JobPost::where('is_system_generated', true)->delete();
        ServiceListing::where('is_system_generated', true)->delete();
        Profile::where('is_system_generated', true)->delete();
        User::where('is_system_generated', true)->delete();
    }

    private function ensureCity(): City
    {
        $country = Country::firstOrCreate(
            ['code' => 'PK'],
            ['name' => 'Pakistan', 'phone_code' => '+92', 'is_active' => true]
        );

        return City::firstOrCreate(
            ['name' => 'Karachi'],
            [
                'state' => 'Sindh',
                'country_id' => $country->id,
                'latitude' => 24.8607,
                'longitude' => 67.0011,
                'is_active' => true,
            ]
        );
    }

    private function ensureServiceTypes()
    {
        foreach ($this->serviceTypes as $index => $serviceType) {
            ServiceType::updateOrCreate(
                ['slug' => $serviceType['slug']],
                [
                    'name' => $serviceType['name'],
                    'sort_order' => $index + 1,
                    'is_active' => true,
                ]
            );
        }

        return ServiceType::whereIn('slug', array_column($this->serviceTypes, 'slug'))
            ->orderBy('sort_order')
            ->get();
    }

    private function ensureRoles(): void
    {
        Role::firstOrCreate(['name' => 'user']);
        Role::firstOrCreate(['name' => 'helper']);
    }

    private function generateUsers(int $count, City $city)
    {
        return collect(range(1, $count))->map(function (int $number) use ($city): User {
            $location = $this->locations[($number - 1) % count($this->locations)];
            $user = User::updateOrCreate(
                ['phone' => sprintf('+9231199%04d', $number)],
                [
                    'name' => "Demo Customer {$number}",
                    'password' => Hash::make('password'),
                    'address' => "House {$number}, {$location['area']}, Karachi",
                    'is_active' => true,
                    'is_system_generated' => true,
                    'phone_verified_at' => now(),
                    'profile_updated_at' => now(),
                ]
            );

            $user->syncRoles(['user']);
            $user->profile()->updateOrCreate(
                ['profileable_type' => User::class, 'profileable_id' => $user->id],
                [
                    'city_id' => $city->id,
                    'bio' => 'System generated customer account for demo service requests.',
                    'is_active' => true,
                    'is_system_generated' => true,
                    'pin_address' => "House {$number}, {$location['area']}, Karachi",
                    'pin_latitude' => $location['latitude'],
                    'pin_longitude' => $location['longitude'],
                ]
            );

            return $user;
        });
    }

    private function generateHelpers(int $count, City $city, $serviceTypes, int $servicesPerHelper)
    {
        $genders = ['female', 'male'];
        $religions = ['sunni_nazar_niyaz', 'sunni_no_nazar_niyaz', 'shia', 'christian'];

        return collect(range(1, $count))->map(function (int $number) use ($city, $serviceTypes, $servicesPerHelper, $genders, $religions): User {
            $location = $this->locations[($number - 1) % count($this->locations)];
            $primaryServiceType = $serviceTypes[($number - 1) % $serviceTypes->count()];

            $helper = User::updateOrCreate(
                ['phone' => sprintf('+9231299%04d', $number)],
                [
                    'name' => "Demo Helper {$number}",
                    'password' => Hash::make('password'),
                    'address' => "Street {$number}, {$location['area']}, Karachi",
                    'is_active' => true,
                    'is_system_generated' => true,
                    'phone_verified_at' => now(),
                    'profile_updated_at' => now(),
                ]
            );

            $helper->syncRoles(['helper']);
            $profile = $helper->profile()->updateOrCreate(
                ['profileable_type' => User::class, 'profileable_id' => $helper->id],
                [
                    'age' => 24 + ($number % 28),
                    'gender' => $genders[$number % count($genders)],
                    'religion' => $religions[$number % count($religions)],
                    'experience_years' => 1 + ($number % 12),
                    'city_id' => $city->id,
                    'availability' => $number % 2 === 0 ? 'full_time' : 'part_time',
                    'bio' => "System generated {$primaryServiceType->name} helper available in {$location['area']}.",
                    'verification_status' => 'verified',
                    'police_verified' => true,
                    'is_active' => true,
                    'is_system_generated' => true,
                    'rating' => 0,
                    'total_reviews' => 0,
                    'pin_address' => "Street {$number}, {$location['area']}, Karachi",
                    'pin_latitude' => $location['latitude'],
                    'pin_longitude' => $location['longitude'],
                ]
            );

            for ($serviceNumber = 1; $serviceNumber <= $servicesPerHelper; $serviceNumber++) {
                $serviceType = $serviceTypes[($number + $serviceNumber - 2) % $serviceTypes->count()];
                $listing = ServiceListing::updateOrCreate(
                    [
                        'profile_id' => $profile->id,
                        'description' => "System generated {$serviceType->name} listing {$serviceNumber} for {$helper->name}.",
                    ],
                    [
                        'work_type' => $serviceNumber % 2 === 0 ? 'part_time' : 'full_time',
                        'monthly_rate' => 14000 + (($number + $serviceNumber) * 750),
                        'is_active' => true,
                        'status' => 'active',
                        'is_system_generated' => true,
                    ]
                );
                $listing->serviceTypes()->sync([$serviceType->id]);
            }

            return $helper;
        });
    }

    private function generateJobs($users, $helpers, City $city, $serviceTypes, int $jobsPerUser): int
    {
        $created = 0;
        $statuses = ['pending', 'confirmed', 'in_progress'];

        foreach ($users as $userIndex => $user) {
            for ($jobNumber = 1; $jobNumber <= $jobsPerUser; $jobNumber++) {
                $serviceType = $serviceTypes[($userIndex + $jobNumber - 1) % $serviceTypes->count()];
                $location = $this->locations[($userIndex + $jobNumber - 1) % count($this->locations)];
                $assignedHelper = $helpers->isNotEmpty() && $jobNumber % 3 === 0
                    ? $helpers[($userIndex + $jobNumber - 1) % $helpers->count()]
                    : null;

                JobPost::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'service_type_id' => $serviceType->id,
                        'name' => $user->name,
                        'phone' => $user->phone,
                        'start_date' => now()->addDays($jobNumber + 1)->toDateString(),
                    ],
                    [
                        'assigned_user_id' => $assignedHelper?->id,
                        'city_id' => $city->id,
                        'work_type' => $jobNumber % 2 === 0 ? 'part_time' : 'full_time',
                        'start_time' => sprintf('%02d:00', 8 + ($jobNumber % 8)),
                        'address' => "House {$jobNumber}, {$location['area']}, Karachi",
                        'latitude' => $location['latitude'],
                        'longitude' => $location['longitude'],
                        'special_requirements' => "System generated request for {$serviceType->name} help.",
                        'estimated_salary' => 15000 + ($jobNumber * 1000),
                        'status' => $statuses[($userIndex + $jobNumber) % count($statuses)],
                        'admin_notes' => 'System generated demo job.',
                        'is_system_generated' => true,
                    ]
                );
                $created++;
            }
        }

        return $created;
    }
}
