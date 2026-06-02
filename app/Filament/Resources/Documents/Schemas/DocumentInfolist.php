<?php

namespace App\Filament\Resources\Documents\Schemas;

use Filament\Infolists\Components\ImageEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Support\Facades\Storage;

class DocumentInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Document')
                    ->schema([
                        Grid::make(3)
                            ->schema([
                                TextEntry::make('user.name')
                                    ->label('Owner')
                                    ->placeholder('-'),
                                TextEntry::make('document_type')
                                    ->badge(),
                                TextEntry::make('status')
                                    ->badge()
                                    ->color(fn (string $state): string => match ($state) {
                                        'verified' => 'success',
                                        'rejected' => 'danger',
                                        default => 'warning',
                                    }),
                                TextEntry::make('document_number')
                                    ->placeholder('-'),
                                TextEntry::make('created_at')
                                    ->dateTime(),
                                TextEntry::make('updated_at')
                                    ->dateTime(),
                                ImageEntry::make('file_path')
                                    ->label('Preview')
                                    ->disk('public')
                                    ->imageHeight(240)
                                    ->extraImgAttributes([
                                        'class' => 'rounded-2xl shadow-sm',
                                    ])
                                    ->visible(fn (?string $state): bool => self::isImagePath($state))
                                    ->url(fn ($record): string => Storage::url($record->file_path), true)
                                    ->columnSpanFull(),
                                TextEntry::make('file_path')
                                    ->label('File')
                                    ->formatStateUsing(fn (): string => 'Open file')
                                    ->url(fn ($record): string => Storage::url($record->file_path), true)
                                    ->openUrlInNewTab()
                                    ->columnSpanFull(),
                                TextEntry::make('admin_notes')
                                    ->placeholder('-')
                                    ->columnSpanFull(),
                            ]),
                    ]),
            ]);
    }

    private static function isImagePath(?string $path): bool
    {
        if (blank($path)) {
            return false;
        }

        return in_array(strtolower(pathinfo($path, PATHINFO_EXTENSION)), ['jpg', 'jpeg', 'png', 'gif', 'webp'], true);
    }
}
