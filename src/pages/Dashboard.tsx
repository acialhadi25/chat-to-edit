import { useAuth } from "@/hooks/useAuth";
import { Outlet } from "react-router-dom";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full bg-background">
        <DashboardSidebar user={user} />
        <SidebarInset className="flex flex-1 flex-col h-svh overflow-hidden min-w-0">
          {/* Mobile Header with Sidebar Trigger */}
          <div className="flex h-14 items-center gap-2 border-b border-border bg-background px-4 lg:hidden flex-shrink-0">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm font-medium text-foreground">Dashboard</span>
          </div>
          <Outlet />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
