<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Profile;
use App\Models\ServiceListing;
use App\Models\City;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DummyUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get Karachi city for service listings
        $karachi = City::where('name', 'Karachi')->first();

        // Regular Users (customers looking for help)
        $userRole = Role::where('name', 'user')->first();
        if ($userRole) {
            $users = [
                [
                    'name' => 'Ali Ahmed',
                    'password' => Hash::make('password'),
                    'role' => 'user',
                    'phone' => '03001234567',
                    'address' => 'House 123, Street 4, Karachi',
                    'profile' => [
                    ]
                ],
                [
                    'name' => 'Fatima Khan',
                    'password' => Hash::make('password'),
                    'role' => 'user',
                    'phone' => '03001234568',
                    'address' => 'Apartment 45, Block 2, Karachi',
                    'profile' => [
                    ]
                ],
                [
                    'name' => 'Hassan Raza',
                    'password' => Hash::make('password'),
                    'role' => 'user',
                    'phone' => '03001234569',
                    'address' => 'Villa 789, Phase 5, Karachi',
                    'profile' => [
                    ]
                ],
            ];

            foreach ($users as $userData) {
                $profileData = $userData['profile'] ?? [];
                unset($userData['profile']);

                // Remove 'role' from data array
                $role = $userData['role'];
                unset($userData['role']);

                $user = User::firstOrCreate(
                    ['phone' => $userData['phone']],
                    $userData
                );
                if (!$user->hasRole('user')) {
                    $user->assignRole('user');
                }

                // Create or update profile
                $user->profile()->updateOrCreate(
                    ['profileable_id' => $user->id, 'profileable_type' => User::class],
                    $profileData
                );

                $this->command->info("Created user: {$user->phone}");
            }
        }

        // Helpers (workers offering services)
        $helperRole = Role::where('name', 'helper')->first();
        if ($helperRole) {
            $helpers = [
                [
                    'name' => 'Ayesha Bibi',
                    'password' => Hash::make('password'),
                    'role' => 'helper',
                    'phone' => '03001234570',
                    'address' => 'Quarter 12, Workers Colony, Karachi',
                    'is_active' => true,
                    'profile' => [
                        'age' => 32,
                        'gender' => 'female',
                        'religion' => 'sunni_nazar_niyaz',
                        'experience_years' => 5,
                        'bio' => 'Experienced and reliable maid with 5 years of experience. Good with cleaning and household chores.',
                        'verification_status' => 'verified',
                        'police_verified' => true,
                        'is_active' => true,
                        'rating' => 4.8,
                        'total_reviews' => 12,
                    ],
                    'languages' => [1, 2], // English, Urdu
                    // Multiple service listings
                    'services' => [
                        ['service_type' => 'maid', 'work_type' => 'full_time', 'monthly_rate' => 15000, 'description' => 'Professional maid service'],
                        ['service_type' => 'cleaner', 'work_type' => 'part_time', 'monthly_rate' => 13500, 'description' => 'Deep cleaning services'],
                    ],
                ],
                [
                    'name' => 'Rashid Ali',
                    'password' => Hash::make('password'),
                    'role' => 'helper',
                    'phone' => '03001234571',
                    'address' => 'Street 5, Block A, Karachi',
                    'is_active' => true,
                    'profile' => [
                        'age' => 45,
                        'gender' => 'male',
                        'religion' => 'sunni_no_nazar_niyaz',

                        'experience_years' => 8,
                        'bio' => 'Professional cook specializing in Pakistani and continental dishes. Available for part-time cooking.',
                        'verification_status' => 'verified',
                        'police_verified' => true,
                        'is_active' => true,
                        'rating' => 4.9,
                        'total_reviews' => 25,
                    ],
                    'languages' => [1, 2, 3], // English, Urdu, Punjabi
                    // Multiple service listings
                    'services' => [
                        ['service_type' => 'cook', 'work_type' => 'part_time', 'monthly_rate' => 21000, 'description' => 'Pakistani and continental cuisine'],
                        ['service_type' => 'cook', 'work_type' => 'full_time', 'monthly_rate' => 24000, 'description' => 'Full-time cooking services'],
                    ],
                ],
                [
                    'name' => 'Saima Akhtar',
                    'password' => Hash::make('password'),
                    'role' => 'helper',
                    'phone' => '03001234572',
                    'address' => 'Flat 302, Building B, Karachi',
                    'is_active' => true,
                    'profile' => [
                        'age' => 28,
                        'gender' => 'female',
                        'religion' => 'sunni_nazar_niyaz',

                        'experience_years' => 3,
                        'bio' => 'Caring and patient babysitter with experience in childcare. Good with kids of all ages.',
                        'verification_status' => 'verified',
                        'police_verified' => true,
                        'is_active' => true,
                        'rating' => 4.7,
                        'total_reviews' => 8,
                    ],
                    'languages' => [1, 2], // English, Urdu
                    // Multiple service listings
                    'services' => [
                        ['service_type' => 'babysitter', 'work_type' => 'full_time', 'monthly_rate' => 18000, 'description' => 'Full-time babysitting'],
                        ['service_type' => 'caregiver', 'work_type' => 'part_time', 'monthly_rate' => 19500, 'description' => 'Elderly care assistance'],
                    ],
                ],
                [
                    'name' => 'Noor Jehan',
                    'password' => Hash::make('password'),
                    'role' => 'helper',
                    'phone' => '03001234573',
                    'address' => 'House 56, Sector 11, Karachi',
                    'is_active' => true,
                    'profile' => [
                        'age' => 52,
                        'gender' => 'female',
                        'religion' => 'shia',

                        'experience_years' => 10,
                        'bio' => 'Experienced caregiver specializing in elderly care. Trained in basic medical assistance.',
                        'verification_status' => 'verified',
                        'police_verified' => true,
                        'is_active' => true,
                        'rating' => 5.0,
                        'total_reviews' => 15,
                    ],
                    'languages' => [1, 2, 4], // English, Urdu, Sindhi
                    // Multiple service listings
                    'services' => [
                        ['service_type' => 'caregiver', 'work_type' => 'full_time', 'monthly_rate' => 24000, 'description' => 'Elderly care services'],
                        ['service_type' => 'caregiver', 'work_type' => 'part_time', 'monthly_rate' => 25500, 'description' => 'Part-time elderly assistance'],
                    ],
                ],
                [
                    'name' => 'Zahid Hussain',
                    'password' => Hash::make('password'),
                    'role' => 'helper',
                    'phone' => '03001234574',
                    'address' => 'Shop 23, Main Road, Karachi',
                    'is_active' => true,
                    'profile' => [
                        'age' => 38,
                        'gender' => 'male',
                        'religion' => 'sunni_no_nazar_niyaz',

                        'experience_years' => 4,
                        'bio' => 'Professional cleaner with expertise in deep cleaning and maintenance.',
                        'verification_status' => 'verified',
                        'police_verified' => true,
                        'is_active' => true,
                        'rating' => 4.6,
                        'total_reviews' => 10,
                    ],
                    'languages' => [2, 4], // Urdu, Sindhi
                    // Multiple service listings
                    'services' => [
                        ['service_type' => 'cleaner', 'work_type' => 'part_time', 'monthly_rate' => 13500, 'description' => 'Deep cleaning services'],
                        ['service_type' => 'cleaner', 'work_type' => 'part_time', 'monthly_rate' => 15000, 'description' => 'Office and home cleaning'],
                    ],
                ],
                [
                    'name' => 'Mehreen Butt',
                    'password' => Hash::make('password'),
                    'role' => 'helper',
                    'phone' => '03001234575',
                    'address' => 'Flat 201, Tower C, Karachi',
                    'is_active' => true,
                    'profile' => [
                        'age' => 35,
                        'gender' => 'female',
                        'religion' => 'christian',

                        'experience_years' => 6,
                        'bio' => 'Versatile all-rounder helper capable of handling multiple household tasks efficiently.',
                        'verification_status' => 'verified',
                        'police_verified' => true,
                        'is_active' => true,
                        'rating' => 4.8,
                        'total_reviews' => 18,
                    ],
                    'languages' => [1, 2, 3], // English, Urdu, Punjabi
                    // Multiple service listings
                    'services' => [
                        ['service_type' => 'all_rounder', 'work_type' => 'full_time', 'monthly_rate' => 19500, 'description' => 'Complete household management'],
                        ['service_type' => 'maid', 'work_type' => 'part_time', 'monthly_rate' => 18000, 'description' => 'Part-time maid services'],
                        ['service_type' => 'babysitter', 'work_type' => 'part_time', 'monthly_rate' => 16500, 'description' => 'Babysitting when needed'],
                    ],
                ],
            ];

            foreach ($helpers as $helperData) {
                // Extract services if present
                $services = $helperData['services'] ?? [];
                unset($helperData['services']);

                $profileData = $helperData['profile'] ?? [];
                unset($helperData['profile']);

                // Extract languages
                $languageIds = $helperData['languages'] ?? [];
                unset($helperData['languages']);

                // Remove 'role' from data array
                $role = $helperData['role'];
                unset($helperData['role']);

                $helper = User::firstOrCreate(
                    ['phone' => $helperData['phone']],
                    $helperData
                );
                if (!$helper->hasRole('helper')) {
                    $helper->assignRole('helper');
                }

                // Create or update profile
                $helper->profile()->updateOrCreate(
                    ['profileable_id' => $helper->id, 'profileable_type' => User::class],
                    $profileData
                );

                // Attach languages to profile (not user)
                if (!empty($languageIds) && $helper->profile) {
                    $helper->profile->languages()->sync($languageIds);
                }

                // Create service listings if provided
                if (!empty($services)) {
                    // Group services by common fields (work_type, monthly_rate, description)
                    $groupedServices = [];
                    foreach ($services as $serviceData) {
                        $key = md5(serialize([
                            $serviceData['work_type'] ?? 'full_time',
                            $serviceData['monthly_rate'] ?? null,
                            $serviceData['description'] ?? null,
                        ]));

                        if (!isset($groupedServices[$key])) {
                            $groupedServices[$key] = [
                                'common' => [
                                    'profile_id' => $helper->profile->id, // Link to profile
                                    'work_type' => $serviceData['work_type'] ?? 'full_time',
                                    'monthly_rate' => $serviceData['monthly_rate'] ?? null,
                                    'description' => $serviceData['description'] ?? null,
                                    'is_active' => true,
                                    'status' => 'active',
                                ],
                                'service_types' => [],
                                'locations' => [],
                            ];
                        }

                        // Add service type
                        if (!in_array($serviceData['service_type'], $groupedServices[$key]['service_types'])) {
                            $groupedServices[$key]['service_types'][] = $serviceData['service_type'];
                        }
                    }

                    // Create service listings for each group
                    foreach ($groupedServices as $group) {
                        // Create the listing without service_types and locations
                        $listing = \App\Models\ServiceListing::create($group['common']);

                        // Sync service types (convert slugs to IDs)
                        $serviceTypeIds = \App\Models\ServiceType::whereIn('slug', $group['service_types'])
                            ->pluck('id')
                            ->toArray();
                        if (!empty($serviceTypeIds)) {
                            $listing->serviceTypes()->sync($serviceTypeIds);
                        }

                        // Sync locations
                        if (!empty($group['locations'])) {
                            $listing->locations()->sync($group['locations']);
                        }
                    }
                }

                $listingCount = isset($groupedServices) ? count($groupedServices) : 0;
                $this->command->info("Created helper: {$helper->phone} with " . $listingCount . " service listing(s)");
            }
        }

        // Businesses (agencies managing workers)
        $businessRole = Role::where('name', 'business')->first();
        if ($businessRole) {
            $businesses = [
                [
                    'name' => 'HomeHelp Agency',
                    'password' => Hash::make('password'),
                    'role' => 'business',
                    'phone' => '03001234576',
                    'address' => 'Office 101, Business Center, Karachi',
                    'is_active' => true,
                    'profile' => [
                        'bio' => 'Leading agency providing verified domestic help services.',
                        'is_active' => true,
                    ],
                    // Agency Workers
                    'workers' => [
                        [
                            'name' => 'Agency Maid 1',
                            'password' => Hash::make('password'),
                            'phone' => '03001234901',
                            'address' => 'Worker Colony, Karachi',
                            'is_active' => true,
                            'profile' => [
                                'age' => 25,
                                'gender' => 'female',
                                'religion' => 'christian',
                                'experience_years' => 3,
                                'bio' => 'Verified agency maid.',
                                'verification_status' => 'verified',
                                'police_verified' => true,
                                'is_active' => true,
                            ],
                            'services' => [
                                ['service_type' => 'maid', 'work_type' => 'full_time', 'monthly_rate' => 16000, 'description' => 'Agency trained maid'],
                            ]
                        ],
                        [
                            'name' => 'Agency Cook 1',
                            'password' => Hash::make('password'),
                            'phone' => '03001234902',
                            'address' => 'Worker Colony, Karachi',
                            'is_active' => true,
                            'profile' => [
                                'age' => 40,
                                'gender' => 'male',
                                'religion' => 'sunni_no_nazar_niyaz',
                                'experience_years' => 10,
                                'bio' => 'Expert agency cook.',
                                'verification_status' => 'verified',
                                'police_verified' => true,
                                'is_active' => true,
                            ],
                            'services' => [
                                ['service_type' => 'cook', 'work_type' => 'full_time', 'monthly_rate' => 25000, 'description' => 'Premium cooking service'],
                            ]
                        ],
                        [
                            'name' => 'Agency Driver 1',
                            'password' => Hash::make('password'),
                            'phone' => '03001234904',
                            'address' => 'Baldia Town, Karachi',
                            'is_active' => true,
                            'profile' => [
                                'age' => 35,
                                'gender' => 'male',
                                'religion' => 'sunni_no_nazar_niyaz',
                                'experience_years' => 8,
                                'bio' => 'Professional driver with valid license.',
                                'verification_status' => 'verified',
                                'police_verified' => true,
                                'is_active' => true,
                            ],
                            'services' => [
                                ['service_type' => 'driver', 'work_type' => 'full_time', 'monthly_rate' => 22000, 'description' => 'Full time driver'],
                            ]
                        ]
                    ]
                ],
                [
                    'name' => 'Care Services Pvt Ltd',
                    'password' => Hash::make('password'),
                    'role' => 'business',
                    'phone' => '03001234577',
                    'address' => 'Suite 205, Corporate Tower, Karachi',
                    'is_active' => true,
                    'profile' => [
                        'bio' => 'Reliable and professional care services for homes and businesses.',
                        'is_active' => true,
                    ],
                    // Agency Workers
                    'workers' => [
                        [
                            'name' => 'Care Nurse 1',
                            'password' => Hash::make('password'),
                            'phone' => '03001234903',
                            'address' => 'Clifton, Karachi',
                            'is_active' => true,
                            'profile' => [
                                'age' => 30,
                                'gender' => 'female',
                                'religion' => 'sunni_nazar_niyaz',
                                'experience_years' => 6,
                                'bio' => 'Certified nursing assistant.',
                                'verification_status' => 'verified',
                                'police_verified' => true,
                                'is_active' => true,
                            ],
                            'services' => [
                                ['service_type' => 'caregiver', 'work_type' => 'full_time', 'monthly_rate' => 30000, 'description' => 'Professional patient care'],
                            ]
                        ],
                        [
                            'name' => 'Care Maid 2',
                            'password' => Hash::make('password'),
                            'phone' => '03001234905',
                            'address' => 'Saddar, Karachi',
                            'is_active' => true,
                            'profile' => [
                                'age' => 26,
                                'gender' => 'female',
                                'religion' => 'christian',
                                'experience_years' => 4,
                                'bio' => 'Experienced house cleaner.',
                                'verification_status' => 'verified',
                                'police_verified' => true,
                                'is_active' => true,
                            ],
                            'services' => [
                                ['service_type' => 'maid', 'work_type' => 'part_time', 'monthly_rate' => 14000, 'description' => 'Part-time cleaning'],
                            ]
                        ]
                    ]
                ],
            ];

            foreach ($businesses as $businessData) {
                // Extract workers if present
                $workers = $businessData['workers'] ?? [];
                unset($businessData['workers']);

                $profileData = $businessData['profile'] ?? [];
                unset($businessData['profile']);

                // Remove 'role' from data array
                $role = $businessData['role'];
                unset($businessData['role']);

                $business = User::firstOrCreate(
                    ['phone' => $businessData['phone']],
                    $businessData
                );
                if (!$business->hasRole('business')) {
                    $business->assignRole('business');
                }

                // Create or update profile
                $business->profile()->updateOrCreate(
                    ['profileable_id' => $business->id, 'profileable_type' => User::class],
                    $profileData
                );
                
                $this->command->info("Created business: {$business->phone}");

                // Create/Attach Workers
                foreach ($workers as $workerData) {
                    $workerServices = $workerData['services'] ?? [];
                    unset($workerData['services']);
                    
                    $workerProfile = $workerData['profile'] ?? [];
                    unset($workerData['profile']);

                    $worker = User::firstOrCreate(
                        ['phone' => $workerData['phone']],
                        $workerData
                    );
                    
                    if (!$worker->hasRole('helper')) {
                        $worker->assignRole('helper');
                    }

                    // Create/Update Worker Profile
                    $worker->profile()->updateOrCreate(
                        ['profileable_id' => $worker->id, 'profileable_type' => User::class],
                        $workerProfile
                    );
                    
                    $this->command->info("  - Created worker: {$worker->phone} for business {$business->phone}");

                    // Attach to Business
                    if (!$business->helpers()->where('user_id', $worker->id)->exists()) {
                        $business->helpers()->attach($worker->id, [
                            'status' => 'approved',
                            'joined_at' => now(),
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                    }

                    // Create Service Listings for Worker
                    if (!empty($workerServices)) {
                        // Group services logic (same as helper seeding)
                        $groupedServices = [];
                        foreach ($workerServices as $serviceData) {
                            $key = md5(serialize([
                                $serviceData['work_type'] ?? 'full_time',
                                $serviceData['monthly_rate'] ?? null,
                                $serviceData['description'] ?? null,
                            ]));

                            if (!isset($groupedServices[$key])) {
                                $groupedServices[$key] = [
                                    'common' => [
                                        'profile_id' => $worker->profile->id,
                                        'work_type' => $serviceData['work_type'] ?? 'full_time',
                                        'monthly_rate' => $serviceData['monthly_rate'] ?? null,
                                        'description' => $serviceData['description'] ?? null,
                                        'is_active' => true,
                                        'status' => 'active',
                                    ],
                                    'service_types' => [],
                                    'locations' => [],
                                ];
                            }

                            if (!in_array($serviceData['service_type'], $groupedServices[$key]['service_types'])) {
                                $groupedServices[$key]['service_types'][] = $serviceData['service_type'];
                            }
                        }

                        foreach ($groupedServices as $group) {
                            $listing = \App\Models\ServiceListing::create($group['common']);
                            
                            $serviceTypeIds = \App\Models\ServiceType::whereIn('slug', $group['service_types'])
                                ->pluck('id')
                                ->toArray();
                            if (!empty($serviceTypeIds)) {
                                $listing->serviceTypes()->sync($serviceTypeIds);
                            }
                        }
                    }
                }
            }
        }

        // Admin Users
        $adminRole = Role::where('name', 'admin')->first();
        if ($adminRole) {
            $admins = [
                [
                    'name' => 'Admin Manager',
                    'password' => Hash::make('password'),
                    'role' => 'admin',
                    'phone' => '03001234578',
                    'address' => 'Admin Office, Main Building, Karachi',
                    'profile' => [
                    ]
                ],
            ];

            foreach ($admins as $adminData) {
                $profileData = $adminData['profile'] ?? [];
                unset($adminData['profile']);

                // Remove 'role' from data array
                $role = $adminData['role'];
                unset($adminData['role']);

                $admin = User::firstOrCreate(
                    ['phone' => $adminData['phone']],
                    $adminData
                );
                if (!$admin->hasRole('admin')) {
                    $admin->assignRole('admin');
                }

                // Create or update profile
                $admin->profile()->updateOrCreate(
                    ['profileable_id' => $admin->id, 'profileable_type' => User::class],
                    $profileData
                );

                $this->command->info("Created admin: {$admin->phone}");
            }
        }

        $this->command->info('Dummy users created successfully!');
        $this->command->info('All users have password: "password"');
    }
}
