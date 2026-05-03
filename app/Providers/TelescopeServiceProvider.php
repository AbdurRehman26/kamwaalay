<?php

namespace App\Providers;

use App\Models\User;
use Filament\Facades\Filament;
use Filament\Models\Contracts\FilamentUser;
use Illuminate\Support\Facades\Gate;
use Laravel\Telescope\IncomingEntry;
use Laravel\Telescope\Telescope;
use Laravel\Telescope\TelescopeApplicationServiceProvider;

class TelescopeServiceProvider extends TelescopeApplicationServiceProvider
{
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        parent::boot();

        Telescope::auth(function ($request): bool {
            $user = Filament::auth()->user() ?? $request->user();

            if (! $user instanceof User) {
                return false;
            }

            return Gate::forUser($user)->check('viewTelescope');
        });
    }

    /**
     * Register any application services.
     */
    public function register(): void
    {
        Telescope::night();

        $this->hideSensitiveRequestDetails();
        $isLocal = $this->app->isLocal();

        Telescope::filter(function (IncomingEntry $entry) use ($isLocal) {
            if ($isLocal) {
                return true;
            }

            return $entry->isReportableException() ||
                $entry->isFailedJob() ||
                $entry->isScheduledTask() ||
                $entry->isRequest() ||
                $entry->isDump() ||
                $entry->hasMonitoredTag();
        });
    }

    /**
     * Prevent sensitive request details from being logged by Telescope.
     */
    protected function hideSensitiveRequestDetails(): void
    {
        if ($this->app->environment('local')) {
            return;
        }

        Telescope::hideRequestParameters(['_token']);

        Telescope::hideRequestHeaders([
            'cookie',
            'x-csrf-token',
            'x-xsrf-token',
        ]);
    }

    /**
     * Register the Telescope gate.
     */
    protected function gate(): void
    {
        Gate::define('viewTelescope', function (?User $user): bool {
            $panel = Filament::getPanel('admin');

            return $user instanceof FilamentUser && $user->canAccessPanel($panel);
        });
    }
}
