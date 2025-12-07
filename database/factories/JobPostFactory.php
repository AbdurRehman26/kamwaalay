<?php

namespace Database\Factories;

use App\Models\JobPost;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\JobPost>
 */
class JobPostFactory extends Factory
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
            'name' => fake()->name(),
            'email' => fake()->safeEmail(),
            'phone' => '03' . fake()->numerify('########'),
            'service_type' => fake()->randomElement(['maid', 'cook', 'babysitter', 'caregiver', 'cleaner', 'all_rounder']),
            'work_type' => fake()->randomElement(['full_time', 'part_time']),
            'city' => 'Karachi',
            'area' => fake()->randomElement(['Saddar', 'DHA', 'PECHS', 'Clifton', 'Korangi', 'Bahadurabad']),
            'address' => fake()->address(),
            'special_requirements' => fake()->optional()->sentence(),
            'status' => fake()->randomElement(['pending', 'confirmed', 'cancelled', 'completed']),
        ];
    }
}





