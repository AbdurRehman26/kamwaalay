<?php

namespace App\Filament\Resources\Users\Schemas;

use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\ImageEntry;
use Filament\Infolists\Components\RepeatableEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Support\Facades\Storage;

class UserInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Account')
                    ->schema([
                        Grid::make(3)
                            ->schema([
                                TextEntry::make('name'),
                                TextEntry::make('roles.name')
                                    ->label('User role')
                                    ->badge()
                                    ->separator(', '),
                                TextEntry::make('email')
                                    ->placeholder('-'),
                                TextEntry::make('phone')
                                    ->placeholder('-'),
                                TextEntry::make('address')
                                    ->placeholder('-')
                                    ->columnSpan(2),
                                IconEntry::make('is_active')
                                    ->boolean(),
                                IconEntry::make('is_system_generated')
                                    ->boolean(),
                                TextEntry::make('phone_verified_at')
                                    ->dateTime()
                                    ->placeholder('-'),
                            ]),
                    ]),
                Section::make('Profile')
                    ->schema([
                        Grid::make(3)
                            ->schema([
                                ImageEntry::make('profile.photo')
                                    ->label('Profile photo')
                                    ->disk('public')
                                    ->imageSize(160)
                                    ->square()
                                    ->visible(fn (?string $state): bool => filled($state))
                                    ->columnSpanFull(),
                                TextEntry::make('profile.city.name')
                                    ->label('City')
                                    ->placeholder('-'),
                                TextEntry::make('profile.verification_status')
                                    ->badge()
                                    ->color(fn (?string $state): string => match ($state) {
                                        'verified' => 'success',
                                        'rejected' => 'danger',
                                        default => 'warning',
                                    })
                                    ->placeholder('-'),
                                TextEntry::make('profile.experience_years')
                                    ->label('Experience')
                                    ->suffix(' years')
                                    ->placeholder('-'),
                                TextEntry::make('profile.age')
                                    ->placeholder('-'),
                                TextEntry::make('profile.gender')
                                    ->placeholder('-'),
                                TextEntry::make('profile.religion')
                                    ->formatStateUsing(fn ($state) => $state instanceof \App\Enums\Religion ? $state->label() : ($state ? str_replace('_', ' ', $state) : '-')),
                                IconEntry::make('profile.police_verified')
                                    ->boolean(),
                                IconEntry::make('profile.is_active')
                                    ->label('Profile active')
                                    ->boolean(),
                                TextEntry::make('profile.rating')
                                    ->numeric(decimalPlaces: 2)
                                    ->placeholder('-'),
                                TextEntry::make('profile.total_reviews')
                                    ->placeholder('-'),
                                TextEntry::make('profile.pin_address')
                                    ->label('Pinned address')
                                    ->placeholder('-')
                                    ->columnSpan(2),
                                TextEntry::make('profile.bio')
                                    ->placeholder('-')
                                    ->columnSpanFull(),
                            ]),
                    ]),
                Section::make('Uploaded images')
                    ->schema([
                        RepeatableEntry::make('documents')
                            ->label('Documents')
                            ->placeholder('No documents uploaded.')
                            ->grid(2)
                            ->schema([
                                Grid::make(2)
                                    ->schema([
                                        ImageEntry::make('file_path')
                                            ->label('Image')
                                            ->disk('public')
                                            ->imageHeight(180)
                                            ->visible(fn (?string $state): bool => self::isImagePath($state))
                                            ->url(fn (?string $state): ?string => filled($state) ? Storage::disk('public')->url($state) : null, true)
                                            ->columnSpanFull(),
                                        TextEntry::make('document_type')
                                            ->label('Type')
                                            ->badge(),
                                        TextEntry::make('status')
                                            ->badge()
                                            ->color(fn (string $state): string => match ($state) {
                                                'verified' => 'success',
                                                'rejected' => 'danger',
                                                default => 'warning',
                                            }),
                                        TextEntry::make('document_number')
                                            ->label('Number')
                                            ->placeholder('-'),
                                        TextEntry::make('file_path')
                                            ->label('File')
                                            ->formatStateUsing(fn (?string $state): string => filled($state) ? 'Open file' : '-')
                                            ->url(fn (?string $state): ?string => filled($state) ? Storage::disk('public')->url($state) : null, true)
                                            ->openUrlInNewTab(),
                                    ]),
                            ])
                            ->columnSpanFull(),
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
