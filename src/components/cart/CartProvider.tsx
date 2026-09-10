"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  addLine,
  itemCount,
  removeLine,
  sanitizeItems,
  setQty as setQtyPure,
  subtotalOf,
} from "@/lib/commerce/cart-store";
import type { CartItem } from "@/lib/commerce/types";
import { CartDrawer } from "./CartDrawer";

const STORAGE_KEY = "ml.cart.v1";

interface CartContextValue {
  items: CartItem[];
  currency: string;
  count: number;
  subtotal: number;
  /** True once localStorage has been read — use to avoid a 0 → N flash. */
  ready: boolean;
  add: (line: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (perfumeId: string, ml: number, qty: number) => void;
  remove: (perfumeId: string, ml: number) => void;
  clear: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>.");
  return ctx;
}

function readStored(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return sanitizeItems(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function CartProvider({
  currency,
  children,
}: {
  currency: string;
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const writingRef = useRef(false);

  // Hydrate from storage once, then keep in sync across tabs.
  useEffect(() => {
    setItems(readStored());
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      writingRef.current = true;
      setItems(readStored());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Persist on every change (but not the echo of a cross-tab update).
  useEffect(() => {
    if (!ready) return;
    if (writingRef.current) {
      writingRef.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Private mode / quota — the cart still works for this session.
    }
  }, [items, ready]);

  const add = useCallback((line: Omit<CartItem, "qty">, qty = 1) => {
    setItems((prev) => addLine(prev, line, qty));
    setIsOpen(true);
  }, []);

  const setQty = useCallback((perfumeId: string, ml: number, qty: number) => {
    setItems((prev) => setQtyPure(prev, perfumeId, ml, qty));
  }, []);

  const remove = useCallback((perfumeId: string, ml: number) => {
    setItems((prev) => removeLine(prev, perfumeId, ml));
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      currency,
      count: itemCount(items),
      subtotal: subtotalOf(items),
      ready,
      add,
      setQty,
      remove,
      clear,
      isOpen,
      openCart,
      closeCart,
    }),
    [items, currency, ready, add, setQty, remove, clear, isOpen, openCart, closeCart],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}
