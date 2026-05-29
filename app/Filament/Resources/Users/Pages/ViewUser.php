<?php

namespace App\Filament\Resources\Users\Pages;

use App\Filament\Resources\Users\UserResource;
use Filament\Actions\Action;
use Filament\Actions\EditAction;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ViewRecord;

class ViewUser extends ViewRecord
{
    protected static string $resource = UserResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Action::make('approveProfile')
                ->label('Approve profile')
                ->color('success')
                ->icon('heroicon-o-check-badge')
                ->requiresConfirmation()
                ->visible(fn (): bool => $this->record->profile?->verification_status !== 'verified')
                ->action(function (): void {
                    $this->record->profile()->updateOrCreate(
                        [
                            'profileable_id' => $this->record->id,
                            'profileable_type' => $this->record::class,
                        ],
                        [
                            'verification_status' => 'verified',
                            'is_active' => true,
                        ],
                    );

                    $this->record->refresh();

                    Notification::make()
                        ->title('User profile approved')
                        ->success()
                        ->send();
                }),
            EditAction::make(),
        ];
    }
}
