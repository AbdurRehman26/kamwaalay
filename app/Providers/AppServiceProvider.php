<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;
use App\Models\JobPost;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(\App\Services\SMS\SmsServiceInterface::class, function ($app) {
            $driver = config('services.sms.default', 'veevotech');
            
            if ($driver === 'veevotech') {
                return new \App\Services\SMS\Drivers\VeevoTechDriver();
            }
            
            // Fallback or other drivers
            return new \App\Services\SMS\Drivers\VeevoTechDriver();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        
        // Route model binding for backward compatibility
        Route::bind('booking', function ($value) {
            return JobPost::findOrFail($value);
        });
    }
}
