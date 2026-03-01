import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SubscriptionRequest {
  userId: string;
  subscriptionTierId: string;
  customerDetails: {
    firstName: string;
    lastName?: string;
    email: string;
    phone?: string;
  };
  plan: 'monthly' | 'yearly';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY');
    const isProduction = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true';

    if (!serverKey) {
      throw new Error('MIDTRANS_SERVER_KEY not configured');
    }

    const body: SubscriptionRequest = await req.json();

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get subscription tier details
    const { data: tier, error: tierError } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('id', body.subscriptionTierId)
      .single();

    if (tierError || !tier) {
      throw new Error('Subscription tier not found');
    }

    // Calculate amount based on plan
    const amount =
      body.plan === 'yearly'
        ? tier.price_idr * 12 * 0.9 // 10% discount for yearly
        : tier.price_idr;

    // Create subscription with Midtrans
    const midtransUrl = isProduction
      ? 'https://api.midtrans.com/v1/subscriptions'
      : 'https://api.sandbox.midtrans.com/v1/subscriptions';

    const authHeader = `Basic ${btoa(serverKey + ':')}`;

    const subscriptionData = {
      name: `${tier.display_name} - ${body.plan}`,
      amount: amount,
      currency: 'IDR',
      payment_type: 'credit_card',
      token: '', // Will be provided by Snap
      schedule: {
        interval: body.plan === 'monthly' ? 1 : 12,
        interval_unit: 'month',
        max_interval: body.plan === 'monthly' ? 12 : 1, // 12 months for monthly, 1 year for yearly
      },
      metadata: {
        user_id: body.userId,
        subscription_tier_id: body.subscriptionTierId,
        plan: body.plan,
      },
      customer_details: {
        first_name: body.customerDetails.firstName,
        last_name: body.customerDetails.lastName || '',
        email: body.customerDetails.email,
        phone: body.customerDetails.phone || '',
      },
    };

    const response = await fetch(midtransUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(subscriptionData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Midtrans API error: ${JSON.stringify(errorData)}`);
    }

    const subscriptionResult = await response.json();

    // Store subscription in database
    const { error: dbError } = await supabase.from('user_subscriptions').upsert({
      user_id: body.userId,
      subscription_tier_id: body.subscriptionTierId,
      status: 'pending',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(
        Date.now() + (body.plan === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000
      ).toISOString(),
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error('Database error:', dbError);
    }

    return new Response(
      JSON.stringify({
        subscriptionId: subscriptionResult.id,
        status: subscriptionResult.status,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
