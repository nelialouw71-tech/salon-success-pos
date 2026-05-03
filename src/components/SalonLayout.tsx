import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Package, Users, FileText, MessageCircle, Settings, Wallet, BarChart3 } from "lucide-react";
import { useSettings } from "@/lib/pos-store";

const nav = [
  { to: "/", label: "Dashboard", mobileLabel: "Home", icon: LayoutDashboard },
  { to: "/products", label: "Treatments", mobileLabel: "Treatments", icon: Package },
  { to: "/customers", label: "Customers", mobileLabel: "Customers", icon: Users },
  { to: "/documents", label: "Quotes & Invoices", mobileLabel: "Quotes", icon: FileText },
  { to: "/payments", label: "Payments Received", mobileLabel: "Payments", icon: Wallet },
  { to: "/reports", label: "Statements", mobileLabel: "Reports", icon: BarChart3 },
  { to: "/specials", label: "WhatsApp Specials", mobileLabel: "WhatsApp", icon: MessageCircle },
  { to: "/settings", label: "Settings", mobileLabel: "Settings", icon: Settings },
] as const;

export function SalonLayout() {
  const location = useLocation();
  const [settings] = useSettings();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <aside className="hidden md:flex w-64 min-h-screen flex-col border-r border-sidebar-border bg-sidebar">
          <div className="px-6 py-6 border-b border-sidebar-border" style={{ background: "var(--gradient-primary)" }}>
            <div className="flex items-center gap-3">
              {settings.logo && (
                <img src={settings.logo} alt="Logo" className="h-10 w-10 rounded-md object-cover bg-white/20 p-0.5" />
              )}
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-widest text-primary-foreground/80">Salon POS</div>
                <div className="mt-0.5 font-semibold text-lg leading-tight text-primary-foreground truncate">{settings.businessName}</div>
              </div>
            </div>
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
          <header className="md:hidden border-b border-border bg-card px-4 py-3 flex items-center gap-2">
            {settings.logo && <img src={settings.logo} alt="Logo" className="h-8 w-8 rounded object-cover" />}
            <div className="font-semibold">{settings.businessName}</div>
          </header>
          <nav className="md:hidden grid grid-cols-4 gap-2 border-b border-border bg-card px-3 py-3">
            {nav.map((item) => {
              const active =
                item.to === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.to);
              const Icon = item.icon;

              return (
                <a
                  key={item.to}
                  href={item.to}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-md border px-2 py-2 text-center text-[11px] font-medium transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                  style={{ touchAction: "manipulation" }}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.label}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="leading-tight">{item.mobileLabel}</span>
                </a>
              );
            })}
          </nav>
          <main className="mx-auto max-w-6xl p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
