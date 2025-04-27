
import { Home, Users, AlertCircle, Calendar, Menu, X } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";

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
  const { state, isMobile, openMobile, setOpenMobile } = useSidebar();
  const isExpanded = state === "expanded";

  return (
    <>
      {/* Mobile header with menu button */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 px-4 flex items-center justify-between bg-white border-b z-20">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setOpenMobile(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-bold text-primary ml-3">Farma-Gestão</h2>
        </div>
      </div>
      
      {/* Sidebar - uses the shadcn/ui Sidebar component */}
      <Sidebar className="border-r border-gray-200 mt-16 md:mt-0">
        <SidebarHeader className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-primary">Farma-Gestão</h2>
              <p className="text-xs text-muted-foreground">Vigilância Sanitária</p>
            </div>
            <SidebarTrigger className="md:flex hidden" />
            {isMobile && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setOpenMobile(false)}
                className="md:hidden"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={!isExpanded ? item.title : undefined}
                  asChild
                >
                  <NavLink
                    to={item.url}
                    className={({ isActive }) =>
                      isActive
                        ? "flex items-center gap-2 font-medium text-primary"
                        : "flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    }
                    onClick={() => isMobile && setOpenMobile(false)}
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
    </>
  );
};
