<?php

namespace App\Filament\Widgets;

use App\Models\JobPost;
use App\Models\ServiceListing;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class PlatformStatsOverview extends BaseWidget
{
    protected ?string $heading = 'Platform totals';

    protected function getStats(): array
    {
        return [
            Stat::make('Total users', number_format(User::count()))
                ->description('Registered accounts')
                ->icon('heroicon-o-users')
                ->color('primary'),
            Stat::make('Total jobs', number_format(JobPost::count()))
                ->description('Jobs posted by users')
                ->icon('heroicon-o-briefcase')
                ->color('success'),
            Stat::make('Total services', number_format(ServiceListing::count()))
                ->description('Service listings posted')
                ->icon('heroicon-o-wrench-screwdriver')
                ->color('info'),
        ];
    }
}
