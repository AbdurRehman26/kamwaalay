<?php

namespace App\Filament\Resources\Users\RelationManagers;

use Filament\Resources\RelationManagers\RelationManager;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class DocumentsRelationManager extends RelationManager
{
    protected static string $relationship = 'documents';

    protected static ?string $title = 'Documents';

    protected static string | \BackedEnum | null $icon = Heroicon::DocumentText;

    public static function getBadge(Model $ownerRecord, string $pageClass): ?string
    {
        return (string) $ownerRecord->documents()->count();
    }

    public function table(Table $table): Table
    {
        return $table
            ->heading('Verification documents')
            ->columns([
                ImageColumn::make('file_path')
                    ->label('Preview')
                    ->disk('public')
                    ->imageSize(44)
                    ->extraImgAttributes([
                        'class' => 'rounded-xl',
                    ]),
                TextColumn::make('document_type')
                    ->label('Type')
                    ->badge(),
                TextColumn::make('document_number')
                    ->label('Number')
                    ->placeholder('-')
                    ->searchable(),
                TextColumn::make('status')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'verified' => 'success',
                        'rejected' => 'danger',
                        default => 'warning',
                    }),
                TextColumn::make('file_path')
                    ->label('File')
                    ->formatStateUsing(fn (): string => 'Open file')
                    ->url(fn ($record): string => Storage::url($record->file_path), true)
                    ->openUrlInNewTab(),
                TextColumn::make('updated_at')
                    ->label('Updated')
                    ->since()
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->options([
                        'pending' => 'Pending',
                        'verified' => 'Verified',
                        'rejected' => 'Rejected',
                    ]),
            ])
            ->headerActions([])
            ->recordActions([])
            ->toolbarActions([])
            ->emptyStateHeading('No documents yet')
            ->defaultSort('created_at', 'desc');
    }
}
