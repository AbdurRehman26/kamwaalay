<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\Auth\VerificationController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    // Render Inertia views - data comes from API
    Route::get('register', function () {
        return Inertia::render('Auth/Register');
    })->name('register');

    Route::get('verify-otp', function () {
        return Inertia::render('Auth/Verify');
    })->name('verification.otp.show');

    Route::get('register/phone', function () {
        return Inertia::render('Auth/PhoneRegister');
    })->name('register.phone');

    Route::get('login', function () {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    })->name('login');

    Route::get('forgot-password', function () {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
        ]);
    })->name('password.request');

    Route::get('reset-password/{token}', function ($token) {
        return Inertia::render('Auth/ResetPassword', [
            'token' => $token,
            'email' => request('email'),
        ]);
    })->name('password.reset');
});

Route::middleware('auth')->group(function () {
    // Render Inertia views - data comes from API
    Route::get('verify-email', function () {
        return Inertia::render('Auth/VerifyEmail', [
            'status' => session('status'),
        ]);
    })->name('verification.notice');

    Route::get('confirm-password', function () {
        return Inertia::render('Auth/ConfirmPassword');
    })->name('password.confirm');

    // Logout route - will post to API
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
});
