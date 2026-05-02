import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useDocs, usePayments, formatZAR, uid,
  type Payment, type SalonDoc,
} from "@/lib/pos-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Receipt } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/payments")({
  component: PaymentsPage,
});

export function paidTotal(invoiceId: string, payments: Payment[]) {
  return payments.filter((p) => p.invoiceId === invoiceId).reduce((s, p) => s + p.amount, 0);
}

function PaymentsPage() {
  const [docs, setDocs] = useDocs();
  const [payments, setPayments] = usePayments();

  const invoices = useMemo(() => docs.filter((d) => d.type === "invoice"), [docs]);
  const outstanding = useMemo(
    () => invoices.filter((i) => paidTotal(i.id, payments) < i.total),
    [invoices, payments]
  );

  const [open, setOpen] = useState(false);
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<Payment["method"]>("cash");
  const [reference, setReference] = useState("");
  const [receivedAt, setReceivedAt] = useState(() => new Date().toISOString().slice(0, 10));

  const selectedInvoice = invoices.find((i) => i.id === invoiceId);
  const balance = selectedInvoice ? selectedInvoice.total - paidTotal(selectedInvoice.id, payments) : 0;

  function reset() {
    setInvoiceId(""); setAmount(0); setMethod("cash"); setReference("");
    setReceivedAt(new Date().toISOString().slice(0, 10));
  }

  function save() {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return toast.error("Select an invoice");
    if (!amount || amount <= 0) return toast.error("Enter an amount");

    const p: Payment = {
      id: uid(),
      invoiceId: inv.id,
      invoiceNumber: inv.number,
      customerId: inv.customerId,
      customerName: inv.customerName,
      amount,
      method,
      reference: reference || undefined,
      receivedAt: new Date(receivedAt).toISOString(),
    };
    const newPayments = [p, ...payments];
    setPayments(newPayments);

    // Auto-mark invoice paid if fully covered
    if (paidTotal(inv.id, newPayments) >= inv.total) {
      setDocs((prev) => prev.map((d) => d.id === inv.id ? { ...d, status: "paid" } : d));
    }
    toast.success(`Payment of ${formatZAR(amount)} recorded`);
    setOpen(false); reset();
  }

  function remove(id: string) {
    const p = payments.find((x) => x.id === id);
    if (!p) return;
    const newPayments = payments.filter((x) => x.id !== id);
    setPayments(newPayments);
    // If invoice no longer fully paid, revert to "sent"
    const inv = docs.find((d) => d.id === p.invoiceId);
    if (inv && paidTotal(inv.id, newPayments) < inv.total && inv.status === "paid") {
      setDocs((prev) => prev.map((d) => d.id === inv.id ? { ...d, status: "sent" } : d));
    }
  }

  const totalReceived = payments.reduce((s, p) => s + p.amount, 0);
  const totalOutstanding = outstanding.reduce(
    (s, i) => s + (i.total - paidTotal(i.id, payments)), 0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Payments Received</h1>
          <p className="text-muted-foreground mt-1">Record and track all incoming payments.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Record payment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record payment</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Invoice</Label>
                <Select value={invoiceId} onValueChange={(v) => {
                  setInvoiceId(v);
                  const inv = invoices.find((i) => i.id === v);
                  if (inv) setAmount(inv.total - paidTotal(inv.id, payments));
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={invoices.length === 0 ? "Create an invoice first" : "Select invoice"} />
                  </SelectTrigger>
                  <SelectContent>
                    {invoices.map((i) => {
                      const bal = i.total - paidTotal(i.id, payments);
                      return (
                        <SelectItem key={i.id} value={i.id}>
                          {i.number} · {i.customerName} · {formatZAR(bal)} due
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {selectedInvoice && (
                  <div className="text-xs text-muted-foreground">
                    Invoice total {formatZAR(selectedInvoice.total)} · Balance {formatZAR(balance)}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (R)</Label>
                  <Input type="number" min={0} step="0.01" value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Date received</Label>
                  <Input type="date" value={receivedAt}
                    onChange={(e) => setReceivedAt(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Select value={method} onValueChange={(v) => setMethod(v as Payment["method"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="eft">EFT / Bank transfer</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reference (optional)</Label>
                  <Input value={reference} onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. EFT ref number" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save}>Save payment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total received" value={formatZAR(totalReceived)} tint="green" />
        <StatCard label="Outstanding" value={formatZAR(totalOutstanding)} tint="amber" />
        <StatCard label="Open invoices" value={String(outstanding.length)} tint="rose" />
      </div>

      <Card>
        <CardHeader><CardTitle>Outstanding invoices</CardTitle></CardHeader>
        <CardContent className="p-0 divide-y divide-border">
          {outstanding.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">No outstanding invoices 🎉</div>
          ) : outstanding.map((i) => {
            const bal = i.total - paidTotal(i.id, payments);
            return (
              <div key={i.id} className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{i.number} · {i.customerName}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(i.createdAt).toLocaleDateString("en-ZA")} · Total {formatZAR(i.total)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-destructive">{formatZAR(bal)}</div>
                  <div className="text-xs text-muted-foreground">due</div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent payments</CardTitle></CardHeader>
        <CardContent className="p-0 divide-y divide-border">
          {payments.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">No payments recorded yet.</div>
          ) : payments.map((p) => (
            <div key={p.id} className="p-4 flex items-center gap-3">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{p.customerName} · {p.invoiceNumber}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(p.receivedAt).toLocaleDateString("en-ZA")} · {p.method}
                  {p.reference ? ` · ${p.reference}` : ""}
                </div>
              </div>
              <div className="font-semibold">{formatZAR(p.amount)}</div>
              <Button size="icon" variant="ghost" onClick={() => remove(p.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, tint }: { label: string; value: string; tint: "green" | "amber" | "rose" }) {
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

// re-export for reports route
export type { SalonDoc };
