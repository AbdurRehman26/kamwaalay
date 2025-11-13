<?php

use App\Models\User;
use App\Models\Conversation;
use App\Models\Message;
use App\Events\MessageSent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    if (!Role::where('name', 'user')->exists()) {
        Role::create(['name' => 'user']);
    }
    if (!Role::where('name', 'helper')->exists()) {
        Role::create(['name' => 'helper']);
    }
});

test('MessageSent event is broadcasted when message is sent', function () {
    Event::fake();
    
    $user1 = User::factory()->create();
    $user1->assignRole('user');
    
    $user2 = User::factory()->create();
    $user2->assignRole('helper');
    
    $conversation = Conversation::getOrCreate($user1->id, $user2->id);
    $message = Message::factory()->create([
        'conversation_id' => $conversation->id,
        'sender_id' => $user1->id,
        'message' => 'Test message',
    ]);
    
    $message->load('sender:id,name,photo');
    
    event(new MessageSent($message, $conversation));
    
    Event::assertDispatched(MessageSent::class, function ($event) use ($message, $conversation) {
        return $event->message->id === $message->id
            && $event->conversation->id === $conversation->id;
    });
});

test('MessageSent event broadcasts on correct channel', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    
    $conversation = Conversation::getOrCreate($user1->id, $user2->id);
    $message = Message::factory()->create([
        'conversation_id' => $conversation->id,
        'sender_id' => $user1->id,
    ]);
    
    $message->load('sender:id,name,photo');
    
    $event = new MessageSent($message, $conversation);
    $channels = $event->broadcastOn();
    
    expect($channels)->toHaveCount(1);
    expect($channels[0]->name)->toBe('conversation.' . $conversation->id);
});

test('MessageSent event has correct broadcast name', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    
    $conversation = Conversation::getOrCreate($user1->id, $user2->id);
    $message = Message::factory()->create([
        'conversation_id' => $conversation->id,
        'sender_id' => $user1->id,
    ]);
    
    $message->load('sender:id,name,photo');
    
    $event = new MessageSent($message, $conversation);
    
    expect($event->broadcastAs())->toBe('message.sent');
});

test('MessageSent event broadcasts correct data', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    
    $conversation = Conversation::getOrCreate($user1->id, $user2->id);
    $message = Message::factory()->create([
        'conversation_id' => $conversation->id,
        'sender_id' => $user1->id,
        'message' => 'Test message content',
    ]);
    
    $message->load('sender:id,name,photo');
    
    $event = new MessageSent($message, $conversation);
    $broadcastData = $event->broadcastWith();
    
    expect($broadcastData)->toHaveKeys(['message', 'conversation_id']);
    expect($broadcastData['message']['id'])->toBe($message->id);
    expect($broadcastData['message']['message'])->toBe('Test message content');
    expect($broadcastData['message']['sender_id'])->toBe($user1->id);
    expect($broadcastData['conversation_id'])->toBe($conversation->id);
    expect($broadcastData['message']['sender'])->toHaveKeys(['id', 'name', 'photo']);
});

