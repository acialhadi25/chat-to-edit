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
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

interface DashboardSidebarProps {
  user: User | null;
}

const DashboardSidebar = ({ user }: DashboardSidebarProps) => {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();

  const maxFiles = profile?.subscription_tier === "pro" ? 50 : profile?.subscription_tier === "enterprise" ? 100 : 5;
  const creditsRemaining = profile?.credits_remaining ?? 100;
  const usagePercent = Math.max(0, Math.min(((100 - creditsRemaining) / 100) * 100, 100));
  const planLabel = profile?.subscription_tier === "pro" ? "Pro Plan" : profile?.subscription_tier === "enterprise" ? "Enterprise Plan" : "Free Plan";

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
        {/* Usage Tracker */}
        <SidebarGroup>
          <SidebarGroupLabel>Monthly Usage</SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-3">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-sidebar-foreground">{creditsRemaining} credits left</span>
                <span className="text-sidebar-foreground/60">{Math.round(usagePercent)}% used</span>
              </div>
              <Progress value={usagePercent} className="h-2" />
              {creditsRemaining <= 10 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Crown className="h-4 w-4" />
                  Upgrade to Pro
                </Button>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tools */}
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

        {/* Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard/settings">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
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
