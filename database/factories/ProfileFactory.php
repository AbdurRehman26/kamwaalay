<?php

namespace Database\Factories;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Profile>
 */
class ProfileFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'profileable_id' => User::factory(),
            'profileable_type' => 'App\Models\User',
            'bio' => fake()->sentence(),
            'city' => 'Karachi',
            'area' => fake()->randomElement(['Saddar', 'DHA', 'Clifton', 'Gulshan']),
        ];
    }
}

