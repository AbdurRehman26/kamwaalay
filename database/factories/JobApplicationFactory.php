<?php

namespace Database\Factories;

use App\Models\JobApplication;
use App\Models\Booking;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\JobApplication>
 */
class JobApplicationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'booking_id' => Booking::factory(),
            'user_id' => User::factory(),
            'message' => fake()->optional()->paragraph(),
            'proposed_rate' => fake()->optional()->numberBetween(10000, 30000),
            'status' => fake()->randomElement(['pending', 'accepted', 'rejected', 'withdrawn']),
            'applied_at' => now(),
        ];
    }
}

