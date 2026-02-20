import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Receipt, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { generateInvoicePDF } from '@/utils/invoiceGenerator';
import { calculateReverseVAT } from '@/utils/taxCalculator';

interface Transaction {
  id: string;
  order_id: string;
  transaction_id: string | null;
  amount: number;
  status: string;
  payment_type: string | null;
  created_at: string;
  settlement_time: string | null;
  subscription_tier_id: string;
}

interface TransactionWithTier extends Transaction {
  subscription_tiers: {
    name: string;
    display_name: string;
  };
}

export function BillingHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['billing-history', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('transactions' as any)
        .select(`
          *,
          subscription_tiers (
            name,
            display_name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data || []) as unknown as TransactionWithTier[];
    },
    enabled: !!user,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'settlement':
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'denied':
      case 'cancelled':
      case 'expired':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const generateInvoicePDFHandler = async (transaction: TransactionWithTier) => {
    setDownloadingInvoice(transaction.id);
    
    try {
      // Calculate base amount and VAT from gross amount
      const { baseAmount, vatAmount } = calculateReverseVAT(transaction.amount);
      
      await generateInvoicePDF({
        orderId: transaction.order_id,
        date: new Date(transaction.created_at),
        customerEmail: user?.email || 'Customer',
        customerId: user?.id || '',
        tierName: transaction.subscription_tiers.display_name,
        amount: transaction.amount,
        paymentType: transaction.payment_type || 'Bank Transfer',
        status: transaction.status,
        baseAmount,
        vatRate: 0.11,
        vatAmount,
      });

      toast({
        title: 'Invoice Downloaded',
        description: 'Your PDF invoice has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download invoice. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingInvoice(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>Your payment history and invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>Your payment history and invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No billing history yet</p>
            <p className="text-sm">Your payment history will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Billing History
        </CardTitle>
        <CardDescription>Your payment history and invoices</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {formatDate(transaction.created_at)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{transaction.subscription_tiers.display_name} Plan</p>
                      <p className="text-sm text-muted-foreground">
                        Order: {transaction.order_id}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  <TableCell className="text-right">
                    {transaction.status === 'settlement' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => generateInvoicePDFHandler(transaction)}
                        disabled={downloadingInvoice === transaction.id}
                      >
                        {downloadingInvoice === transaction.id ? (
                          <>Downloading...</>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </>
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
