import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHash } from 'https://deno.land/std@0.168.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MidtransNotification {
  transaction_time: string;
  transaction_status: string;
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  settlement_time?: string;
  payment_type: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  fraud_status?: string;
  currency?: string;
}

/**
 * Verify Midtrans notification signature
 */
function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
  signatureKey: string
): boolean {
  const hash = createHash('sha512');
  const data = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  hash.update(data);
  const calculatedSignature = hash.digest('hex');

  return calculatedSignature === signatureKey;
}

/**
 * Map Midtrans transaction status to our internal status
 */
function mapTransactionStatus(transactionStatus: string, fraudStatus?: string): string {
  if (fraudStatus === 'deny') {
    return 'denied';
  }

  switch (transactionStatus) {
    case 'capture':
    case 'settlement':
      return 'settlement';
    case 'pending':
      return 'pending';
    case 'deny':
      return 'denied';
    case 'expire':
      return 'expired';
    case 'cancel':
      return 'cancelled';
    default:
      return transactionStatus;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Midtrans server key from environment
    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY');

    if (!serverKey) {
      throw new Error('MIDTRANS_SERVER_KEY not configured');
    }

    // Parse notification body
    const notification: MidtransNotification = await req.json();

    console.log('Received Midtrans notification:', {
      orderId: notification.order_id,
      transactionStatus: notification.transaction_status,
      transactionId: notification.transaction_id,
    });

    // Verify signature
    const isValid = verifySignature(
      notification.order_id,
      notification.status_code,
      notification.gross_amount,
      serverKey,
      notification.signature_key
    );

    if (!isValid) {
      console.error('Invalid signature for order:', notification.order_id);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Map status
    const mappedStatus = mapTransactionStatus(
      notification.transaction_status,
      notification.fraud_status
    );

    // Update transaction in database
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('order_id', notification.order_id)
      .single();

    if (fetchError) {
      console.error('Transaction not found:', notification.order_id);
      return new Response(JSON.stringify({ error: 'Transaction not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update transaction status
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: mappedStatus,
        transaction_id: notification.transaction_id,
        payment_type: notification.payment_type,
        settlement_time: notification.settlement_time,
        fraud_status: notification.fraud_status,
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', notification.order_id);

    if (updateError) {
      console.error('Failed to update transaction:', updateError);
      throw updateError;
    }

    // Log webhook event for audit trail
    const { error: logError } = await supabase.from('webhook_logs').insert({
      event_type: 'midtrans_notification',
      order_id: notification.order_id,
      transaction_id: notification.transaction_id,
      status: mappedStatus,
      payload: notification,
      created_at: new Date().toISOString(),
    });

    if (logError) {
      console.error('Failed to log webhook event:', logError);
    }

    // If payment is successful, update user subscription
    if (mappedStatus === 'settlement') {
      // Get user_id from transaction
      const { data: txData } = await supabase
        .from('transactions')
        .select('user_id, subscription_tier_id')
        .eq('order_id', notification.order_id)
        .single();

      if (txData && txData.user_id && txData.subscription_tier_id) {
        // Update or create user subscription
        const { error: subError } = await supabase.from('user_subscriptions').upsert({
          user_id: txData.user_id,
          subscription_tier_id: txData.subscription_tier_id,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          updated_at: new Date().toISOString(),
        });

        if (subError) {
          console.error('Failed to update user subscription:', subError);
        }
      }
    }

    console.log('Successfully processed webhook for order:', notification.order_id);

    return new Response(JSON.stringify({ success: true, status: mappedStatus }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
