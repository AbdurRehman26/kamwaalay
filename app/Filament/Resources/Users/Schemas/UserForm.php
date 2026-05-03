<?php

namespace App\Filament\Resources\Users\Schemas;

use App\Enums\Religion;
use App\Models\City;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class UserForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Account')
                    ->schema([
                        Grid::make(2)
                            ->schema([
                                TextInput::make('name')
                                    ->required()
                                    ->maxLength(255),
                                TextInput::make('email')
                                    ->email()
                                    ->unique(ignoreRecord: true)
                                    ->maxLength(255),
                                TextInput::make('phone')
                                    ->tel()
                                    ->maxLength(20),
                                DateTimePicker::make('phone_verified_at'),
                                Toggle::make('is_active'),
                                Toggle::make('is_system_generated')
                                    ->disabled(),
                                TextInput::make('password')
                                    ->password()
                                    ->revealable()
                                    ->dehydrated(fn ($state): bool => filled($state))
                                    ->maxLength(255)
                                    ->helperText('Leave blank to keep the current password.'),
                            ]),
                        Textarea::make('address')
                            ->rows(3)
                            ->columnSpanFull(),
                    ]),
                Section::make('Profile')
                    ->relationship('profile')
                    ->schema([
                        Grid::make(2)
                            ->schema([
                                Select::make('city_id')
                                    ->label('City')
                                    ->options(City::query()->orderBy('name')->pluck('name', 'id'))
                                    ->searchable()
                                    ->preload(),
                                Select::make('verification_status')
                                    ->options([
                                        'pending' => 'Pending',
                                        'verified' => 'Verified',
                                        'rejected' => 'Rejected',
                                    ]),
                                TextInput::make('age')
                                    ->numeric()
                                    ->minValue(18)
                                    ->maxValue(100),
                                TextInput::make('experience_years')
                                    ->numeric()
                                    ->minValue(0),
                                Select::make('gender')
                                    ->options([
                                        'male' => 'Male',
                                        'female' => 'Female',
                                        'other' => 'Other',
                                    ]),
                                Select::make('religion')
                                    ->options(Religion::options()),
                                Toggle::make('police_verified'),
                                Toggle::make('is_active')
                                    ->label('Profile active'),
                            ]),
                        Textarea::make('bio')
                            ->rows(4)
                            ->columnSpanFull(),
                        Textarea::make('pin_address')
                            ->label('Pinned address')
                            ->rows(2)
                            ->columnSpanFull(),
                    ]),
            ]);
    }
}
