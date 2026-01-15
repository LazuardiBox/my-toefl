import { AppSidebar } from "@/client/components/app-sidebar";
import { ChartAreaInteractive } from "@/client/components/chart-area-interactive";
import { DataTable } from "@/client/components/data-table";
import { SectionCards } from "@/client/components/section-cards";
import { SiteHeader } from "@/client/components/site-header";
import { SidebarInset, SidebarProvider } from "@/client/components/ui/sidebar";
import data from "@/client/contexts/data.json";
import { PageRoute } from "@/routers";

export const DashboardRoute = PageRoute({
  path: "/dashboard",
  component: DashboardRouteComponent,
  title: "Dashboard",
});

function DashboardRouteComponent() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
