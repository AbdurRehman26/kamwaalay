<?php

namespace App\Filament\Resources\Users\Tables;

use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class UsersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('role')
                    ->badge()
                    ->sortable(),
                TextColumn::make('phone')
                    ->searchable()
                    ->copyable()
                    ->toggleable(),
                TextColumn::make('email')
                    ->searchable()
                    ->toggleable(),
                TextColumn::make('profile.city.name')
                    ->label('City')
                    ->toggleable(),
                TextColumn::make('profile.verification_status')
                    ->label('Verification')
                    ->badge()
                    ->color(fn (?string $state): string => match ($state) {
                        'verified' => 'success',
                        'rejected' => 'danger',
                        default => 'warning',
                    })
                    ->toggleable(),
                IconColumn::make('is_active')
                    ->boolean(),
                IconColumn::make('is_system_generated')
                    ->boolean()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('role')
                    ->options([
                        'user' => 'User',
                        'helper' => 'Helper',
                        'business' => 'Business',
                        'admin' => 'Admin',
                        'super_admin' => 'Super Admin',
                    ])
                    ->query(function ($query, array $data) {
                        if (blank($data['value'] ?? null)) {
                            return $query;
                        }

                        return $query->whereHas('roles', fn ($roleQuery) => $roleQuery->where('name', $data['value']));
                    }),
                SelectFilter::make('verification_status')
                    ->relationship('profile', 'verification_status')
                    ->options([
                        'pending' => 'Pending',
                        'verified' => 'Verified',
                        'rejected' => 'Rejected',
                    ]),
                SelectFilter::make('system_generated')
                    ->label('Source')
                    ->options([
                        '1' => 'System generated',
                        '0' => 'Manual',
                    ])
                    ->query(fn ($query, array $data) => blank($data['value'] ?? null) ? $query : $query->where('is_system_generated', (bool) $data['value'])),
            ])
            ->recordActions([
                ViewAction::make(),
                EditAction::make(),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
