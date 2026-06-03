<?php

namespace App\Filament\Resources\ContactMessages\Tables;

use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class ContactMessagesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('phone')
                    ->searchable()
                    ->placeholder('-')
                    ->toggleable(),
                TextColumn::make('user.name')
                    ->label('Linked user')
                    ->searchable()
                    ->placeholder('Guest'),
                TextColumn::make('message')
                    ->limit(60)
                    ->searchable(),
                IconColumn::make('is_read')
                    ->label('Read')
                    ->boolean(),
                TextColumn::make('responded_at')
                    ->dateTime()
                    ->placeholder('-')
                    ->toggleable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('is_read')
                    ->label('Read state')
                    ->options([
                        '0' => 'Unread',
                        '1' => 'Read',
                    ]),
                SelectFilter::make('user_link')
                    ->label('Sender type')
                    ->options([
                        'guest' => 'Guest',
                        'user' => 'Linked user',
                    ])
                    ->query(function ($query, array $data) {
                        return match ($data['value'] ?? null) {
                            'guest' => $query->whereNull('user_id'),
                            'user' => $query->whereNotNull('user_id'),
                            default => $query,
                        };
                    }),
            ])
            ->recordActions([
                ViewAction::make(),
                EditAction::make(),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
