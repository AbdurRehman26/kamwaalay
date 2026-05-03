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
        // Create or update the super admin user as ID 1 for Filament access
        $superAdmin = User::updateOrCreate(
            ['id' => 1],
            [
                'name' => 'Super Admin',
                'email' => 'sydabdrehman@gmail.com',
                'phone' => '+923202095051',
                'password' => Hash::make('1234Om@m@5678'),
                'is_active' => true,
                'is_system_generated' => true,
            ]
        );

        // Assign all roles to this user
        $roles = Role::all();
        $superAdmin->syncRoles($roles);

        $this->command->info("Super Admin user created/updated: sydabdrehman@gmail.com");
        $this->command->info("Assigned roles: " . $roles->pluck('name')->implode(', '));
    }
}
