<?php

namespace Database\Factories;

use App\Models\ServiceListing;
use App\Models\User;
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
            'user_id' => User::factory(),
            'work_type' => fake()->randomElement(['full_time', 'part_time']),
            'monthly_rate' => fake()->numberBetween(10000, 30000),
            'description' => fake()->sentence(),
            'is_active' => true,
            'status' => 'active',
        ];
    }
}

