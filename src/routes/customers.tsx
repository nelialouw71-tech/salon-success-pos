import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  useCustomers, uid, buildWhatsAppLink, type Customer,
} from "@/lib/pos-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, MessageCircle, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/customers")({
  component: CustomersPage,
});

const empty = { name: "", phone: "", email: "", notes: "" };

function CustomersPage() {
  const [customers, setCustomers] = useCustomers();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(empty);
  const [q, setQ] = useState("");

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(c: Customer) {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone, email: c.email ?? "", notes: c.notes ?? "" });
    setOpen(true);
  }
  function save() {
    if (!form.name.trim() || !form.phone.trim()) return toast.error("Name and phone required");
    if (editing) {
      setCustomers((prev) => prev.map((c) => (c.id === editing.id ? { ...editing, ...form } : c)));
      toast.success("Customer updated");
    } else {
      setCustomers((prev) => [
        ...prev,
        { id: uid(), createdAt: new Date().toISOString(), ...form },
      ]);
      toast.success("Customer added");
    }
    setOpen(false);
  }
  function remove(id: string) {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      c.phone.includes(q) ||
      (c.email ?? "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Customers</h1>
          <p className="text-muted-foreground mt-1">Your client list for bookings and WhatsApp specials.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Add customer</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit customer" : "New customer"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp number (with country code)</Label>
                <Input placeholder="+27 82 123 4567" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email (optional)</Label>
                <Input type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search customers..." value={q} onChange={(e) => setQ(e.target.value)}
          className="pl-9" />
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          {customers.length === 0 ? "No customers yet." : "No matches."}
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((c) => (
            <Card key={c.id}>
              <CardContent className="pt-5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c.phone}</div>
                  {c.email && <div className="text-xs text-muted-foreground">{c.email}</div>}
                  {c.notes && <p className="text-sm mt-2">{c.notes}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <a
                    href={buildWhatsAppLink(c.phone, `Hi ${c.name}, `)}
                    target="_blank" rel="noreferrer"
                  >
                    <Button size="icon" variant="ghost"><MessageCircle className="h-4 w-4" /></Button>
                  </a>
                  <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(c.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
