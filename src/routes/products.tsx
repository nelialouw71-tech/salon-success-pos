import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useProducts, formatZAR, uid, type Product } from "@/lib/pos-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/products")({
  component: ProductsPage,
});

const empty: Omit<Product, "id"> = {
  name: "", category: "Nails", price: 0, duration: 30, description: "",
};

function ProductsPage() {
  const [products, setProducts] = useProducts();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(empty);

  function openNew() {
    setEditing(null); setForm(empty); setOpen(true);
  }
  function openEdit(p: Product) {
    setEditing(p);
    const { id: _id, ...rest } = p;
    setForm(rest);
    setOpen(true);
  }
  function save() {
    if (!form.name.trim()) return toast.error("Name is required");
    if (editing) {
      setProducts((prev) => prev.map((p) => (p.id === editing.id ? { ...editing, ...form } : p)));
      toast.success("Treatment updated");
    } else {
      setProducts((prev) => [...prev, { id: uid(), ...form }]);
      toast.success("Treatment added");
    }
    setOpen(false);
  }
  function remove(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Treatment removed");
  }

  const grouped = products.reduce<Record<string, Product[]>>((acc, p) => {
    (acc[p.category] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Treatments</h1>
          <p className="text-muted-foreground mt-1">Manage your service menu and pricing.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Add treatment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit treatment" : "New treatment"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Duration (min)</Label>
                  <Input type="number" value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Price (ZAR)</Label>
                <Input type="number" value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          No treatments yet.
        </CardContent></Card>
      ) : (
        Object.entries(grouped).map(([cat, list]) => (
          <div key={cat} className="space-y-3">
            <h2 className="text-sm uppercase tracking-widest text-muted-foreground">{cat}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {list.map((p) => (
                <Card key={p.id}>
                  <CardContent className="pt-5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {p.duration} min · {formatZAR(p.price)}
                      </div>
                      {p.description && (
                        <p className="text-sm text-muted-foreground mt-2">{p.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
