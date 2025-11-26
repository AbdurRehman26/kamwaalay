<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Conversation;
use App\Models\JobApplication;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdditionalDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->seedJobApplications();
        $this->seedConversationsAndMessages();
    }

    private function seedJobApplications()
    {
        $bookings = Booking::where('status', 'pending')->get();
        $helpers = User::role('helper')->get();

        if ($bookings->isEmpty() || $helpers->isEmpty()) {
            $this->command->warn('No pending bookings or helpers found. Skipping job applications seeding.');
            return;
        }

        $this->command->info('Seeding job applications...');

        foreach ($bookings as $booking) {
            // 50% chance a booking gets applications
            if (rand(0, 1)) {
                // 1 to 3 helpers apply
                $applicants = $helpers->random(min($helpers->count(), rand(1, 3)));

                foreach ($applicants as $helper) {
                    // Check if already applied
                    if (JobApplication::where('booking_id', $booking->id)->where('user_id', $helper->id)->exists()) {
                        continue;
                    }

                    JobApplication::create([
                        'booking_id' => $booking->id,
                        'user_id' => $helper->id,
                        'message' => "I am interested in this job. I have experience in " . $booking->service_type . ".",
                        'proposed_rate' => rand(1000, 5000),
                        'status' => 'pending',
                        'applied_at' => now()->subHours(rand(1, 48)),
                    ]);
                }
            }
        }

        $this->command->info('Job applications seeded.');
    }

    private function seedConversationsAndMessages()
    {
        $users = User::role('user')->get();
        $helpers = User::role('helper')->get();
        $businesses = User::role('business')->get();

        $providers = $helpers->merge($businesses);

        if ($users->isEmpty() || $providers->isEmpty()) {
            $this->command->warn('No users or providers found. Skipping conversations seeding.');
            return;
        }

        $this->command->info('Seeding conversations and messages...');

        // Create conversations between random users and providers
        foreach ($users as $user) {
            // Each user talks to 1-2 providers
            $randomProviders = $providers->random(min($providers->count(), rand(1, 2)));

            foreach ($randomProviders as $provider) {
                $conversation = Conversation::getOrCreate($user->id, $provider->id);

                // Create 3-10 messages per conversation
                $messageCount = rand(3, 10);
                $lastMessageTime = now()->subDays(rand(1, 5));

                for ($i = 0; $i < $messageCount; $i++) {
                    $sender = ($i % 2 == 0) ? $user : $provider; // Alternate sender
                    $lastMessageTime = $lastMessageTime->addMinutes(rand(1, 60));

                    Message::create([
                        'conversation_id' => $conversation->id,
                        'sender_id' => $sender->id,
                        'message' => $this->getRandomMessage($i),
                        'is_read' => true,
                        'read_at' => $lastMessageTime->copy()->addMinutes(rand(1, 10)),
                        'created_at' => $lastMessageTime,
                        'updated_at' => $lastMessageTime,
                    ]);
                }

                // Update conversation last message time
                $conversation->update(['last_message_at' => $lastMessageTime]);
            }
        }

        $this->command->info('Conversations and messages seeded.');
    }

    private function getRandomMessage($index)
    {
        $messages = [
            0 => ["Hi, is this service available?", "Hello, I need help with cleaning.", "Are you available next week?"],
            1 => ["Yes, I am available.", "Hi! Yes, please tell me more.", "Sure, what are your requirements?"],
            2 => ["Great! What are your charges?", "I need someone for 3 hours.", "Can you come on Monday?"],
            3 => ["It depends on the work.", "I charge 500 per hour.", "Monday works for me."],
            4 => ["Okay, sounds good.", "Can we negotiate?", "I will book through the app."],
            5 => ["Sure, let me know.", "Price is fixed, sorry.", "Looking forward to it."],
        ];

        $bucket = $index % 6;
        return $messages[$bucket][array_rand($messages[$bucket])];
    }
}
