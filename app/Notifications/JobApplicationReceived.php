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
        $jobPost = $this->application->jobPost;

        return [
            'type' => 'job_application_received',
            'title' => 'New Job Application Received',
            'message' => "{$applicant->name} has applied for your {$jobPost->service_type_label} job post.",
            'application_id' => $this->application->id,
            'job_post_id' => $jobPost->id,
            'booking_id' => $jobPost->id, // Backward compatibility
            'applicant_id' => $applicant->id,
            'applicant_name' => $applicant->name,
            'service_type' => $jobPost->service_type,
            'service_type_label' => $jobPost->service_type_label,
        ];
    }
}
