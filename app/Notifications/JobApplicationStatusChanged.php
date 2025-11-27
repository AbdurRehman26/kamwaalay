<?php

namespace App\Notifications;

use App\Models\JobApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class JobApplicationStatusChanged extends Notification
{
    use Queueable;

    public $application;
    public $oldStatus;
    public $newStatus;

    /**
     * Create a new notification instance.
     */
    public function __construct(JobApplication $application, string $oldStatus, string $newStatus)
    {
        $this->application = $application;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
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
        $booking = $this->application->booking;
        $bookingOwner = $booking->user;

        $statusMessages = [
            'accepted' => 'Your application has been accepted',
            'rejected' => 'Your application has been rejected',
            'withdrawn' => 'Your application has been withdrawn',
        ];

        $message = $statusMessages[$this->newStatus] ?? "Your application status has been changed to {$this->newStatus}";
        $message .= " for the {$booking->service_type_label} service request.";

        return [
            'type' => 'job_application_status_changed',
            'title' => 'Application Status Updated',
            'message' => $message,
            'application_id' => $this->application->id,
            'booking_id' => $booking->id,
            'booking_owner_name' => $bookingOwner->name,
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
            'service_type' => $booking->service_type,
            'service_type_label' => $booking->service_type_label,
        ];
    }
}
