<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\ServiceListing;
use App\Models\City;
use App\Models\Location;
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
                    'email' => 'user1@kamwaalay.com',
                    'password' => Hash::make('password'),
                    'role' => 'user',
                    'phone' => '03001234567',
                    'address' => 'House 123, Street 4, Karachi',
                    'city' => 'Karachi',
                    'area' => 'DHA',
                ],
                [
                    'name' => 'Fatima Khan',
                    'email' => 'user2@kamwaalay.com',
                    'password' => Hash::make('password'),
                    'role' => 'user',
                    'phone' => '03001234568',
                    'address' => 'Apartment 45, Block 2, Karachi',
                    'city' => 'Karachi',
                    'area' => 'Clifton',
                ],
                [
                    'name' => 'Hassan Raza',
                    'email' => 'user3@kamwaalay.com',
                    'password' => Hash::make('password'),
                    'role' => 'user',
                    'phone' => '03001234569',
                    'address' => 'Villa 789, Phase 5, Karachi',
                    'city' => 'Karachi',
                    'area' => 'Gulshan-e-Iqbal',
                ],
            ];

            foreach ($users as $userData) {
                // Remove 'role' from data array
                $role = $userData['role'];
                unset($userData['role']);

                $user = User::firstOrCreate(
                    ['email' => $userData['email']],
                    $userData
                );
                if (!$user->hasRole('user')) {
                    $user->assignRole('user');
                }
                $this->command->info("Created user: {$user->email}");
            }
        }

        // Helpers (workers offering services)
        $helperRole = Role::where('name', 'helper')->first();
        if ($helperRole) {
            $helpers = [
                [
                    'name' => 'Ayesha Bibi',
                    'email' => 'helper1@kamwaalay.com',
                    'password' => Hash::make('password'),
                    'role' => 'helper',
                    'phone' => '03001234570',
                    'address' => 'Quarter 12, Workers Colony, Karachi',
                    'city' => 'Karachi',
                    'area' => 'Saddar',
                    'skills' => 'Cleaning, Laundry, Cooking basics',
                    'experience_years' => 5,
                    'bio' => 'Experienced and reliable maid with 5 years of experience. Good with cleaning and household chores.',
                    'verification_status' => 'verified',
                    'police_verified' => true,
                    'is_active' => true,
                    'rating' => 4.8,
                    'total_reviews' => 12,
                    // Multiple service listings
                    'services' => [
                        ['service_type' => 'maid', 'work_type' => 'full_time', 'city' => 'Karachi', 'area' => 'Saddar', 'monthly_rate' => 15000, 'description' => 'Professional maid service'],
                        ['service_type' => 'cleaner', 'work_type' => 'part_time', 'city' => 'Karachi', 'area' => 'Saddar', 'monthly_rate' => 13500, 'description' => 'Deep cleaning services'],
                    ],
                ],
                [
                    'name' => 'Rashid Ali',
                    'email' => 'helper2@kamwaalay.com',
                    'password' => Hash::make('password'),
                    'role' => 'helper',
                    'phone' => '03001234571',
                    'address' => 'Street 5, Block A, Karachi',
                    'city' => 'Karachi',
                    'area' => 'PECHS',
                    'skills' => 'Pakistani cuisine, BBQ, Baking',
                    'experience_years' => 8,
                    'bio' => 'Professional cook specializing in Pakistani and continental dishes. Available for part-time cooking.',
                    'verification_status' => 'verified',
                    'police_verified' => true,
                    'is_active' => true,
                    'rating' => 4.9,
                    'total_reviews' => 25,
                    // Multiple service listings
                    'services' => [
                        ['service_type' => 'cook', 'work_type' => 'part_time', 'city' => 'Karachi', 'area' => 'PECHS', 'monthly_rate' => 21000, 'description' => 'Pakistani and continental cuisine'],
                        ['service_type' => 'cook', 'work_type' => 'full_time', 'city' => 'Karachi', 'area' => 'DHA', 'monthly_rate' => 24000, 'description' => 'Full-time cooking services'],
                    ],
                ],
                [
                    'name' => 'Saima Akhtar',
                    'email' => 'helper3@kamwaalay.com',
                    'password' => Hash::make('password'),
                    'role' => 'helper',
                    'phone' => '03001234572',
                    'address' => 'Flat 302, Building B, Karachi',
                    'city' => 'Karachi',
                    'area' => 'DHA',
                    'skills' => 'Childcare, Homework help, First aid',
                    'experience_years' => 3,
                    'bio' => 'Caring and patient babysitter with experience in childcare. Good with kids of all ages.',
                    'verification_status' => 'verified',
                    'police_verified' => true,
                    'is_active' => true,
                    'rating' => 4.7,
                    'total_reviews' => 8,
                    // Multiple service listings
                    'services' => [
                        ['service_type' => 'babysitter', 'work_type' => 'full_time', 'city' => 'Karachi', 'area' => 'DHA', 'monthly_rate' => 18000, 'description' => 'Full-time babysitting'],
                        ['service_type' => 'caregiver', 'work_type' => 'part_time', 'city' => 'Karachi', 'area' => 'DHA', 'monthly_rate' => 19500, 'description' => 'Elderly care assistance'],
                    ],
                ],
                [
                    'name' => 'Noor Jehan',
                    'email' => 'helper4@kamwaalay.com',
                    'password' => Hash::make('password'),
                    'role' => 'helper',
                    'phone' => '03001234573',
                    'address' => 'House 56, Sector 11, Karachi',
                    'city' => 'Karachi',
                    'area' => 'North Karachi',
                    'skills' => 'Elderly care, Medication management, Physical therapy',
                    'experience_years' => 10,
                    'bio' => 'Experienced caregiver specializing in elderly care. Trained in basic medical assistance.',
                    'verification_status' => 'verified',
                    'police_verified' => true,
                    'is_active' => true,
                    'rating' => 5.0,
                    'total_reviews' => 15,
                    // Multiple service listings
                    'services' => [
                        ['service_type' => 'caregiver', 'work_type' => 'full_time', 'city' => 'Karachi', 'area' => 'North Karachi', 'monthly_rate' => 24000, 'description' => 'Elderly care services'],
                        ['service_type' => 'caregiver', 'work_type' => 'part_time', 'city' => 'Karachi', 'area' => 'DHA', 'monthly_rate' => 25500, 'description' => 'Part-time elderly assistance'],
                    ],
                ],
                [
                    'name' => 'Zahid Hussain',
                    'email' => 'helper5@kamwaalay.com',
                    'password' => Hash::make('password'),
                    'role' => 'helper',
                    'phone' => '03001234574',
                    'address' => 'Shop 23, Main Road, Karachi',
                    'city' => 'Karachi',
                    'area' => 'Korangi',
                    'skills' => 'Deep cleaning, Window cleaning, Carpet cleaning',
                    'experience_years' => 4,
                    'bio' => 'Professional cleaner with expertise in deep cleaning and maintenance.',
                    'verification_status' => 'verified',
                    'police_verified' => true,
                    'is_active' => true,
                    'rating' => 4.6,
                    'total_reviews' => 10,
                    // Multiple service listings
                    'services' => [
                        ['service_type' => 'cleaner', 'work_type' => 'part_time', 'city' => 'Karachi', 'area' => 'Korangi', 'monthly_rate' => 13500, 'description' => 'Deep cleaning services'],
                        ['service_type' => 'cleaner', 'work_type' => 'part_time', 'city' => 'Karachi', 'area' => 'PECHS', 'monthly_rate' => 15000, 'description' => 'Office and home cleaning'],
                    ],
                ],
                [
                    'name' => 'Mehreen Butt',
                    'email' => 'helper6@kamwaalay.com',
                    'password' => Hash::make('password'),
                    'role' => 'helper',
                    'phone' => '03001234575',
                    'address' => 'Flat 201, Tower C, Karachi',
                    'city' => 'Karachi',
                    'area' => 'Bahadurabad',
                    'skills' => 'Cooking, Cleaning, Childcare, Errands',
                    'experience_years' => 6,
                    'bio' => 'Versatile all-rounder helper capable of handling multiple household tasks efficiently.',
                    'verification_status' => 'verified',
                    'police_verified' => true,
                    'is_active' => true,
                    'rating' => 4.8,
                    'total_reviews' => 18,
                    // Multiple service listings
                    'services' => [
                        ['service_type' => 'all_rounder', 'work_type' => 'full_time', 'city' => 'Karachi', 'area' => 'Bahadurabad', 'monthly_rate' => 19500, 'description' => 'Complete household management'],
                        ['service_type' => 'maid', 'work_type' => 'part_time', 'city' => 'Karachi', 'area' => 'Clifton', 'monthly_rate' => 18000, 'description' => 'Part-time maid services'],
                        ['service_type' => 'babysitter', 'work_type' => 'part_time', 'city' => 'Karachi', 'area' => 'Bahadurabad', 'monthly_rate' => 16500, 'description' => 'Babysitting when needed'],
                    ],
                ],
            ];

            foreach ($helpers as $helperData) {
                // Extract services if present
                $services = $helperData['services'] ?? [];
                unset($helperData['services']);

                // Remove 'role' from data array
                $role = $helperData['role'];
                unset($helperData['role']);

                $helper = User::firstOrCreate(
                    ['email' => $helperData['email']],
                    $helperData
                );
                if (!$helper->hasRole('helper')) {
                    $helper->assignRole('helper');
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
                                    'user_id' => $helper->id,
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

                        // Add location
                        $locationKey = $serviceData['city'] . '|' . $serviceData['area'];
                        if (!isset($groupedServices[$key]['locations'][$locationKey])) {
                            $groupedServices[$key]['locations'][$locationKey] = [
                                'city' => $serviceData['city'],
                                'area' => $serviceData['area'],
                            ];
                        }
                    }

                    // Create service listings for each group
                    foreach ($groupedServices as $group) {
                        $listing = \App\Models\ServiceListing::create($group['common']);

                        // Attach service types
                        foreach ($group['service_types'] as $serviceType) {
                            \App\Models\ServiceListingServiceType::create([
                                'service_listing_id' => $listing->id,
                                'service_type' => $serviceType,
                            ]);
                        }

                        // Attach locations
                        foreach ($group['locations'] as $location) {
                            \App\Models\ServiceListingLocation::create([
                                'service_listing_id' => $listing->id,
                                'city' => $location['city'],
                                'area' => $location['area'],
                            ]);
                        }
                    }
                }

                $listingCount = isset($groupedServices) ? count($groupedServices) : 0;
                $this->command->info("Created helper: {$helper->email} with " . $listingCount . " service listing(s)");
            }
        }

        // Businesses (agencies managing workers)
        $businessRole = Role::where('name', 'business')->first();
        if ($businessRole) {
            $businesses = [
                [
                    'name' => 'HomeHelp Agency',
                    'email' => 'business1@kamwaalay.com',
                    'password' => Hash::make('password'),
                    'role' => 'business',
                    'phone' => '03001234576',
                    'address' => 'Office 101, Business Center, Karachi',
                    'city' => 'Karachi',
                    'area' => 'PECHS',
                    'bio' => 'Leading agency providing verified domestic help services.',
                    'is_active' => true,
                    // Multiple service listings
                    'services' => [
                        ['service_type' => 'maid', 'work_type' => 'full_time', 'city' => 'Karachi', 'area' => 'PECHS', 'monthly_rate' => 15000, 'description' => 'Professional maid services'],
                        ['service_type' => 'cook', 'work_type' => 'full_time', 'city' => 'Karachi', 'area' => 'PECHS', 'monthly_rate' => 21000, 'description' => 'Experienced cooking services'],
                        ['service_type' => 'babysitter', 'work_type' => 'part_time', 'city' => 'Karachi', 'area' => 'DHA', 'monthly_rate' => 18000, 'description' => 'Reliable babysitting'],
                        ['service_type' => 'caregiver', 'work_type' => 'full_time', 'city' => 'Karachi', 'area' => 'PECHS', 'monthly_rate' => 24000, 'description' => 'Elderly care services'],
                    ],
                ],
                [
                    'name' => 'Care Services Pvt Ltd',
                    'email' => 'business2@kamwaalay.com',
                    'password' => Hash::make('password'),
                    'role' => 'business',
                    'phone' => '03001234577',
                    'address' => 'Suite 205, Corporate Tower, Karachi',
                    'city' => 'Karachi',
                    'area' => 'Clifton',
                    'bio' => 'Reliable and professional care services for homes and businesses.',
                    'is_active' => true,
                    // Multiple service listings
                    'services' => [
                        ['service_type' => 'all_rounder', 'work_type' => 'full_time', 'city' => 'Karachi', 'area' => 'Clifton', 'monthly_rate' => 21000, 'description' => 'Complete household management'],
                        ['service_type' => 'cleaner', 'work_type' => 'part_time', 'city' => 'Karachi', 'area' => 'Clifton', 'monthly_rate' => 15000, 'description' => 'Professional cleaning'],
                        ['service_type' => 'caregiver', 'work_type' => 'full_time', 'city' => 'Karachi', 'area' => 'DHA', 'monthly_rate' => 25500, 'description' => 'Medical assistance and care'],
                    ],
                ],
            ];

            foreach ($businesses as $businessData) {
                // Extract services if present
                $services = $businessData['services'] ?? [];
                unset($businessData['services']);

                // Remove 'role' from data array
                $role = $businessData['role'];
                unset($businessData['role']);

                $business = User::firstOrCreate(
                    ['email' => $businessData['email']],
                    $businessData
                );
                if (!$business->hasRole('business')) {
                    $business->assignRole('business');
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
                                    'user_id' => $business->id,
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

                        // Add location
                        $locationKey = $serviceData['city'] . '|' . $serviceData['area'];
                        if (!isset($groupedServices[$key]['locations'][$locationKey])) {
                            $groupedServices[$key]['locations'][$locationKey] = [
                                'city' => $serviceData['city'],
                                'area' => $serviceData['area'],
                            ];
                        }
                    }

                    // Create service listings for each group
                    foreach ($groupedServices as $group) {
                        $listing = \App\Models\ServiceListing::create($group['common']);

                        // Attach service types
                        foreach ($group['service_types'] as $serviceType) {
                            \App\Models\ServiceListingServiceType::create([
                                'service_listing_id' => $listing->id,
                                'service_type' => $serviceType,
                            ]);
                        }

                        // Attach locations
                        foreach ($group['locations'] as $location) {
                            \App\Models\ServiceListingLocation::create([
                                'service_listing_id' => $listing->id,
                                'city' => $location['city'],
                                'area' => $location['area'],
                            ]);
                        }
                    }

                    $listingCount = count($groupedServices);
                    $this->command->info("Created business: {$business->email} with " . $listingCount . " service listing(s)");
                } else {
                    $this->command->info("Created business: {$business->email}");
                }
            }
        }

        // Admin Users
        $adminRole = Role::where('name', 'admin')->first();
        if ($adminRole) {
            $admins = [
                [
                    'name' => 'Admin Manager',
                    'email' => 'admin@kamwaalay.com',
                    'password' => Hash::make('password'),
                    'role' => 'admin',
                    'phone' => '03001234578',
                    'address' => 'Admin Office, Main Building, Karachi',
                    'city' => 'Karachi',
                    'area' => 'DHA',
                ],
            ];

            foreach ($admins as $adminData) {
                // Remove 'role' from data array
                $role = $adminData['role'];
                unset($adminData['role']);

                $admin = User::firstOrCreate(
                    ['email' => $adminData['email']],
                    $adminData
                );
                if (!$admin->hasRole('admin')) {
                    $admin->assignRole('admin');
                }
                $this->command->info("Created admin: {$admin->email}");
            }
        }

        $this->command->info('Dummy users created successfully!');
        $this->command->info('All users have password: "password"');
    }
}
