<?php

namespace App\Notifications;

use App\Models\JobApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class JobApplicationReceived extends Notification
{
    use Queueable;

    public $application;

    /**
     * Create a new notification instance.
     */
    public function __construct(JobApplication $application)
    {
        $this->application = $application;
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
        $applicant = $this->application->user;
        $booking = $this->application->booking;

        return [
            'type' => 'job_application_received',
            'title' => 'New Job Application Received',
            'message' => "{$applicant->name} has applied for your {$booking->service_type_label} service request.",
            'application_id' => $this->application->id,
            'booking_id' => $booking->id,
            'applicant_id' => $applicant->id,
            'applicant_name' => $applicant->name,
            'service_type' => $booking->service_type,
            'service_type_label' => $booking->service_type_label,
        ];
    }
}
