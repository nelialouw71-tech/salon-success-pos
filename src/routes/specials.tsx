import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useCustomers, useSettings, buildWhatsAppLink } from "@/lib/pos-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/specials")({
  component: SpecialsPage,
});

const TEMPLATE = `Hi {name}! ✨

This week at Bloom Beauty Salon:
• 20% off all pedicures
• Free brow tint with any facial

Reply to this message to book your slot.

See you soon!`;

function SpecialsPage() {
  const [customers] = useCustomers();
  const [settings] = useSettings();
  const [message, setMessage] = useState(TEMPLATE);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function selectAll() {
    setSelected(new Set(customers.map((c) => c.id)));
  }
  function clearAll() { setSelected(new Set()); }

  const recipients = customers.filter((c) => selected.has(c.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {settings.logo && (
          <img src={settings.logo} alt={settings.businessName} className="h-14 w-14 rounded-lg object-cover border border-border shadow-sm" />
        )}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">WhatsApp Specials</h1>
          <p className="text-muted-foreground mt-1">
            Compose your offer, pick recipients, then click each one to send via WhatsApp.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Message</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea rows={10} value={message} onChange={(e) => setMessage(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Use <code className="bg-muted px-1 rounded">{"{name}"}</code> to insert each customer's name.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recipients ({selected.size})</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={selectAll}>All</Button>
                <Button size="sm" variant="outline" onClick={clearAll}>None</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {customers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add customers first.</p>
            ) : (
              <div className="max-h-72 overflow-auto divide-y divide-border">
                {customers.map((c) => (
                  <label key={c.id} className="flex items-center gap-3 py-2 cursor-pointer">
                    <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggle(c.id)} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.phone}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {recipients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Send</CardTitle>
            <p className="text-xs text-muted-foreground">
              Click each customer to open WhatsApp with the message ready to send.
            </p>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {recipients.map((c) => {
              const personalised = message.replaceAll("{name}", c.name);
              return (
                <a
                  key={c.id}
                  href={buildWhatsAppLink(c.phone, personalised)}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-md border border-border hover:bg-secondary transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-accent" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.phone}</div>
                  </div>
                </a>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
