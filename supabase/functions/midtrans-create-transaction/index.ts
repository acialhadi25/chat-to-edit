import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TransactionRequest {
  orderId: string;
  amount: number;
  userId: string;
  tier: 'pro' | 'enterprise';
  customerDetails: {
    firstName: string;
    lastName?: string;
    email: string;
    phone?: string;
  };
  itemDetails: {
    id: string;
    price: number;
    quantity: number;
    name: string;
  }[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Midtrans credentials from environment
    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY');
    const isProduction = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true';

    if (!serverKey) {
      throw new Error('MIDTRANS_SERVER_KEY not configured');
    }

    // Parse request body
    const body: TransactionRequest = await req.json();

    // Validate required fields
    if (!body.orderId || !body.amount || !body.userId || !body.tier || !body.customerDetails || !body.itemDetails) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get subscription tier ID
    const { data: tierData, error: tierError } = await supabase
      .from('subscription_tiers')
      .select('id')
      .eq('name', body.tier)
      .single();

    if (tierError || !tierData) {
      return new Response(JSON.stringify({ error: 'Invalid subscription tier' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Midtrans transaction
    const midtransUrl = isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    const authHeader = `Basic ${btoa(serverKey + ':')}`;

    const transactionData = {
      transaction_details: {
        order_id: body.orderId,
        gross_amount: body.amount,
      },
      customer_details: {
        first_name: body.customerDetails.firstName,
        last_name: body.customerDetails.lastName || '',
        email: body.customerDetails.email,
        phone: body.customerDetails.phone || '',
      },
      item_details: body.itemDetails.map((item) => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        name: item.name,
      })),
    };

    const response = await fetch(midtransUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(transactionData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Midtrans API error: ${JSON.stringify(errorData)}`);
    }

    const snapData = await response.json();

    // Store transaction in database
    const { error: dbError } = await supabase.from('transactions').insert({
      order_id: body.orderId,
      user_id: body.userId,
      subscription_tier_id: tierData.id,
      snap_token: snapData.token,
      amount: body.amount,
      status: 'pending',
      customer_email: body.customerDetails.email,
    });

    if (dbError) {
      console.error('Database error:', dbError);
    }

    return new Response(
      JSON.stringify({
        token: snapData.token,
        redirectUrl: snapData.redirect_url,
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
