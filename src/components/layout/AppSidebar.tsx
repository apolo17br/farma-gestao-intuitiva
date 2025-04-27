
import { Home, Users, AlertCircle, Calendar } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { NavLink } from "react-router-dom";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Farmácias",
    url: "/farmacias",
    icon: Users,
  },
  {
    title: "Pendências",
    url: "/pendencias",
    icon: AlertCircle,
  },
  {
    title: "Prazos",
    url: "/prazos",
    icon: Calendar,
  },
];

export const AppSidebar = () => {
  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-primary">Farma-Gestão</h2>
            <p className="text-xs text-muted-foreground">Vigilância Sanitária</p>
          </div>
          <SidebarTrigger className="md:hidden" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  className={({ isActive }) =>
                    isActive
                      ? "flex items-center gap-2 font-medium text-primary"
                      : "flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  }
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-gray-200">
        <div className="text-xs text-muted-foreground">
          <p>© 2025 Farma-Gestão</p>
          <p>v1.0.0</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
