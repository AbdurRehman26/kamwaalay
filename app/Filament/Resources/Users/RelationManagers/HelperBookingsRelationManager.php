<?php

namespace App\Filament\Resources\Users\RelationManagers;

use Filament\Resources\RelationManagers\RelationManager;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Model;

class HelperBookingsRelationManager extends RelationManager
{
    protected static string $relationship = 'helperBookings';

    protected static ?string $title = 'Assigned Jobs';

    protected static string | \BackedEnum | null $icon = Heroicon::CheckBadge;

    public static function canViewForRecord(Model $ownerRecord, string $pageClass): bool
    {
        return method_exists($ownerRecord, 'isHelper') && $ownerRecord->isHelper();
    }

    public static function getBadge(Model $ownerRecord, string $pageClass): ?string
    {
        return (string) $ownerRecord->helperBookings()->count();
    }

    public function table(Table $table): Table
    {
        return $table
            ->heading('Assigned jobs')
            ->columns([
                TextColumn::make('serviceType.name')
                    ->label('Service')
                    ->badge(),
                TextColumn::make('user.name')
                    ->label('Customer')
                    ->searchable()
                    ->placeholder('-'),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'confirmed', 'completed' => 'success',
                        'cancelled' => 'danger',
                        'in_progress' => 'info',
                        default => 'warning',
                    }),
                TextColumn::make('start_date')
                    ->date()
                    ->placeholder('-'),
                TextColumn::make('cityRelation.name')
                    ->label('City')
                    ->placeholder('-'),
                TextColumn::make('created_at')
                    ->label('Created')
                    ->since()
                    ->sortable(),
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
            ])
            ->headerActions([])
            ->recordActions([])
            ->toolbarActions([])
            ->emptyStateHeading('No assigned jobs found')
            ->defaultSort('created_at', 'desc');
    }
}
