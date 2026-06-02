<?php

namespace App\Filament\Resources\Users\RelationManagers;

use Filament\Resources\RelationManagers\RelationManager;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Model;

class JobPostsRelationManager extends RelationManager
{
    protected static string $relationship = 'jobPosts';

    protected static ?string $title = 'Requests';

    protected static string | \BackedEnum | null $icon = Heroicon::Briefcase;

    public static function canViewForRecord(Model $ownerRecord, string $pageClass): bool
    {
        return method_exists($ownerRecord, 'isUser') && ($ownerRecord->isUser() || $ownerRecord->isBusiness() || $ownerRecord->jobPosts()->exists());
    }

    public static function getBadge(Model $ownerRecord, string $pageClass): ?string
    {
        return (string) $ownerRecord->jobPosts()->count();
    }

    public function table(Table $table): Table
    {
        return $table
            ->heading('Created bookings')
            ->columns([
                TextColumn::make('serviceType.name')
                    ->label('Service')
                    ->badge(),
                TextColumn::make('assignedUser.name')
                    ->label('Assigned helper')
                    ->placeholder('-')
                    ->searchable(),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'confirmed', 'completed' => 'success',
                        'cancelled' => 'danger',
                        'in_progress' => 'info',
                        default => 'warning',
                    }),
                TextColumn::make('work_type')
                    ->badge(),
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
            ->emptyStateHeading('No requests found')
            ->defaultSort('created_at', 'desc');
    }
}
