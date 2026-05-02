import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useDocs, useCustomers, useProducts, useSettings,
  formatZAR, uid, nextDocNumber, buildWhatsAppLink,
  type DocType, type LineItem, type SalonDoc,
} from "@/lib/pos-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2, MessageCircle, Printer, FileText, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/documents")({
  component: DocumentsPage,
});

function DocumentsPage() {
  const [docs, setDocs] = useDocs();
  const [customers] = useCustomers();
  const [products] = useProducts();
  const [settings] = useSettings();

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<DocType>("quote");
  const [customerId, setCustomerId] = useState<string>("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState("");
  const [viewing, setViewing] = useState<SalonDoc | null>(null);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);
  const vat = subtotal * settings.vatRate;
  const total = subtotal + vat;

  function addItem(productId: string) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === p.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { productId: p.id, name: p.name, price: p.price, quantity: 1 }];
    });
  }

  function reset() {
    setCustomerId(""); setItems([]); setNotes(""); setType("quote");
  }

  function save() {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return toast.error("Select a customer");
    if (items.length === 0) return toast.error("Add at least one treatment");

    const doc: SalonDoc = {
      id: uid(),
      type,
      number: nextDocNumber(type),
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      items, subtotal, vatRate: settings.vatRate, vat, total,
      notes,
      status: "draft",
      createdAt: new Date().toISOString(),
    };
    setDocs((prev) => [doc, ...prev]);
    toast.success(`${type === "quote" ? "Quote" : "Invoice"} ${doc.number} created`);
    setOpen(false); reset();
    setViewing(doc);
  }

  function setStatus(id: string, status: SalonDoc["status"]) {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
    setViewing((v) => (v && v.id === id ? { ...v, status } : v));
  }
  function remove(id: string) {
    setDocs((prev) => prev.filter((d) => d.id !== id));
    setViewing(null);
  }

  function whatsappMessage(d: SalonDoc) {
    const lines = d.items.map((i) => `• ${i.name} x${i.quantity} – ${formatZAR(i.price * i.quantity)}`).join("\n");
    const head = d.type === "quote"
      ? `Hi ${d.customerName}, here is your quote ${d.number} from ${settings.businessName}:`
      : `Hi ${d.customerName}, your invoice ${d.number} from ${settings.businessName}:`;
    return `${head}\n\n${lines}\n\nSubtotal: ${formatZAR(d.subtotal)}\nVAT: ${formatZAR(d.vat)}\nTotal: ${formatZAR(d.total)}\n\nThank you!`;
  }

  const quotes = docs.filter((d) => d.type === "quote");
  const invoices = docs.filter((d) => d.type === "invoice");

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Quotes & Invoices</h1>
          <p className="text-muted-foreground mt-1">Send quotes and invoices via WhatsApp or print.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New document</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New {type}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as DocType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quote">Quote</SelectItem>
                      <SelectItem value="invoice">Invoice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder={customers.length === 0 ? "Add a customer first" : "Select"} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Add treatment</Label>
                <Select value="" onValueChange={addItem}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a treatment to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} – {formatZAR(p.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {items.length > 0 && (
                <div className="border border-border rounded-md divide-y divide-border">
                  {items.map((i, idx) => (
                    <div key={i.productId} className="flex items-center gap-2 p-3">
                      <div className="flex-1 text-sm">{i.name}</div>
                      <Input type="number" min={1} className="w-20" value={i.quantity}
                        onChange={(e) => {
                          const q = Math.max(1, Number(e.target.value));
                          setItems((prev) => prev.map((x, k) => k === idx ? { ...x, quantity: q } : x));
                        }} />
                      <div className="w-24 text-right text-sm">{formatZAR(i.price * i.quantity)}</div>
                      <Button size="icon" variant="ghost"
                        onClick={() => setItems((prev) => prev.filter((_, k) => k !== idx))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="p-3 space-y-1 text-sm bg-secondary/40">
                    <div className="flex justify-between"><span>Subtotal</span><span>{formatZAR(subtotal)}</span></div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>VAT ({Math.round(settings.vatRate * 100)}%)</span><span>{formatZAR(vat)}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-1"><span>Total</span><span>{formatZAR(total)}</span></div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment terms, booking date, etc." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save}>Create {type}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
          <TabsTrigger value="quotes">Quotes ({quotes.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="invoices" className="mt-4">
          <DocList docs={invoices} onView={setViewing} />
        </TabsContent>
        <TabsContent value="quotes" className="mt-4">
          <DocList docs={quotes} onView={setViewing} />
        </TabsContent>
      </Tabs>

      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="max-w-2xl print:shadow-none">
          {viewing && (
            <div className="space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">
                    {viewing.type}
                  </div>
                  <h2 className="text-2xl font-semibold">{viewing.number}</h2>
                </div>
                <div className="text-right text-sm">
                  <div className="font-medium">{settings.businessName}</div>
                  <div className="text-muted-foreground text-xs">{settings.email}</div>
                  <div className="text-muted-foreground text-xs">{settings.phone}</div>
                </div>
              </div>

              <div className="text-sm">
                <div className="text-muted-foreground text-xs">Bill to</div>
                <div className="font-medium">{viewing.customerName}</div>
                <div className="text-muted-foreground text-xs">{viewing.customerPhone}</div>
              </div>

              <div className="border border-border rounded-md divide-y divide-border text-sm">
                {viewing.items.map((i) => (
                  <div key={i.productId} className="flex p-3">
                    <div className="flex-1">{i.name} <span className="text-muted-foreground">x{i.quantity}</span></div>
                    <div>{formatZAR(i.price * i.quantity)}</div>
                  </div>
                ))}
                <div className="p-3 space-y-1 bg-secondary/40">
                  <div className="flex justify-between"><span>Subtotal</span><span>{formatZAR(viewing.subtotal)}</span></div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>VAT ({Math.round(viewing.vatRate * 100)}%)</span><span>{formatZAR(viewing.vat)}</span>
                  </div>
                  <div className="flex justify-between font-semibold"><span>Total</span><span>{formatZAR(viewing.total)}</span></div>
                </div>
              </div>

              {viewing.notes && (
                <div className="text-sm">
                  <div className="text-muted-foreground text-xs mb-1">Notes</div>
                  <p>{viewing.notes}</p>
                </div>
              )}

              <DialogFooter className="gap-2 print:hidden flex-wrap">
                <Button variant="outline" onClick={() => remove(viewing.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />Delete
                </Button>
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" />Print / PDF
                </Button>
                {viewing.type === "invoice" && viewing.status !== "paid" && (
                  <Button variant="outline" onClick={() => setStatus(viewing.id, "paid")}>
                    <Check className="h-4 w-4 mr-2" />Mark paid
                  </Button>
                )}
                <a
                  href={buildWhatsAppLink(viewing.customerPhone, whatsappMessage(viewing))}
                  target="_blank" rel="noreferrer"
                  onClick={() => setStatus(viewing.id, "sent")}
                >
                  <Button>
                    <MessageCircle className="h-4 w-4 mr-2" />Send via WhatsApp
                  </Button>
                </a>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocList({ docs, onView }: { docs: SalonDoc[]; onView: (d: SalonDoc) => void }) {
  if (docs.length === 0) {
    return (
      <Card><CardContent className="py-10 text-center text-muted-foreground">
        Nothing here yet.
      </CardContent></Card>
    );
  }
  return (
    <Card>
      <CardContent className="p-0 divide-y divide-border">
        {docs.map((d) => (
          <button key={d.id} onClick={() => onView(d)}
            className="w-full text-left p-4 hover:bg-secondary/50 transition-colors flex items-center gap-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <div className="font-medium">{d.number} · {d.customerName}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(d.createdAt).toLocaleDateString("en-ZA")} · {d.status}
              </div>
            </div>
            <div className="font-semibold">{formatZAR(d.total)}</div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
