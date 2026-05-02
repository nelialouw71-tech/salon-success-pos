// localStorage-backed store for the salon POS
import { useEffect, useState, useCallback } from "react";

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number; // ZAR
  duration: number; // minutes
  description?: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string; // E.164-ish, e.g. 27821234567
  email?: string;
  notes?: string;
  createdAt: string;
};

export type LineItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type DocType = "quote" | "invoice";

export type SalonDoc = {
  id: string;
  type: DocType;
  number: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: LineItem[];
  subtotal: number;
  vatRate: number; // 0 - 1
  vat: number;
  total: number;
  notes?: string;
  status: "draft" | "sent" | "paid";
  createdAt: string;
};

export type SalonSettings = {
  businessName: string;
  email: string;
  phone: string;
  address: string;
  vatRate: number;
  logo?: string; // data URL
};

export type Payment = {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  method: "cash" | "card" | "eft" | "other";
  reference?: string;
  receivedAt: string; // ISO
};

const KEYS = {
  products: "salon.products",
  customers: "salon.customers",
  docs: "salon.docs",
  payments: "salon.payments",
  settings: "salon.settings",
  counters: "salon.counters",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("salon-store", { detail: key }));
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function formatZAR(n: number) {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(n);
}

const DEFAULT_PRODUCTS: Product[] = [
  { id: uid(), name: "Classic Pedicure", category: "Nails", price: 350, duration: 60 },
  { id: uid(), name: "Gel Manicure", category: "Nails", price: 320, duration: 45 },
  { id: uid(), name: "Full Body Massage", category: "Body", price: 650, duration: 60 },
  { id: uid(), name: "Hot Stone Massage", category: "Body", price: 850, duration: 90 },
  { id: uid(), name: "Facial – Hydrating", category: "Face", price: 550, duration: 60 },
  { id: uid(), name: "Eyebrow Shape & Tint", category: "Brows", price: 220, duration: 30 },
];

const DEFAULT_SETTINGS: SalonSettings = {
  businessName: "Bloom Beauty Salon",
  email: "hello@bloombeauty.co.za",
  phone: "+27 11 555 0123",
  address: "123 Rose Street, Johannesburg",
  vatRate: 0.15,
};

function ensureSeeded() {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(KEYS.products)) write(KEYS.products, DEFAULT_PRODUCTS);
  if (!localStorage.getItem(KEYS.customers)) write(KEYS.customers, [] as Customer[]);
  if (!localStorage.getItem(KEYS.docs)) write(KEYS.docs, [] as SalonDoc[]);
  if (!localStorage.getItem(KEYS.payments)) write(KEYS.payments, [] as Payment[]);
  if (!localStorage.getItem(KEYS.settings)) write(KEYS.settings, DEFAULT_SETTINGS);
}

function useStored<T>(key: string, fallback: T) {
  const [state, setState] = useState<T>(fallback);

  useEffect(() => {
    ensureSeeded();
    setState(read<T>(key, fallback));
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === key) setState(read<T>(key, fallback));
    };
    window.addEventListener("salon-store", handler);
    window.addEventListener("storage", () => setState(read<T>(key, fallback)));
    return () => window.removeEventListener("salon-store", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setState((prev) => {
        const value = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        write(key, value);
        return value;
      });
    },
    [key]
  );

  return [state, update] as const;
}

export const useProducts = () => useStored<Product[]>(KEYS.products, []);
export const useCustomers = () => useStored<Customer[]>(KEYS.customers, []);
export const useDocs = () => useStored<SalonDoc[]>(KEYS.docs, []);
export const usePayments = () => useStored<Payment[]>(KEYS.payments, []);
export const useSettings = () => useStored<SalonSettings>(KEYS.settings, DEFAULT_SETTINGS);

export function nextDocNumber(type: DocType): string {
  const counters = read<{ quote: number; invoice: number }>(KEYS.counters, {
    quote: 1000,
    invoice: 2000,
  });
  counters[type] += 1;
  write(KEYS.counters, counters);
  const prefix = type === "quote" ? "QT" : "INV";
  return `${prefix}-${counters[type]}`;
}

export function buildWhatsAppLink(phone: string, message: string) {
  const clean = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
