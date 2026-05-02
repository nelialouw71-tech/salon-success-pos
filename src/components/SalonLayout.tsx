import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Package, Users, FileText, MessageCircle, Settings } from "lucide-react";
import { useSettings } from "@/lib/pos-store";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Treatments", icon: Package },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/documents", label: "Quotes & Invoices", icon: FileText },
  { to: "/specials", label: "WhatsApp Specials", icon: MessageCircle },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function SalonLayout() {
  const location = useLocation();
  const [settings] = useSettings();

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ background: "var(--gradient-soft)" }}>
      <div className="flex">
        <aside className="hidden md:flex w-64 min-h-screen flex-col border-r border-sidebar-border bg-sidebar">
          <div className="px-6 py-6 border-b border-sidebar-border" style={{ background: "var(--gradient-primary)" }}>
            <div className="text-xs uppercase tracking-widest text-primary-foreground/80">Salon POS</div>
            <div className="mt-1 font-semibold text-lg leading-tight text-primary-foreground">{settings.businessName}</div>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {nav.map((item) => {
              const active =
                item.to === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="px-6 py-4 text-xs text-muted-foreground border-t border-border">
            Local data · this device
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <header className="md:hidden border-b border-border bg-card px-4 py-3 flex items-center justify-between">
            <div className="font-semibold">{settings.businessName}</div>
          </header>
          <nav className="md:hidden flex overflow-x-auto gap-1 px-2 py-2 border-b border-border bg-card">
            {nav.map((item) => {
              const active =
                item.to === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-1.5 rounded-md text-xs whitespace-nowrap ${
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <main className="p-4 md:p-8 max-w-6xl mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
