<?php

namespace App\Notifications;

use App\Models\Message;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewMessage extends Notification
{
    use Queueable;

    public $message;

    /**
     * Create a new notification instance.
     */
    public function __construct(Message $message)
    {
        $this->message = $message;
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
        $sender = $this->message->sender;
        $conversation = $this->message->conversation;

        return [
            'type' => 'new_message',
            'title' => 'New Message',
            'message' => "You have a new message from {$sender->name}",
            'message_id' => $this->message->id,
            'conversation_id' => $conversation->id,
            'sender_id' => $sender->id,
            'sender_name' => $sender->name,
            'message_preview' => substr($this->message->message, 0, 100),
        ];
    }
}
