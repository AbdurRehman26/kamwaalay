<?php

namespace App\Filament\Resources\ContactMessages\Schemas;

use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class ContactMessageInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Contact Message')
                    ->schema([
                        Grid::make(2)
                            ->schema([
                                TextEntry::make('name'),
                                TextEntry::make('phone')
                                    ->placeholder('-'),
                                TextEntry::make('user.name')
                                    ->label('Linked user')
                                    ->placeholder('Guest'),
                                IconEntry::make('is_read')
                                    ->label('Read')
                                    ->boolean(),
                                TextEntry::make('ip_address')
                                    ->label('IP address')
                                    ->placeholder('-'),
                                TextEntry::make('responded_at')
                                    ->dateTime()
                                    ->placeholder('-'),
                                TextEntry::make('created_at')
                                    ->dateTime(),
                                TextEntry::make('updated_at')
                                    ->dateTime(),
                                TextEntry::make('message')
                                    ->columnSpanFull(),
                                TextEntry::make('user_agent')
                                    ->columnSpanFull()
                                    ->placeholder('-'),
                            ]),
                    ]),
            ]);
    }
}
