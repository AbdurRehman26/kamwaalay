<?php

namespace App\Filament\Resources\JobPosts\Schemas;

use App\Models\City;
use App\Models\ServiceType;
use App\Models\User;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TimePicker;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class JobPostForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Booking Details')
                    ->schema([
                        Grid::make(2)
                            ->schema([
                                Select::make('user_id')
                                    ->label('Requested by')
                                    ->options(User::query()->orderBy('name')->pluck('name', 'id'))
                                    ->searchable()
                                    ->preload()
                                    ->required(),
                                Select::make('assigned_user_id')
                                    ->label('Assigned helper')
                                    ->options(
                                        User::query()
                                            ->role('helper')
                                            ->orderBy('name')
                                            ->pluck('name', 'id')
                                    )
                                    ->searchable()
                                    ->preload(),
                                Select::make('service_type_id')
                                    ->label('Service type')
                                    ->options(ServiceType::query()->orderBy('name')->pluck('name', 'id'))
                                    ->searchable()
                                    ->preload()
                                    ->required(),
                                Select::make('city_id')
                                    ->label('City')
                                    ->options(City::query()->orderBy('name')->pluck('name', 'id'))
                                    ->searchable()
                                    ->preload(),
                                Select::make('work_type')
                                    ->options([
                                        'full_time' => 'Full time',
                                        'part_time' => 'Part time',
                                    ])
                                    ->required(),
                                Select::make('status')
                                    ->options([
                                        'pending' => 'Pending',
                                        'confirmed' => 'Confirmed',
                                        'in_progress' => 'In progress',
                                        'completed' => 'Completed',
                                        'cancelled' => 'Cancelled',
                                    ])
                                    ->required(),
                                DatePicker::make('start_date'),
                                TimePicker::make('start_time')
                                    ->seconds(false),
                                TextInput::make('estimated_salary')
                                    ->numeric()
                                    ->prefix('PKR'),
                                Toggle::make('is_system_generated')
                                    ->disabled(),
                            ]),
                    ]),
                Section::make('Customer Contact')
                    ->schema([
                        Grid::make(2)
                            ->schema([
                                TextInput::make('name')
                                    ->required()
                                    ->maxLength(255),
                                TextInput::make('phone')
                                    ->tel()
                                    ->required()
                                    ->maxLength(255),
                                Textarea::make('address')
                                    ->rows(3)
                                    ->columnSpanFull(),
                                Textarea::make('special_requirements')
                                    ->rows(4)
                                    ->columnSpanFull(),
                                Textarea::make('admin_notes')
                                    ->rows(4)
                                    ->columnSpanFull(),
                            ]),
                    ]),
            ]);
    }
}
