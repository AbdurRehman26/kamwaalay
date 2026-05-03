<?php

namespace App\Filament\Resources\JobPosts\Tables;

use Filament\Actions\EditAction;
use Filament\Actions\ViewAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class JobPostsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('serviceType.name')
                    ->label('Service')
                    ->sortable(),
                TextColumn::make('user.name')
                    ->label('Requested by')
                    ->searchable()
                    ->toggleable(),
                TextColumn::make('assignedUser.name')
                    ->label('Assigned helper')
                    ->searchable()
                    ->toggleable(),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'confirmed', 'completed' => 'success',
                        'cancelled' => 'danger',
                        'in_progress' => 'info',
                        default => 'warning',
                    })
                    ->sortable(),
                TextColumn::make('work_type')
                    ->badge(),
                TextColumn::make('cityRelation.name')
                    ->label('City')
                    ->toggleable(),
                TextColumn::make('start_date')
                    ->date()
                    ->sortable()
                    ->toggleable(),
                TextColumn::make('estimated_salary')
                    ->money('PKR')
                    ->sortable()
                    ->toggleable(),
                IconColumn::make('is_system_generated')
                    ->boolean()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->options([
                        'pending' => 'Pending',
                        'confirmed' => 'Confirmed',
                        'in_progress' => 'In progress',
                        'completed' => 'Completed',
                        'cancelled' => 'Cancelled',
                    ]),
                SelectFilter::make('work_type')
                    ->options([
                        'full_time' => 'Full time',
                        'part_time' => 'Part time',
                    ]),
                SelectFilter::make('service_type_id')
                    ->label('Service type')
                    ->relationship('serviceType', 'name'),
            ])
            ->recordActions([
                ViewAction::make(),
                EditAction::make(),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
