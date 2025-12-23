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
            'service_type_id' => \App\Models\ServiceType::inRandomOrder()->first()->id ?? \App\Models\ServiceType::factory(),
            'name' => fake()->name(),
            'phone' => '03' . fake()->numerify('########'),
            'work_type' => fake()->randomElement(['full_time', 'part_time']),
            'address' => fake()->address(),
            'special_requirements' => fake()->optional()->sentence(),
            'status' => fake()->randomElement(['pending', 'confirmed', 'cancelled', 'completed']),
        ];
    }
}








