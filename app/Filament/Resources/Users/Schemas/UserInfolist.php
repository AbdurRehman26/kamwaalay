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
                Section::make('Profile overview')
                    ->description('A quick read on identity, trust, profile completeness, and marketplace activity.')
                    ->icon('heroicon-o-sparkles')
                    ->schema([
                        Grid::make(5)
                            ->schema([
                                ImageEntry::make('profile.photo')
                                    ->label('Photo')
                                    ->disk('public')
                                    ->imageSize(140)
                                    ->circular()
                                    ->visible(fn (?string $state): bool => filled($state)),
                                TextEntry::make('name')
                                    ->label('Full name')
                                    ->weight('bold')
                                    ->size('xl')
                                    ->columnSpan(2),
                                TextEntry::make('roles.name')
                                    ->label('Role')
                                    ->badge()
                                    ->separator(', '),
                                TextEntry::make('profile.verification_status')
                                    ->label('Profile approval')
                                    ->badge()
                                    ->color(fn (?string $state): string => self::profileStatusColor($state))
                                    ->placeholder('Pending'),
                                TextEntry::make('phone')
                                    ->copyable()
                                    ->placeholder('-'),
                                TextEntry::make('otp_verified')
                                    ->label('OTP status')
                                    ->badge()
                                    ->getStateUsing(fn ($record): string => filled($record->phone_verified_at) ? 'Verified' : 'Not verified')
                                    ->color(fn (string $state): string => $state === 'Verified' ? 'success' : 'danger'),
                                TextEntry::make('profile_quality')
                                    ->label('Profile quality')
                                    ->badge()
                                    ->getStateUsing(fn ($record): string => self::profileQualityLabel($record))
                                    ->color(fn (string $state): string => match ($state) {
                                        'Complete' => 'success',
                                        'Good' => 'info',
                                        default => 'warning',
                                    }),
                                TextEntry::make('activity_summary')
                                    ->label('Activity')
                                    ->getStateUsing(fn ($record): string => sprintf(
                                        '%d document(s), %d service(s), %d job(s)',
                                        $record->documents->count(),
                                        $record->serviceListings->count(),
                                        $record->jobPosts->count(),
                                    ))
                                    ->columnSpan(2),
                            ]),
                    ]),
                Grid::make(3)
                    ->schema([
                        Section::make('Account')
                            ->description('Contact details and platform state.')
                            ->icon('heroicon-o-user-circle')
                            ->schema([
                                Grid::make(1)
                                    ->schema([
                                        TextEntry::make('email')
                                            ->copyable()
                                            ->placeholder('-'),
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
                                            ->placeholder('-'),
                                    ]),
                            ]),
                        Section::make('Profile')
                            ->description('Demographics and public profile content.')
                            ->icon('heroicon-o-identification')
                            ->schema([
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
                            ]),
                        Section::make('Trust & location')
                            ->description('Approval signals and pinned service area.')
                            ->icon('heroicon-o-shield-check')
                            ->schema([
                                IconEntry::make('profile.is_active')
                                    ->label('Profile active')
                                    ->boolean(),
                                IconEntry::make('profile.police_verified')
                                    ->label('Police verified')
                                    ->boolean(),
                                TextEntry::make('profile.city.name')
                                    ->label('City')
                                    ->placeholder('-'),
                                TextEntry::make('profile.experience_years')
                                    ->label('Experience')
                                    ->suffix(' years')
                                    ->placeholder('-'),
                                TextEntry::make('profile.pin_address')
                                    ->label('Pinned address')
                                    ->placeholder('-')
                                    ->columnSpanFull(),
                            ]),
                    ]),
                Section::make('Public bio')
                    ->description('The customer-facing summary shown around the marketplace.')
                    ->icon('heroicon-o-document-text')
                    ->schema([
                        TextEntry::make('profile.bio')
                            ->hiddenLabel()
                            ->placeholder('No bio added yet.')
                            ->columnSpanFull(),
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
                                            ->hiddenLabel()
                                            ->placeholder('No documents uploaded.')
                                            ->grid(3)
                                            ->schema([
                                                Grid::make(2)
                                                    ->schema([
                                                        ImageEntry::make('file_path')
                                                            ->label('Preview')
                                                            ->disk('public')
                                                            ->imageHeight(220)
                                                            ->extraImgAttributes([
                                                                'class' => 'rounded-2xl shadow-sm',
                                                            ])
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
                                                        TextEntry::make('created_at')
                                                            ->label('Uploaded')
                                                            ->dateTime()
                                                            ->placeholder('-'),
                                                        TextEntry::make('file_path')
                                                            ->label('File')
                                                            ->formatStateUsing(fn (?string $state): string => filled($state) ? 'Open file' : '-')
                                                            ->url(fn (?string $state): ?string => filled($state) ? Storage::disk('public')->url($state) : null, true)
                                                            ->openUrlInNewTab()
                                                            ->columnSpanFull(),
                                                        TextEntry::make('admin_notes')
                                                            ->label('Admin notes')
                                                            ->placeholder('-')
                                                            ->columnSpanFull(),
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
                                            ->hiddenLabel()
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
                                            ->hiddenLabel()
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

    private static function profileStatusColor(?string $state): string
    {
        return match ($state) {
            'verified' => 'success',
            'rejected' => 'danger',
            default => 'warning',
        };
    }

    private static function profileQualityLabel($record): string
    {
        $profile = $record->profile;

        if (! $profile) {
            return 'Needs attention';
        }

        $completed = collect([
            $profile->bio,
            $profile->city_id,
            $profile->pin_address,
            $profile->age,
            $profile->gender,
            $profile->experience_years,
            $profile->verification_status === 'verified',
            filled($record->phone_verified_at),
        ])->filter(fn ($value): bool => filled($value))->count();

        return match (true) {
            $completed >= 7 => 'Complete',
            $completed >= 5 => 'Good',
            default => 'Needs attention',
        };
    }
}
