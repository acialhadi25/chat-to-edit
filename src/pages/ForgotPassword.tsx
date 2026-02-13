import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { toast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) throw error;

      setIsSent(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : undefined;
      toast({
        variant: "destructive",
        title: "Error",
        description: message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="mx-auto mb-4 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Pencil className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-semibold text-foreground">Chat to Edit</span>
          </Link>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your email and we'll send you a reset link
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isSent ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle className="mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 font-medium text-foreground">Check your email</h3>
              <p className="text-sm text-muted-foreground">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="justify-center">
          <Link to="/login" className="flex items-center gap-1 text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword;
