<?php

namespace App\Filament\Resources\ContactMessages\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class ContactMessageForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Message')
                    ->schema([
                        Grid::make(2)
                            ->schema([
                                TextInput::make('name')
                                    ->disabled()
                                    ->dehydrated(false),
                                TextInput::make('phone')
                                    ->disabled()
                                    ->dehydrated(false)
                                    ->placeholder('-'),
                                TextInput::make('user.name')
                                    ->label('Linked user')
                                    ->disabled()
                                    ->dehydrated(false)
                                    ->placeholder('Guest'),
                                TextInput::make('ip_address')
                                    ->label('IP address')
                                    ->disabled()
                                    ->dehydrated(false)
                                    ->placeholder('-'),
                                Toggle::make('is_read'),
                                DateTimePicker::make('responded_at'),
                            ]),
                        Textarea::make('message')
                            ->disabled()
                            ->dehydrated(false)
                            ->rows(6)
                            ->columnSpanFull(),
                        Textarea::make('user_agent')
                            ->disabled()
                            ->dehydrated(false)
                            ->rows(3)
                            ->columnSpanFull(),
                    ]),
            ]);
    }
}
