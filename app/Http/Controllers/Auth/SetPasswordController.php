<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class SetPasswordController extends Controller
{
    /**
     * Set password for authenticated user (e.g., after OTP login)
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated. Please login first.',
                'errors' => ['password' => ['You must be logged in to set a password.']]
            ], 401);
        }

        // Update password
        $user->password = Hash::make($request->password);
        $user->save();

        // Reload user with roles to get fresh data including has_password flag
        $user->load('roles');

        return response()->json([
            'message' => 'Password set successfully! You can now use this password to login.',
            'user' => new UserResource($user), // Return updated user data
        ]);
    }
}
