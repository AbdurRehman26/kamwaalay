<?php

namespace App\Notifications;

use App\Models\Document;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DocumentVerified extends Notification
{
    use Queueable;

    public $document;
    public $status;

    /**
     * Create a new notification instance.
     */
    public function __construct(Document $document, string $status)
    {
        $this->document = $document;
        $this->status = $status;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $messages = [
            'verified' => 'Your document has been verified',
            'rejected' => 'Your document has been rejected',
        ];

        $message = $messages[$this->status] ?? "Your document status has been updated to {$this->status}";
        $message .= ": {$this->document->document_type_label}";

        if ($this->document->admin_notes) {
            $message .= ". Note: {$this->document->admin_notes}";
        }

        return [
            'type' => 'document_verified',
            'title' => 'Document Status Updated',
            'message' => $message,
            'document_id' => $this->document->id,
            'document_type' => $this->document->document_type,
            'document_type_label' => $this->document->document_type_label,
            'status' => $this->status,
            'admin_notes' => $this->document->admin_notes,
        ];
    }
}
