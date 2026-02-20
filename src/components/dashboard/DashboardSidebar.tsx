import { User } from "@supabase/supabase-js";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Pencil,
  FileSpreadsheet,
  Files,
  Scissors,
  ClipboardEdit,
  History,
  Settings,
  LogOut,
  Crown,
  LayoutGrid,
  Sparkles,
  CreditCard,
  Zap,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

interface DashboardSidebarProps {
  user: User | null;
}

const DashboardSidebar = ({ user }: DashboardSidebarProps) => {
  const { signOut } = useAuth();
  const { subscription, isLoading } = useSubscriptionStatus();
  const navigate = useNavigate();
  const location = useLocation();

  const creditsRemaining = subscription?.creditsRemaining ?? 50;
  const creditsLimit = subscription?.creditsLimit ?? 50;
  const usagePercent = creditsLimit > 0 ? Math.max(0, Math.min(((creditsLimit - creditsRemaining) / creditsLimit) * 100, 100)) : 0;
  const planLabel = subscription?.tierDisplayName ?? "Free Plan";
  const tierName = subscription?.tierName ?? "free";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Pencil className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">Chat to Edit</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Tools Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/excel")}>
                  <Link to="/dashboard/excel">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Chat to Excel</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/merge")}>
                  <Link to="/dashboard/merge">
                    <Files className="h-4 w-4" />
                    <span>Merge Excel</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/split")}>
                  <Link to="/dashboard/split">
                    <Scissors className="h-4 w-4" />
                    <span>Split Worksheet</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/data-entry")}>
                  <Link to="/dashboard/data-entry">
                    <Sparkles className="h-4 w-4" />
                    <span>AI Excel Generator</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Account Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/subscription")}>
                  <Link to="/dashboard/subscription">
                    <CreditCard className="h-4 w-4" />
                    <span>Subscription & Billing</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/settings")}>
                  <Link to="/dashboard/settings">
                    <UserIcon className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Credit Status Badge */}
        <SidebarGroup>
          <SidebarGroupContent className="px-2">
            <div className="rounded-lg border border-sidebar-border bg-gradient-to-br from-primary/10 to-primary/5 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-sidebar-foreground">{planLabel}</span>
              </div>
              <div className="mb-1 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-sidebar-foreground">{creditsRemaining}</span>
                <span className="text-sm text-sidebar-foreground/60">/ {creditsLimit} credits</span>
              </div>
              <Progress value={usagePercent} className="mb-2 h-1.5" />
              <p className="text-xs text-sidebar-foreground/60">
                {creditsRemaining > creditsLimit * 0.5 ? "You're doing great!" : creditsRemaining > creditsLimit * 0.1 ? "Running low on credits" : "Almost out of credits"}
              </p>
              {creditsRemaining <= creditsLimit * 0.2 && tierName === "free" && (
                <Button
                  variant="default"
                  size="sm"
                  className="mt-3 w-full gap-2"
                  onClick={() => navigate('/pricing')}
                >
                  <Crown className="h-3.5 w-3.5" />
                  Upgrade Plan
                </Button>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {user?.email || "User"}
            </p>
            <p className="text-xs text-sidebar-foreground/60">{planLabel}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
