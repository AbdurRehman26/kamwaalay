<?php

namespace Database\Factories;

use App\Models\Document;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Document>
 */
class DocumentFactory extends Factory
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
            'document_type' => fake()->randomElement(['police_verification', 'nic', 'other']),
            'document_number' => fake()->numerify('########'),
            'file_path' => 'documents/' . fake()->uuid() . '.pdf',
            'status' => fake()->randomElement(['pending', 'verified', 'rejected']),
            'admin_notes' => fake()->optional()->sentence(),
        ];
    }
}

