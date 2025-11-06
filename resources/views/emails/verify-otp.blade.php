<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - Kamwaalay</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Kamwaalay</h1>
    </div>

    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">Verify Your Email Address</h2>

        <p style="color: #4b5563;">Hello {{ $user->name }},</p>

        <p style="color: #4b5563;">Thank you for registering with Kamwaalay! Please use the verification code below to complete your registration:</p>

        <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea; font-family: 'Courier New', monospace;">
                {{ $otp }}
            </div>
        </div>

        <p style="color: #4b5563; font-size: 14px;">
            This code will expire in <strong>3 minutes</strong>. If you didn't request this code, please ignore this email.
        </p>

        <p style="color: #4b5563; margin-top: 30px;">
            Best regards,<br>
            <strong>The Kamwaalay Team</strong>
        </p>
    </div>

    <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
        <p>© {{ date('Y') }} Kamwaalay. All rights reserved.</p>
    </div>
</body>
</html>


