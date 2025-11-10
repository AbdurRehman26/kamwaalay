<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Migrate existing helper/business data from users table to profiles table
        $users = DB::table('users')
            ->where(function ($query) {
                $query->whereNotNull('service_type')
                    ->orWhereNotNull('skills')
                    ->orWhereNotNull('experience_years')
                    ->orWhereNotNull('city')
                    ->orWhereNotNull('area')
                    ->orWhereNotNull('availability')
                    ->orWhereNotNull('bio')
                    ->orWhereNotNull('verification_status')
                    ->orWhereNotNull('police_verified')
                    ->orWhereNotNull('rating')
                    ->orWhereNotNull('total_reviews');
            })
            ->get();

        foreach ($users as $user) {
            DB::table('profiles')->insert([
                'profileable_type' => 'App\Models\User',
                'profileable_id' => $user->id,
                'photo' => $user->photo ?? null,
                'service_type' => $user->service_type ?? null,
                'skills' => $user->skills ?? null,
                'experience_years' => $user->experience_years ?? 0,
                'city' => $user->city ?? null,
                'area' => $user->area ?? null,
                'availability' => $user->availability ?? null,
                'bio' => $user->bio ?? null,
                'verification_status' => $user->verification_status ?? 'pending',
                'police_verified' => $user->police_verified ?? false,
                'is_active' => $user->is_active ?? true,
                'rating' => $user->rating ?? 0.00,
                'total_reviews' => $user->total_reviews ?? 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Move data back to users table
        $profiles = DB::table('profiles')
            ->where('profileable_type', 'App\Models\User')
            ->get();

        foreach ($profiles as $profile) {
            DB::table('users')
                ->where('id', $profile->profileable_id)
                ->update([
                    'photo' => $profile->photo,
                    'service_type' => $profile->service_type,
                    'skills' => $profile->skills,
                    'experience_years' => $profile->experience_years,
                    'city' => $profile->city,
                    'area' => $profile->area,
                    'availability' => $profile->availability,
                    'bio' => $profile->bio,
                    'verification_status' => $profile->verification_status,
                    'police_verified' => $profile->police_verified,
                    'is_active' => $profile->is_active,
                    'rating' => $profile->rating,
                    'total_reviews' => $profile->total_reviews,
                ]);
        }
    }
};
