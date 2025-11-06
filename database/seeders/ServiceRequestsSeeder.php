<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\User;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class ServiceRequestsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get users with role 'user'
        $users = User::role('user')->get();

        if ($users->isEmpty()) {
            $this->command->warn('No users found. Please run DummyUsersSeeder first.');
            return;
        }

        $serviceTypes = ['maid', 'cook', 'babysitter', 'caregiver', 'cleaner', 'all_rounder'];
        $workTypes = ['full_time', 'part_time'];
        $statuses = ['pending', 'pending', 'pending', 'pending', 'pending', 'confirmed', 'pending']; // Mostly pending
        $cities = ['Karachi'];
        $areas = ['DHA', 'Clifton', 'Gulshan-e-Iqbal', 'PECHS', 'Saddar', 'Korangi', 'North Karachi', 'Bahadurabad', 'Karimabad'];
        
        $specialRequirements = [
            'Looking for someone who can start immediately',
            'Must be fluent in Urdu',
            'Experience with elderly care preferred',
            'Should be available on weekends',
            'Need someone with first aid certification',
            'Looking for a helper who can also drive',
            'Prefer someone who can cook Pakistani cuisine',
            'Must have 5+ years of experience',
            'Looking for someone with childcare certification',
            'Need a helper who can work flexible hours',
            null,
            null,
            null,
        ];

        $serviceRequests = [];

        // Create service requests for each user
        foreach ($users as $index => $user) {
            // Each user creates 2-4 service requests
            $numRequests = rand(2, 4);
            
            for ($i = 0; $i < $numRequests; $i++) {
                $serviceType = $serviceTypes[array_rand($serviceTypes)];
                $workType = $workTypes[array_rand($workTypes)];
                $status = $statuses[array_rand($statuses)];
                $area = $areas[array_rand($areas)];
                $specialReq = $specialRequirements[array_rand($specialRequirements)];
                
                // Random start date between tomorrow and 30 days from now
                $startDate = Carbon::now()->addDays(rand(1, 30));
                $startTime = Carbon::createFromTime(rand(8, 18), rand(0, 59));
                
                $serviceRequests[] = [
                    'user_id' => $user->id,
                    'assigned_user_id' => $status === 'confirmed' ? null : null, // Can be assigned later
                    'service_type' => $serviceType,
                    'work_type' => $workType,
                    'city' => $cities[0],
                    'area' => $area,
                    'start_date' => rand(0, 10) > 3 ? $startDate->toDateString() : null, // 70% have start dates
                    'start_time' => rand(0, 10) > 5 ? $startTime->format('H:i') : null, // 50% have start times
                    'name' => $user->name,
                    'phone' => $user->phone ?? '0300' . rand(1000000, 9999999),
                    'email' => $user->email,
                    'address' => $user->address ?? "House " . rand(1, 999) . ", Street " . rand(1, 50) . ", " . $area . ", Karachi",
                    'special_requirements' => $specialReq,
                    'status' => $status,
                    'admin_notes' => null,
                    'created_at' => Carbon::now()->subDays(rand(0, 15)), // Created within last 15 days
                    'updated_at' => Carbon::now()->subDays(rand(0, 15)),
                ];
            }
        }

        // Insert service requests
        foreach ($serviceRequests as $request) {
            Booking::firstOrCreate(
                [
                    'user_id' => $request['user_id'],
                    'service_type' => $request['service_type'],
                    'work_type' => $request['work_type'],
                    'city' => $request['city'],
                    'area' => $request['area'],
                    'email' => $request['email'],
                    'start_date' => $request['start_date'],
                ],
                $request
            );
        }

        $this->command->info('Created ' . count($serviceRequests) . ' service requests.');
    }
}

