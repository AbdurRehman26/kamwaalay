<?php

namespace App\Filament\Resources\Users\Schemas;

use Filament\Infolists\Components\IconEntry;
use Filament\Infolists\Components\ImageEntry;
use Filament\Infolists\Components\RepeatableEntry;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Schema;
use Illuminate\Support\Facades\Storage;

class UserInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Grid::make(3)
                    ->schema([
                        Section::make('Account summary')
                            ->description('Identity, role, login verification, and account state.')
                            ->icon('heroicon-o-user-circle')
                            ->columnSpan(2)
                            ->schema([
                                Grid::make(2)
                                    ->schema([
                                        TextEntry::make('name')
                                            ->label('Full name')
                                            ->weight('bold')
                                            ->size('lg'),
                                        TextEntry::make('roles.name')
                                            ->label('User role')
                                            ->badge()
                                            ->separator(', '),
                                        TextEntry::make('phone')
                                            ->copyable()
                                            ->placeholder('-'),
                                        TextEntry::make('email')
                                            ->copyable()
                                            ->placeholder('-'),
                                        TextEntry::make('otp_verified')
                                            ->label('User OTP')
                                            ->badge()
                                            ->getStateUsing(fn ($record): string => filled($record->phone_verified_at) ? 'Verified' : 'Not verified')
                                            ->color(fn (string $state): string => $state === 'Verified' ? 'success' : 'danger'),
                                        TextEntry::make('phone_verified_at')
                                            ->label('OTP verified at')
                                            ->dateTime()
                                            ->placeholder('-'),
                                        IconEntry::make('is_active')
                                            ->label('Account active')
                                            ->boolean(),
                                        IconEntry::make('is_system_generated')
                                            ->label('System generated')
                                            ->boolean(),
                                        TextEntry::make('address')
                                            ->placeholder('-')
                                            ->columnSpanFull(),
                                    ]),
                            ]),
                        Section::make('Profile snapshot')
                            ->description('Verification, profile photo, location, and public details.')
                            ->icon('heroicon-o-identification')
                            ->columnSpan(1)
                            ->schema([
                                ImageEntry::make('profile.photo')
                                    ->label('Profile photo')
                                    ->disk('public')
                                    ->imageSize(160)
                                    ->square()
                                    ->visible(fn (?string $state): bool => filled($state))
                                    ->columnSpanFull(),
                                TextEntry::make('profile.verification_status')
                                    ->label('Profile status')
                                    ->badge()
                                    ->color(fn (?string $state): string => match ($state) {
                                        'verified' => 'success',
                                        'rejected' => 'danger',
                                        default => 'warning',
                                    })
                                    ->placeholder('-'),
                                IconEntry::make('profile.is_active')
                                    ->label('Profile active')
                                    ->boolean(),
                                TextEntry::make('profile.city.name')
                                    ->label('City')
                                    ->placeholder('-'),
                                TextEntry::make('profile.experience_years')
                                    ->label('Experience')
                                    ->suffix(' years')
                                    ->placeholder('-'),
                                IconEntry::make('profile.police_verified')
                                    ->label('Police verified')
                                    ->boolean(),
                                TextEntry::make('profile.age')
                                    ->placeholder('-'),
                                TextEntry::make('profile.gender')
                                    ->placeholder('-'),
                                TextEntry::make('profile.religion')
                                    ->formatStateUsing(fn ($state) => $state instanceof \App\Enums\Religion ? $state->label() : ($state ? str_replace('_', ' ', $state) : '-')),
                                TextEntry::make('profile.pin_address')
                                    ->label('Pinned address')
                                    ->placeholder('-')
                                    ->columnSpanFull(),
                                TextEntry::make('profile.bio')
                                    ->label('Bio')
                                    ->placeholder('-')
                                    ->columnSpanFull(),
                            ]),
                    ]),
                Tabs::make('User activity')
                    ->persistTabInQueryString()
                    ->tabs([
                        Tab::make('Documents')
                            ->icon('heroicon-o-photo')
                            ->badge(fn ($record): int => $record->documents->count())
                            ->schema([
                                Section::make('Uploaded documents and images')
                                    ->description('Verification files uploaded by the user.')
                                    ->schema([
                                        RepeatableEntry::make('documents')
                                            ->label('Documents')
                                            ->placeholder('No documents uploaded.')
                                            ->grid(2)
                                            ->schema([
                                                Grid::make(2)
                                                    ->schema([
                                                        ImageEntry::make('file_path')
                                                            ->label('Preview')
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
                            ]),
                        Tab::make('Services')
                            ->icon('heroicon-o-wrench-screwdriver')
                            ->badge(fn ($record): int => $record->serviceListings->count())
                            ->schema([
                                Section::make('Services posted')
                                    ->description('Service listings offered by this user.')
                                    ->schema([
                                        RepeatableEntry::make('serviceListings')
                                            ->label('Services')
                                            ->placeholder('No services posted.')
                                            ->grid(2)
                                            ->schema([
                                                Grid::make(2)
                                                    ->schema([
                                                        TextEntry::make('serviceTypes.name')
                                                            ->label('Service types')
                                                            ->badge()
                                                            ->separator(', ')
                                                            ->placeholder('-')
                                                            ->columnSpanFull(),
                                                        TextEntry::make('work_type')
                                                            ->label('Work type')
                                                            ->formatStateUsing(fn (?string $state): string => filled($state) ? str_replace('_', ' ', $state) : '-')
                                                            ->badge(),
                                                        TextEntry::make('status')
                                                            ->badge()
                                                            ->color(fn (?string $state): string => $state === 'active' ? 'success' : 'gray')
                                                            ->placeholder('-'),
                                                        TextEntry::make('monthly_rate')
                                                            ->money('PKR')
                                                            ->placeholder('-'),
                                                        IconEntry::make('is_active')
                                                            ->label('Active')
                                                            ->boolean(),
                                                        TextEntry::make('description')
                                                            ->placeholder('-')
                                                            ->columnSpanFull(),
                                                    ]),
                                            ])
                                            ->columnSpanFull(),
                                    ]),
                            ]),
                        Tab::make('Jobs')
                            ->icon('heroicon-o-briefcase')
                            ->badge(fn ($record): int => $record->jobPosts->count())
                            ->schema([
                                Section::make('Jobs posted')
                                    ->description('Job requests created by this user.')
                                    ->schema([
                                        RepeatableEntry::make('jobPosts')
                                            ->label('Jobs')
                                            ->placeholder('No jobs posted.')
                                            ->grid(2)
                                            ->schema([
                                                Grid::make(2)
                                                    ->schema([
                                                        TextEntry::make('serviceType.name')
                                                            ->label('Service')
                                                            ->badge()
                                                            ->placeholder('-'),
                                                        TextEntry::make('status')
                                                            ->badge()
                                                            ->color(fn (?string $state): string => match ($state) {
                                                                'confirmed', 'completed' => 'success',
                                                                'cancelled' => 'danger',
                                                                'in_progress' => 'info',
                                                                default => 'warning',
                                                            })
                                                            ->placeholder('-'),
                                                        TextEntry::make('work_type')
                                                            ->label('Work type')
                                                            ->formatStateUsing(fn (?string $state): string => filled($state) ? str_replace('_', ' ', $state) : '-')
                                                            ->placeholder('-'),
                                                        TextEntry::make('estimated_salary')
                                                            ->money('PKR')
                                                            ->placeholder('-'),
                                                        TextEntry::make('cityRelation.name')
                                                            ->label('City')
                                                            ->placeholder('-'),
                                                        TextEntry::make('assignedUser.name')
                                                            ->label('Assigned helper')
                                                            ->placeholder('-'),
                                                        TextEntry::make('start_date')
                                                            ->date()
                                                            ->placeholder('-'),
                                                        TextEntry::make('start_time')
                                                            ->time()
                                                            ->placeholder('-'),
                                                        TextEntry::make('address')
                                                            ->placeholder('-')
                                                            ->columnSpanFull(),
                                                        TextEntry::make('special_requirements')
                                                            ->placeholder('-')
                                                            ->columnSpanFull(),
                                                    ]),
                                            ])
                                            ->columnSpanFull(),
                                    ]),
                            ]),
                    ])
                    ->columnSpanFull(),
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
