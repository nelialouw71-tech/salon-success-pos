import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useDocs, usePayments, formatZAR } from "@/lib/pos-store";
import { paidTotal } from "./payments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

type Period = "month" | "quarter" | "year";

function periodKey(date: Date, period: Period) {
  const y = date.getFullYear();
  if (period === "year") return `${y}`;
  if (period === "quarter") return `${y}-Q${Math.floor(date.getMonth() / 3) + 1}`;
  return `${y}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function periodLabel(key: string, period: Period) {
  if (period === "year") return key;
  if (period === "quarter") return key;
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
}

function ReportsPage() {
  const [docs] = useDocs();
  const [payments] = usePayments();
  const [period, setPeriod] = useState<Period>("month");

  const invoices = useMemo(() => docs.filter((d) => d.type === "invoice"), [docs]);

  const groups = useMemo(() => {
    const map = new Map<string, { invoiced: number; received: number; outstanding: number; count: number }>();
    invoices.forEach((i) => {
      const key = periodKey(new Date(i.createdAt), period);
      const g = map.get(key) ?? { invoiced: 0, received: 0, outstanding: 0, count: 0 };
      g.invoiced += i.total;
      g.outstanding += Math.max(0, i.total - paidTotal(i.id, payments));
      g.count += 1;
      map.set(key, g);
    });
    payments.forEach((p) => {
      const key = periodKey(new Date(p.receivedAt), period);
      const g = map.get(key) ?? { invoiced: 0, received: 0, outstanding: 0, count: 0 };
      g.received += p.amount;
      map.set(key, g);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1));
  }, [invoices, payments, period]);

  const totals = useMemo(() => ({
    invoiced: invoices.reduce((s, i) => s + i.total, 0),
    received: payments.reduce((s, p) => s + p.amount, 0),
    outstanding: invoices.reduce((s, i) => s + Math.max(0, i.total - paidTotal(i.id, payments)), 0),
  }), [invoices, payments]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Statements & Reports</h1>
        <p className="text-muted-foreground mt-1">Income overview by month, quarter or year.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Total invoiced" value={formatZAR(totals.invoiced)} tint="rose" />
        <Stat label="Total received" value={formatZAR(totals.received)} tint="green" />
        <Stat label="Outstanding" value={formatZAR(totals.outstanding)} tint="amber" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Statement</CardTitle>
          <div className="w-44">
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="quarter">Quarterly</SelectItem>
                <SelectItem value="year">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {groups.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">No data yet.</div>
          ) : (
            <div className="divide-y divide-border">
              <div className="grid grid-cols-5 gap-2 px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground bg-secondary/40">
                <div className="col-span-2">Period</div>
                <div className="text-right">Invoiced</div>
                <div className="text-right">Received</div>
                <div className="text-right">Outstanding</div>
              </div>
              {groups.map(([key, g]) => (
                <div key={key} className="grid grid-cols-5 gap-2 px-4 py-3 text-sm">
                  <div className="col-span-2">
                    <div className="font-medium">{periodLabel(key, period)}</div>
                    <div className="text-xs text-muted-foreground">{g.count} invoice{g.count === 1 ? "" : "s"}</div>
                  </div>
                  <div className="text-right">{formatZAR(g.invoiced)}</div>
                  <div className="text-right text-emerald-700 font-medium">{formatZAR(g.received)}</div>
                  <div className="text-right text-destructive font-medium">{formatZAR(g.outstanding)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">All invoices</TabsTrigger>
          <TabsTrigger value="payments">All payments</TabsTrigger>
        </TabsList>
        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {invoices.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground text-center">No invoices yet.</div>
              ) : invoices.map((i) => {
                const received = paidTotal(i.id, payments);
                const bal = i.total - received;
                return (
                  <div key={i.id} className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{i.number} · {i.customerName}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(i.createdAt).toLocaleDateString("en-ZA")} · Total {formatZAR(i.total)} · Received {formatZAR(received)}
                      </div>
                    </div>
                    <div className={`font-semibold ${bal > 0 ? "text-destructive" : "text-emerald-700"}`}>
                      {bal > 0 ? formatZAR(bal) + " due" : "Paid"}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {payments.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground text-center">No payments yet.</div>
              ) : payments.map((p) => (
                <div key={p.id} className="p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{p.customerName} · {p.invoiceNumber}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(p.receivedAt).toLocaleDateString("en-ZA")} · {p.method}
                    </div>
                  </div>
                  <div className="font-semibold">{formatZAR(p.amount)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value, tint }: { label: string; value: string; tint: "green" | "amber" | "rose" }) {
  const tintClass =
    tint === "green" ? "from-emerald-100 to-emerald-50 text-emerald-900"
    : tint === "amber" ? "from-amber-100 to-amber-50 text-amber-900"
    : "from-rose-100 to-rose-50 text-rose-900";
  return (
    <Card className={`bg-gradient-to-br ${tintClass} border-0 shadow-[var(--shadow-soft)]`}>
      <CardContent className="p-5">
        <div className="text-xs uppercase tracking-widest opacity-70">{label}</div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}
