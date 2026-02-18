# Midtrans Webhook Handler Edge Function

This Supabase Edge Function handles Midtrans payment notification webhooks.

## Features

- Verifies notification signature for security
- Updates transaction status in database
- Logs all webhook events for audit trail
- Automatically activates user subscriptions on successful payment
- Handles all payment statuses (pending, settlement, expire, cancel, deny)

## Environment Variables

Set these in your Supabase project settings under Edge Functions:

- `MIDTRANS_SERVER_KEY`: Your Midtrans Server Key (used for signature verification)
- `SUPABASE_URL`: Your Supabase project URL (automatically available)
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (automatically available)

## Midtrans Configuration

In your Midtrans Dashboard, configure the notification URL:

**Sandbox:** `https://your-project.supabase.co/functions/v1/midtrans-webhook`
**Production:** `https://your-project.supabase.co/functions/v1/midtrans-webhook`

## Notification Flow

1. Midtrans sends POST request to webhook URL
2. Function verifies signature using SHA512 hash
3. Function updates transaction status in database
4. Function logs event to webhook_logs table
5. If payment successful, function activates user subscription

## Transaction Status Mapping

| Midtrans Status | Internal Status | Description                    |
| --------------- | --------------- | ------------------------------ |
| capture         | settlement      | Payment captured (credit card) |
| settlement      | settlement      | Payment settled                |
| pending         | pending         | Payment pending                |
| deny            | denied          | Payment denied                 |
| expire          | expired         | Payment expired                |
| cancel          | cancelled       | Payment cancelled              |

## Deployment

```bash
supabase functions deploy midtrans-webhook
```

## Testing

You can test the webhook using Midtrans Dashboard's "Test Notification" feature or using curl:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/midtrans-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_time": "2024-01-01 12:00:00",
    "transaction_status": "settlement",
    "transaction_id": "test-123",
    "status_message": "Success",
    "status_code": "200",
    "signature_key": "calculated-signature",
    "payment_type": "credit_card",
    "order_id": "ORDER-123",
    "merchant_id": "your-merchant-id",
    "gross_amount": "100000.00"
  }'
```

## Security

- All notifications are verified using SHA512 signature
- Invalid signatures are rejected with 401 status
- All events are logged for audit purposes
- Uses Supabase service role key for database operations
