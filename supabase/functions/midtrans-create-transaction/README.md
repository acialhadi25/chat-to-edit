# Midtrans Create Transaction Edge Function

This Supabase Edge Function creates a Midtrans Snap transaction and returns a payment token.

## Environment Variables

Set these in your Supabase project settings under Edge Functions:

- `MIDTRANS_SERVER_KEY`: Your Midtrans Server Key (from Midtrans Dashboard)
- `MIDTRANS_IS_PRODUCTION`: Set to "true" for production, "false" for sandbox
- `SUPABASE_URL`: Your Supabase project URL (automatically available)
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (automatically available)

## Request Format

```json
{
  "orderId": "ORDER-123456",
  "amount": 100000,
  "customerDetails": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+628123456789"
  },
  "itemDetails": [
    {
      "id": "ITEM-1",
      "price": 100000,
      "quantity": 1,
      "name": "Pro Subscription - Monthly"
    }
  ]
}
```

## Response Format

```json
{
  "token": "snap-token-here",
  "redirectUrl": "https://app.sandbox.midtrans.com/snap/v2/vtweb/..."
}
```

## Deployment

```bash
supabase functions deploy midtrans-create-transaction
```

## Testing

```bash
curl -X POST https://your-project.supabase.co/functions/v1/midtrans-create-transaction \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST-001",
    "amount": 100000,
    "customerDetails": {
      "firstName": "Test",
      "email": "test@example.com"
    },
    "itemDetails": [{
      "id": "ITEM-1",
      "price": 100000,
      "quantity": 1,
      "name": "Test Item"
    }]
  }'
```
