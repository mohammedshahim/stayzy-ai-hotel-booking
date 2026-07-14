import { Building2, CalendarRange, LayoutDashboard } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/", enabled: true },
  { label: "Hotels", icon: Building2, href: "/hotels", enabled: true },
  { label: "Bookings", icon: CalendarRange, href: "/bookings", enabled: true },
] as const;

export function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <span className="text-lg font-semibold text-sidebar-foreground">Stayzy Admin</span>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          if (!item.enabled) {
            return (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-sidebar-foreground/50"
              >
                <span className="flex items-center gap-3">
                  <Icon className="size-4" />
                  {item.label}
                </span>
                <span className="rounded-lg bg-sidebar-accent px-2 py-0.5 text-xs text-sidebar-accent-foreground">
                  Soon
                </span>
              </div>
            );
          }
          return (
            <NavLink
              key={item.label}
              to={item.href}
              end={item.href === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                )
              }
            >
              <Icon className="size-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
