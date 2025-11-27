# Twilio Setup Guide

This guide will help you set up Twilio SMS integration for OTP verification.

## Prerequisites

1. A Twilio account (sign up at https://www.twilio.com/)
2. A Twilio phone number with SMS capabilities
3. Your Twilio Account SID and Auth Token

## Configuration Steps

### 1. Get Your Twilio Credentials

1. Log in to your Twilio Console: https://console.twilio.com/
2. Find your **Account SID** and **Auth Token** on the dashboard
3. Get a phone number from Twilio (or use your existing one)

### 2. Add Environment Variables

Add the following to your `.env` file:

```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM_NUMBER=+1234567890
```

**Important Notes:**
- `TWILIO_FROM_NUMBER` must be in E.164 format (e.g., `+1234567890`)
- This should be a Twilio phone number you own
- For Pakistan, you can use a Twilio number with country code +92

### 3. Phone Number Format

The service automatically formats phone numbers:
- If a number doesn't start with `+`, it assumes it's a Pakistani number and adds `+92`
- Leading zeros are automatically removed
- Example: `03001234567` becomes `+923001234567`

### 4. Testing

In development mode, if Twilio fails to send, the OTP will still be logged to your Laravel logs for testing purposes.

To test SMS sending:
1. Ensure your `.env` has valid Twilio credentials
2. Try logging in or registering with a phone number
3. Check your Laravel logs (`storage/logs/laravel.log`) for OTP codes
4. Check your Twilio Console for SMS delivery status

## Troubleshooting

### SMS Not Sending

1. **Check credentials**: Verify your Account SID, Auth Token, and From Number are correct
2. **Check phone format**: Ensure phone numbers are in E.164 format
3. **Check Twilio Console**: Look for error messages in your Twilio dashboard
4. **Check Laravel logs**: Review `storage/logs/laravel.log` for error messages
5. **Verify phone number**: Make sure your Twilio phone number has SMS capabilities enabled

### Common Errors

- **"Twilio credentials are not configured"**: Check your `.env` file has all three Twilio variables
- **"Invalid phone number"**: Ensure the phone number is in correct format
- **"SMS sending failed"**: Check your Twilio account balance and phone number status

## Production Considerations

1. **Rate Limiting**: Consider implementing rate limiting for OTP requests
2. **Error Handling**: The service gracefully handles errors and logs OTPs in development
3. **Monitoring**: Monitor your Twilio usage and costs
4. **Phone Number Verification**: Consider verifying phone numbers before sending OTPs

## Support

For Twilio-specific issues, refer to:
- Twilio Documentation: https://www.twilio.com/docs
- Twilio Support: https://support.twilio.com/


