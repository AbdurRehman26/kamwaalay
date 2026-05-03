<?php

namespace App\Filament\Resources\Documents\Pages;

use App\Filament\Resources\Documents\DocumentResource;
use App\Notifications\DocumentVerified;
use Filament\Actions\ViewAction;
use Filament\Resources\Pages\EditRecord;

class EditDocument extends EditRecord
{
    protected static string $resource = DocumentResource::class;

    protected ?string $oldStatus = null;

    protected function getHeaderActions(): array
    {
        return [
            ViewAction::make(),
        ];
    }

    protected function beforeSave(): void
    {
        $this->oldStatus = $this->record->status;
    }

    protected function afterSave(): void
    {
        $document = $this->record->fresh(['helper.documents', 'helper.profile', 'user']);

        if ($document->status === 'verified') {
            $helper = $document->helper;

            if ($helper) {
                $allVerified = $helper->documents()
                    ->where('status', '!=', 'verified')
                    ->count() === 0;

                if ($allVerified && $helper->documents()->where('status', 'verified')->exists()) {
                    $helper->profile()->updateOrCreate(
                        ['profileable_id' => $helper->id, 'profileable_type' => 'App\Models\User'],
                        ['verification_status' => 'verified']
                    );
                }
            }
        }

        if (
            filled($this->oldStatus) &&
            $this->oldStatus !== $document->status &&
            in_array($document->status, ['verified', 'rejected'], true)
        ) {
            $document->user?->notify(new DocumentVerified($document, $document->status));
        }
    }
}
