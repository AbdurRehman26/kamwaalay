<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create the super admin user with all roles
        $superAdmin = User::firstOrCreate(
            [
                'name' => 'Super Admin',
                'phone' => '+923202095051',
                'password' => Hash::make('sydabdrehman@gmail.com'),
            ]
        );

        // Assign all roles to this user
        $roles = Role::all();
        $superAdmin->syncRoles($roles);

        $this->command->info("Super Admin user created/updated: +923202095051");
        $this->command->info("Assigned roles: " . $roles->pluck('name')->implode(', '));
    }
}
