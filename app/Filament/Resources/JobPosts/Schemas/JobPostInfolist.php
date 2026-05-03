<?php

namespace App\Filament\Resources\JobPosts\Schemas;

use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class JobPostInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Booking')
                    ->schema([
                        Grid::make(3)
                            ->schema([
                                TextEntry::make('name'),
                                TextEntry::make('status')
                                    ->badge()
                                    ->color(fn (string $state): string => match ($state) {
                                        'confirmed', 'completed' => 'success',
                                        'cancelled' => 'danger',
                                        'in_progress' => 'info',
                                        default => 'warning',
                                    }),
                                TextEntry::make('work_type')
                                    ->badge(),
                                TextEntry::make('user.name')
                                    ->label('Requested by')
                                    ->placeholder('-'),
                                TextEntry::make('assignedUser.name')
                                    ->label('Assigned helper')
                                    ->placeholder('-'),
                                TextEntry::make('serviceType.name')
                                    ->label('Service type')
                                    ->placeholder('-'),
                                TextEntry::make('cityRelation.name')
                                    ->label('City')
                                    ->placeholder('-'),
                                TextEntry::make('phone')
                                    ->placeholder('-'),
                                TextEntry::make('estimated_salary')
                                    ->money('PKR')
                                    ->placeholder('-'),
                                TextEntry::make('start_date')
                                    ->date()
                                    ->placeholder('-'),
                                TextEntry::make('start_time')
                                    ->placeholder('-'),
                                IconEntry::make('is_system_generated')
                                    ->boolean(),
                                TextEntry::make('address')
                                    ->placeholder('-')
                                    ->columnSpanFull(),
                                TextEntry::make('special_requirements')
                                    ->placeholder('-')
                                    ->columnSpanFull(),
                                TextEntry::make('admin_notes')
                                    ->placeholder('-')
                                    ->columnSpanFull(),
                            ]),
                    ]),
            ]);
    }
}
