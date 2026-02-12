import { User } from "@supabase/supabase-js";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
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
  FileText,
  FileType,
  History, 
  Settings, 
  LogOut,
  Crown,
  Sun,
  Moon,
  LayoutGrid,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

interface DashboardSidebarProps {
  user: User | null;
}

const DashboardSidebar = ({ user }: DashboardSidebarProps) => {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const maxFiles = profile?.plan === "pro" ? 50 : 5;
  const usedFiles = profile?.files_used_this_month ?? 0;
  const usagePercent = Math.min((usedFiles / maxFiles) * 100, 100);
  const planLabel = profile?.plan === "pro" ? "Pro Plan" : "Free Plan";

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
                <span className="text-sidebar-foreground">{usedFiles} of {maxFiles} files</span>
                <span className="text-sidebar-foreground/60">{Math.round(usagePercent)}%</span>
              </div>
              <Progress value={usagePercent} className="h-2" />
              {usedFiles >= maxFiles && (
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
                <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
                  <Link to="/dashboard">
                    <LayoutGrid className="h-4 w-4" />
                    <span>All Tools</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/excel")}>
                  <Link to="/dashboard/excel">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Chat to Excel</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/pdf")}>
                  <Link to="/dashboard/pdf">
                    <FileText className="h-4 w-4" />
                    <span>Chat to PDF</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/docs")}>
                  <Link to="/dashboard/docs">
                    <FileType className="h-4 w-4" />
                    <span>Chat to Docs</span>
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
                  <Link to="/dashboard/history">
                    <History className="h-4 w-4" />
                    <span>File History</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
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

        {/* Theme Toggle */}
        <SidebarGroup>
          <SidebarGroupContent className="px-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </Button>
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
