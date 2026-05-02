import { createFileRoute } from "@tanstack/react-router";
import { useDocs, useCustomers, useProducts, formatZAR } from "@/lib/pos-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Package, FileText } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const [docs] = useDocs();
  const [customers] = useCustomers();
  const [products] = useProducts();

  const invoices = docs.filter((d) => d.type === "invoice");
  const revenue = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const outstanding = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.total, 0);

  const recent = [...docs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  const stats = [
    { label: "Revenue (paid)", value: formatZAR(revenue), icon: TrendingUp, tint: "oklch(0.95 0.06 145)" },
    { label: "Outstanding", value: formatZAR(outstanding), icon: FileText, tint: "oklch(0.95 0.07 60)" },
    { label: "Customers", value: customers.length, icon: Users, tint: "oklch(0.95 0.07 350)" },
    { label: "Treatments", value: products.length, icon: Package, tint: "oklch(0.95 0.06 280)" },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-2xl p-6 md:p-8 text-primary-foreground" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-soft)" }}>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-primary-foreground/85 mt-1">Welcome back — here's how your salon is doing today. ✨</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="overflow-hidden border-0" style={{ background: s.tint, boxShadow: "var(--shadow-soft)" }}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-foreground/60">
                      {s.label}
                    </div>
                    <div className="text-2xl font-semibold mt-2">{s.value}</div>
                  </div>
                  <Icon className="h-5 w-5 text-foreground/70" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent documents</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No quotes or invoices yet. Create one from the Quotes & Invoices page.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {recent.map((d) => (
                <div key={d.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {d.number} · {d.customerName}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {d.type} · {d.status}
                    </div>
                  </div>
                  <div className="font-semibold">{formatZAR(d.total)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
