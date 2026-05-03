<?php

namespace App\Filament\Resources\Users\Schemas;

use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class UserInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Account')
                    ->schema([
                        Grid::make(3)
                            ->schema([
                                TextEntry::make('name'),
                                TextEntry::make('role')
                                    ->badge(),
                                TextEntry::make('email')
                                    ->placeholder('-'),
                                TextEntry::make('phone')
                                    ->placeholder('-'),
                                TextEntry::make('address')
                                    ->placeholder('-')
                                    ->columnSpan(2),
                                IconEntry::make('is_active')
                                    ->boolean(),
                                IconEntry::make('is_system_generated')
                                    ->boolean(),
                                TextEntry::make('phone_verified_at')
                                    ->dateTime()
                                    ->placeholder('-'),
                            ]),
                    ]),
                Section::make('Profile')
                    ->schema([
                        Grid::make(3)
                            ->schema([
                                TextEntry::make('profile.city.name')
                                    ->label('City')
                                    ->placeholder('-'),
                                TextEntry::make('profile.verification_status')
                                    ->badge()
                                    ->color(fn (?string $state): string => match ($state) {
                                        'verified' => 'success',
                                        'rejected' => 'danger',
                                        default => 'warning',
                                    })
                                    ->placeholder('-'),
                                TextEntry::make('profile.experience_years')
                                    ->label('Experience')
                                    ->suffix(' years')
                                    ->placeholder('-'),
                                TextEntry::make('profile.age')
                                    ->placeholder('-'),
                                TextEntry::make('profile.gender')
                                    ->placeholder('-'),
                                TextEntry::make('profile.religion')
                                    ->formatStateUsing(fn ($state) => $state instanceof \App\Enums\Religion ? $state->label() : ($state ? str_replace('_', ' ', $state) : '-')),
                                IconEntry::make('profile.police_verified')
                                    ->boolean(),
                                IconEntry::make('profile.is_active')
                                    ->label('Profile active')
                                    ->boolean(),
                                TextEntry::make('profile.rating')
                                    ->numeric(decimalPlaces: 2)
                                    ->placeholder('-'),
                                TextEntry::make('profile.total_reviews')
                                    ->placeholder('-'),
                                TextEntry::make('profile.pin_address')
                                    ->label('Pinned address')
                                    ->placeholder('-')
                                    ->columnSpan(2),
                                TextEntry::make('profile.bio')
                                    ->placeholder('-')
                                    ->columnSpanFull(),
                            ]),
                    ]),
            ]);
    }
}
