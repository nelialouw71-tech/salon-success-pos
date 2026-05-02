import { createFileRoute } from "@tanstack/react-router";
import { useSettings } from "@/lib/pos-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [settings, setSettings] = useSettings();
  const [form, setForm] = useState(settings);

  useEffect(() => setForm(settings), [settings]);

  function save() {
    setSettings(form);
    toast.success("Settings saved");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Business details shown on quotes and invoices.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Business</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Company logo</Label>
            <div className="flex items-center gap-4">
              {form.logo ? (
                <img src={form.logo} alt="Salon logo" className="h-16 w-16 rounded-md object-cover border border-border" />
              ) : (
                <div className="h-16 w-16 rounded-md border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
                  No logo
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setForm({ ...form, logo: reader.result as string });
                    reader.readAsDataURL(file);
                  }}
                />
                {form.logo && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, logo: undefined })}>
                    Remove logo
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Business name</Label>
            <Input value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>VAT rate (e.g. 0.15 for 15%)</Label>
            <Input type="number" step="0.01" value={form.vatRate}
              onChange={(e) => setForm({ ...form, vatRate: Number(e.target.value) })} />
          </div>
          <Button onClick={save}>Save settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
