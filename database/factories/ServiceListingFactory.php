<?php

namespace Database\Factories;

use App\Models\ServiceListing;
use App\Models\Profile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ServiceListing>
 */
class ServiceListingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'profile_id' => Profile::factory(),
            'work_type' => fake()->randomElement(['full_time', 'part_time']),
            'monthly_rate' => fake()->numberBetween(10000, 30000),
            'description' => fake()->sentence(),
            'pin_address' => fake()->address(),
            'is_active' => true,
            'status' => 'active',
        ];
    }

    /**
     * Configure the factory to attach service types after creation
     */
    public function configure(): static
    {
        return $this->afterCreating(function (ServiceListing $listing) {
            // Attach a random service type
            $serviceType = \App\Models\ServiceType::inRandomOrder()->first();
            if ($serviceType) {
                $listing->serviceTypes()->attach($serviceType->id);
            }
        });
    }
}
