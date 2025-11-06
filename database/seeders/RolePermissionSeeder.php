<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // Helper permissions
            'view helpers',
            'create helpers',
            'edit helpers',
            'delete helpers',
            'manage own helper profile',
            'manage agency workers',
            
            // Booking permissions
            'view bookings',
            'create bookings',
            'edit bookings',
            'delete bookings',
            'manage own bookings',
            
            // Review permissions
            'view reviews',
            'create reviews',
            'edit reviews',
            'delete reviews',
            
            // Business permissions
            'view business dashboard',
            'manage business profile',
            
            // Admin permissions
            'view admin dashboard',
            'manage all helpers',
            'manage all bookings',
            'manage documents',
            'verify helpers',
            'verify documents',
            'manage users',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create roles and assign permissions
        
        // User role (customers looking for help)
        $userRole = Role::firstOrCreate(['name' => 'user']);
        $userRole->syncPermissions([
            'view helpers',
            'create bookings',
            'view bookings',
            'manage own bookings',
            'create reviews',
            'edit reviews',
            'delete reviews',
        ]);

        // Helper role (workers offering services)
        $helperRole = Role::firstOrCreate(['name' => 'helper']);
        $helperRole->syncPermissions([
            'view helpers',
            'create helpers',
            'manage own helper profile',
            'view bookings',
            'view reviews',
        ]);

        // Business role (agencies that manage multiple workers)
        $businessRole = Role::firstOrCreate(['name' => 'business']);
        $businessRole->syncPermissions([
            'view helpers',
            'create helpers',
            'edit helpers',
            'delete helpers',
            'manage agency workers',
            'view business dashboard',
            'manage business profile',
            'view bookings',
            'create bookings',
            'edit bookings',
            'manage own bookings',
            'view reviews',
        ]);

        // Admin role
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $adminRole->syncPermissions(Permission::all());

        // Super Admin role (has all permissions by default)
        $superAdminRole = Role::firstOrCreate(['name' => 'super_admin']);
        $superAdminRole->syncPermissions(Permission::all());
    }
}
