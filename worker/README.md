# Clinic Worker

Install dependencies, apply local migrations, and start the Worker:

```bash
bun install
bun run db:migrate:local
bun run dev
```

## WhatsApp booking OTP

Create `worker/.dev.vars` for local testing (this file is gitignored):

```dotenv
WHATSAPP_TOKEN=your_meta_access_token
WHATSAPP_PHONE_NUMBER_ID=your_test_phone_number_id
WHATSAPP_OTP_TEMPLATE=clinic_otp
WHATSAPP_BOOKING_TEMPLATE=booking_confirm
WHATSAPP_TEMPLATE_LANGUAGE=en_US
WHATSAPP_API_VERSION=v21.0
WHATSAPP_WEBHOOK_VERIFY_TOKEN=generate_a_long_random_value
META_APP_SECRET=your_meta_app_secret
```

The WhatsApp Business Account ID is used to manage templates and phone numbers
in Meta. Sending messages uses the Phone Number ID. In Meta test mode, add the
mobile entered on the website to the allowed recipient list in the WhatsApp API
setup screen.

For production, store sensitive values as Worker secrets:

```bash
bunx wrangler secret put WHATSAPP_TOKEN
bunx wrangler secret put WHATSAPP_PHONE_NUMBER_ID
bunx wrangler secret put WHATSAPP_WEBHOOK_VERIFY_TOKEN
bunx wrangler secret put META_APP_SECRET
```

Template names, language, and Graph API version can be non-secret Worker vars.
The OTP template must be an approved Authentication template with one body
code parameter and a code button. The booking confirmation template is
optional; failure to send it does not roll back a confirmed appointment.

Configure the Meta production webhook with:

```text
Callback URL: https://portal.drnikhilprakash.com/api/whatsapp/webhook
Verify token: the exact WHATSAPP_WEBHOOK_VERIFY_TOKEN value
Webhook field: messages
```

The verification token is a secret value you create. The Meta App Secret is
found under App settings > Basic and is used to validate every POST webhook
signature. Leave the client-certificate option disabled.
