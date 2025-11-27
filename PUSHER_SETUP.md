# Pusher Setup Guide

This guide will help you set up Pusher for real-time messaging in your application.

## Prerequisites

1. A Pusher account (sign up at https://pusher.com/)
2. A Pusher app created in your dashboard
3. Your Pusher credentials (App ID, Key, Secret, Cluster)

## Configuration Steps

### 1. Get Your Pusher Credentials

1. Log in to your Pusher Dashboard: https://dashboard.pusher.com/
2. Create a new app or select an existing one
3. Go to **App Keys** tab
4. Copy the following:
   - **App ID**
   - **Key** (this is your `PUSHER_APP_KEY`)
   - **Secret** (this is your `PUSHER_APP_SECRET`)
   - **Cluster** (e.g., `mt1`, `eu`, `ap-southeast-1`)

### 2. Add Environment Variables

Add the following to your `.env` file:

```env
# Broadcasting Driver
BROADCAST_CONNECTION=pusher

# Pusher Configuration
PUSHER_APP_ID=your_app_id_here
PUSHER_APP_KEY=your_app_key_here
PUSHER_APP_SECRET=your_app_secret_here
PUSHER_APP_CLUSTER=mt1

# Optional Pusher Settings
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
```

**Important Notes:**
- `BROADCAST_CONNECTION` must be set to `pusher` to enable Pusher broadcasting
- `PUSHER_APP_CLUSTER` should match the cluster where your Pusher app is hosted
- Common clusters: `mt1` (US East), `eu` (Europe), `ap-southeast-1` (Singapore)

### 3. Frontend Configuration

The frontend is already configured to use Pusher. Add these to your `.env` file (for Vite):

```env
VITE_PUSHER_APP_KEY="${PUSHER_APP_KEY}"
VITE_PUSHER_APP_CLUSTER="${PUSHER_APP_CLUSTER}"
```

Or directly:

```env
VITE_PUSHER_APP_KEY=your_app_key_here
VITE_PUSHER_APP_CLUSTER=mt1
```

**Note:** After updating `.env`, restart your Vite dev server:
```bash
npm run dev
```

### 4. Clear Configuration Cache

After updating your `.env` file, clear the configuration cache:

```bash
php artisan config:clear
php artisan cache:clear
```

### 5. Queue Configuration (Recommended)

For production, you should use queues for broadcasting. Update your `.env`:

```env
QUEUE_CONNECTION=database
```

Then run the queue worker:

```bash
php artisan queue:work
```

Or use a process manager like Supervisor in production.

## Testing

### 1. Test Broadcasting Authentication

The broadcasting authentication endpoint is already set up at `/api/broadcasting/auth`. It requires authentication via Sanctum.

### 2. Test Real-time Messaging

1. Log in to your application
2. Navigate to the Messages page
3. Start a conversation with another user
4. Send a message - it should appear in real-time for both users

### 3. Check Pusher Dashboard

1. Go to your Pusher Dashboard
2. Navigate to **Debug Console**
3. You should see events being published when messages are sent

## Troubleshooting

### Messages Not Appearing in Real-time

1. **Check Broadcasting Driver**: Ensure `BROADCAST_CONNECTION=pusher` in `.env`
2. **Check Credentials**: Verify all Pusher credentials are correct
3. **Check Frontend**: Ensure `VITE_PUSHER_APP_KEY` and `VITE_PUSHER_APP_CLUSTER` are set
4. **Check Console**: Open browser console for any Pusher connection errors
5. **Check Queue**: If using queues, ensure queue worker is running

### Authentication Errors

1. **Check Sanctum**: Ensure user is authenticated
2. **Check Token**: Verify the Bearer token is being sent correctly
3. **Check Routes**: Ensure `Broadcast::routes()` is in `routes/api.php`

### Common Errors

- **"Pusher connection failed"**: Check your Pusher credentials and cluster
- **"Authentication failed"**: Check your Sanctum token and broadcasting auth route
- **"Channel not found"**: Ensure the channel name matches between frontend and backend

## Production Considerations

1. **Use Queues**: Always use queues for broadcasting in production
2. **Monitor Usage**: Keep an eye on your Pusher usage and costs
3. **Error Handling**: Implement proper error handling for failed broadcasts
4. **Rate Limiting**: Consider rate limiting for message sending
5. **SSL/TLS**: Ensure your production environment uses HTTPS

## Support

For Pusher-specific issues, refer to:
- Pusher Documentation: https://pusher.com/docs/
- Laravel Broadcasting: https://laravel.com/docs/broadcasting
- Pusher Support: https://support.pusher.com/

## Current Implementation

The application uses Pusher for:
- **Real-time chat messaging**: Messages are broadcast to conversation channels
- **Channel**: `conversation.{conversation_id}`
- **Event**: `message.sent`

The implementation includes:
- Broadcasting authentication via Sanctum
- Real-time message delivery
- Conversation list updates
- Message read status tracking


