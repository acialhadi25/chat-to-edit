export interface SubscriptionTier {
  id: string;
  name: 'free' | 'pro' | 'enterprise';
  display_name: string;
  description: string | null;
  price_idr: number;
  price_usd: number | null;
  features: SubscriptionFeatures;
  limits: SubscriptionLimits;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionFeatures {
  basic_excel_operations: boolean;
  advanced_excel_operations?: boolean;
  ai_chat: boolean;
  templates: boolean;
  priority_support?: boolean;
  custom_templates?: boolean;
  team_collaboration?: boolean;
  api_access?: boolean;
  dedicated_support?: boolean;
}

export interface SubscriptionLimits {
  excel_operations_per_month: number; // -1 for unlimited
  file_uploads_per_month: number; // -1 for unlimited
  ai_messages_per_month: number; // -1 for unlimited
  max_file_size_mb: number;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  subscription_tier_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string | null;
  subscription_tier_id: string | null;
  order_id: string;
  snap_token: string | null;
  transaction_id: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'settlement' | 'denied' | 'expired' | 'cancelled';
  payment_type: string | null;
  settlement_time: string | null;
  fraud_status: string | null;
  customer_email: string;
  created_at: string;
  updated_at: string;
}

export interface UsageTracking {
  id: string;
  user_id: string;
  resource_type: 'excel_operation' | 'file_upload' | 'ai_message';
  count: number;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

export interface UserSubscriptionInfo {
  tier_name: string;
  tier_display_name: string;
  features: SubscriptionFeatures;
  limits: SubscriptionLimits;
  status: string;
}
