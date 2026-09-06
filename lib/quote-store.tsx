"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import type {
  CalculatorEstimate,
  OrderKind,
  QuoteBuyer,
  QuoteDelivery,
  QuoteItem,
  QuoteRequirements,
  SupplyFrequency,
  SupplyMode,
} from "@/types/quote";
import type { Product } from "@/types/product";
import { formatLabels } from "@/data/products";
import { media } from "@/data/media";
import { createReference } from "@/lib/quote-service";

/**
 * QUOTE STORE
 * --------------------------------------------------------------------
 * The whole RFQ lives here: the basket, the requirement answers, the
 * delivery details, the buyer, and the shortlist of saved products.
 * Everything is persisted to localStorage so a request survives
 * navigation, refresh and an accidental tab close.
 *
 * Nothing is sent anywhere by this module — submission is
 * lib/quote-service.ts. This is a plain reducer plus a context: no state
 * library, no persistence library.
 *
 * Storage keys are versioned. `silvora.quote.v1` (a bare item list from
 * V2 of the site) is migrated on first load and then left alone.
 */

const STORAGE_KEY = "silvora.quote.v2";
const LEGACY_KEY = "silvora.quote.v1";
const SAVED_KEY = "silvora.saved.v1";
const MAX_QTY = 9999;

const uid = () => Math.random().toString(36).slice(2, 10);

export const emptyBuyer = (): QuoteBuyer => ({
  name: "",
  company: "",
  email: "",
  phone: "",
  whatsapp: "",
});

export const emptyDelivery = (): QuoteDelivery => ({
  country: "",
  region: "",
  preferredDate: "",
  unloadEquipment: "",
  notes: "",
});

interface Request {
  reference: string;
  orderType: OrderKind;
  supplyMode: SupplyMode;
  frequency: SupplyFrequency | null;
  frequencyNote: string;
  requirements: QuoteRequirements;
  delivery: QuoteDelivery;
  buyer: QuoteBuyer;
  estimate: CalculatorEstimate | null;
  notes: string;
  marketingConsent: boolean;
}

const emptyRequest = (): Request => ({
  reference: "",
  orderType: "farm",
  supplyMode: "one-time",
  frequency: null,
  frequencyNote: "",
  requirements: {},
  delivery: emptyDelivery(),
  buyer: emptyBuyer(),
  estimate: null,
  notes: "",
  marketingConsent: false,
});

interface State {
  items: QuoteItem[];
  request: Request;
  saved: string[];
  hydrated: boolean;
  /** True when hydration found existing work. Drives the "saved" notice. */
  restored: boolean;
}

type Action =
  | { type: "hydrate"; items: QuoteItem[]; request: Request; saved: string[]; restored: boolean }
  | { type: "add"; item: QuoteItem }
  | { type: "duplicate"; itemUid: string }
  | { type: "setQuantity"; itemUid: string; quantity: number }
  | { type: "setItem"; itemUid: string; patch: Partial<QuoteItem> }
  | { type: "remove"; itemUid: string }
  | { type: "patchRequest"; patch: Partial<Request> }
  | { type: "patchRequirements"; patch: Partial<QuoteRequirements> }
  | { type: "patchDelivery"; patch: Partial<QuoteDelivery> }
  | { type: "patchBuyer"; patch: Partial<QuoteBuyer> }
  | { type: "toggleSaved"; productId: string }
  | { type: "clear" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return {
        items: action.items,
        request: action.request,
        saved: action.saved,
        hydrated: true,
        restored: action.restored,
      };
    case "add": {
      // Same product added again merges into the existing line; use
      // `duplicate` when a buyer genuinely wants two separate lines.
      const existing = state.items.find((i) => i.productId === action.item.productId);
      const items = existing
        ? state.items.map((i) =>
            i.uid === existing.uid
              ? { ...i, quantity: Math.min(MAX_QTY, i.quantity + action.item.quantity) }
              : i,
          )
        : [...state.items, action.item];
      return { ...state, items };
    }
    case "duplicate": {
      const source = state.items.find((i) => i.uid === action.itemUid);
      if (!source) return state;
      const index = state.items.findIndex((i) => i.uid === action.itemUid);
      const copy = { ...source, uid: uid() };
      const items = [...state.items];
      items.splice(index + 1, 0, copy);
      return { ...state, items };
    }
    case "setQuantity":
      return {
        ...state,
        items: state.items
          .map((i) =>
            i.uid === action.itemUid
              ? { ...i, quantity: Math.max(0, Math.min(MAX_QTY, action.quantity)) }
              : i,
          )
          .filter((i) => i.quantity > 0),
      };
    case "setItem":
      return {
        ...state,
        items: state.items.map((i) => (i.uid === action.itemUid ? { ...i, ...action.patch } : i)),
      };
    case "remove":
      return { ...state, items: state.items.filter((i) => i.uid !== action.itemUid) };
    case "patchRequest":
      return { ...state, request: { ...state.request, ...action.patch } };
    case "patchRequirements":
      return {
        ...state,
        request: {
          ...state.request,
          requirements: { ...state.request.requirements, ...action.patch },
        },
      };
    case "patchDelivery":
      return {
        ...state,
        request: { ...state.request, delivery: { ...state.request.delivery, ...action.patch } },
      };
    case "patchBuyer":
      return {
        ...state,
        request: { ...state.request, buyer: { ...state.request.buyer, ...action.patch } },
      };
    case "toggleSaved":
      return {
        ...state,
        saved: state.saved.includes(action.productId)
          ? state.saved.filter((id) => id !== action.productId)
          : [...state.saved, action.productId],
      };
    case "clear":
      return { ...state, items: [], request: emptyRequest(), restored: false };
    default:
      return state;
  }
}

interface QuoteContextValue {
  items: QuoteItem[];
  request: Request;
  saved: string[];
  count: number;
  totalBales: number;
  hydrated: boolean;
  restored: boolean;
  dismissRestored: () => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  addProduct: (product: Product, quantity?: number, options?: { open?: boolean }) => void;
  duplicateItem: (itemUid: string) => void;
  setQuantity: (itemUid: string, quantity: number) => void;
  setItem: (itemUid: string, patch: Partial<QuoteItem>) => void;
  removeItem: (itemUid: string) => void;
  /** Removes every line for a product. Used by product-page toggles. */
  removeProduct: (productId: string) => void;
  patchRequest: (patch: Partial<Request>) => void;
  patchRequirements: (patch: Partial<QuoteRequirements>) => void;
  patchDelivery: (patch: Partial<QuoteDelivery>) => void;
  patchBuyer: (patch: Partial<QuoteBuyer>) => void;
  /** Reference for this request, generated on first use and persisted. */
  ensureReference: () => string;
  toggleSaved: (productId: string) => void;
  isSaved: (productId: string) => boolean;
  clear: () => void;
  has: (productId: string) => boolean;
  /** Fires briefly after an add so buttons can show "Added". */
  lastAddedId: string | null;
}

const QuoteContext = createContext<QuoteContextValue | null>(null);

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

interface Persisted {
  items?: QuoteItem[];
  request?: Partial<Request>;
  saved?: string[];
}

function readStorage(): { items: QuoteItem[]; request: Request; saved: string[] } {
  const base = { items: [] as QuoteItem[], request: emptyRequest(), saved: [] as string[] };
  if (typeof window === "undefined") return base;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Persisted;
      return {
        items: Array.isArray(parsed.items) ? parsed.items.filter(isItem) : [],
        request: { ...emptyRequest(), ...(parsed.request ?? {}) },
        saved: Array.isArray(parsed.saved) ? parsed.saved.filter((s) => typeof s === "string") : [],
      };
    }
    // Migrate the V2 basket (items only, keyed by productId).
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as { items?: Omit<QuoteItem, "uid">[] };
      if (Array.isArray(parsed.items)) {
        base.items = parsed.items.map((i) => ({ ...i, uid: uid() })).filter(isItem);
      }
    }
    const savedRaw = window.localStorage.getItem(SAVED_KEY);
    if (savedRaw) {
      const parsed = JSON.parse(savedRaw) as unknown;
      if (Array.isArray(parsed)) base.saved = parsed.filter((s): s is string => typeof s === "string");
    }
  } catch {
    /* corrupted storage — start clean rather than crash */
  }
  return base;
}

function isItem(i: unknown): i is QuoteItem {
  const o = i as QuoteItem;
  return Boolean(o && typeof o.productId === "string" && typeof o.quantity === "number");
}

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    items: [],
    request: emptyRequest(),
    saved: [],
    hydrated: false,
    restored: false,
  });
  const { items, request, saved, hydrated, restored } = state;
  const [isOpen, setOpen] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [restoredDismissed, setRestoredDismissed] = useState(false);

  // Load after mount (avoids a hydration mismatch).
  useEffect(() => {
    const stored = readStorage();
    dispatch({
      type: "hydrate",
      ...stored,
      restored: stored.items.length > 0 || Boolean(stored.request.buyer.name),
    });
  }, []);

  // Persist on every change.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ items, request, saved, savedAt: Date.now() }),
      );
      window.localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
    } catch {
      /* storage full or unavailable — the flow still works in-memory */
    }
  }, [items, request, saved, hydrated]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!lastAddedId) return;
    const t = window.setTimeout(() => setLastAddedId(null), 1800);
    return () => window.clearTimeout(t);
  }, [lastAddedId]);

  const addProduct = useCallback<QuoteContextValue["addProduct"]>(
    (product, quantity = 1, options) => {
      const primary = product.images[0];
      dispatch({
        type: "add",
        item: {
          uid: uid(),
          productId: product.id,
          slug: product.slug,
          name: product.name,
          format: formatLabels[product.format],
          quantity: Math.max(1, Math.round(quantity)),
          image: primary ? media[primary].src : "",
        },
      });
      setLastAddedId(product.id);
      if (options?.open ?? true) setOpen(true);
    },
    [],
  );

  const ensureReference = useCallback(() => {
    if (request.reference) return request.reference;
    const next = createReference();
    dispatch({ type: "patchRequest", patch: { reference: next } });
    return next;
  }, [request.reference]);

  const value = useMemo<QuoteContextValue>(
    () => ({
      items,
      request,
      saved,
      count: items.length,
      totalBales: items.reduce((sum, i) => sum + i.quantity, 0),
      hydrated,
      restored: restored && !restoredDismissed,
      dismissRestored: () => setRestoredDismissed(true),
      isOpen,
      open: () => setOpen(true),
      close: () => setOpen(false),
      toggle: () => setOpen((v) => !v),
      addProduct,
      duplicateItem: (itemUid) => dispatch({ type: "duplicate", itemUid }),
      setQuantity: (itemUid, quantity) => dispatch({ type: "setQuantity", itemUid, quantity }),
      setItem: (itemUid, patch) => dispatch({ type: "setItem", itemUid, patch }),
      removeItem: (itemUid) => dispatch({ type: "remove", itemUid }),
      removeProduct: (productId) =>
        items
          .filter((i) => i.productId === productId)
          .forEach((i) => dispatch({ type: "remove", itemUid: i.uid })),
      patchRequest: (patch) => dispatch({ type: "patchRequest", patch }),
      patchRequirements: (patch) => dispatch({ type: "patchRequirements", patch }),
      patchDelivery: (patch) => dispatch({ type: "patchDelivery", patch }),
      patchBuyer: (patch) => dispatch({ type: "patchBuyer", patch }),
      ensureReference,
      toggleSaved: (productId) => dispatch({ type: "toggleSaved", productId }),
      isSaved: (productId) => saved.includes(productId),
      clear: () => {
        setRestoredDismissed(true);
        dispatch({ type: "clear" });
      },
      has: (productId) => items.some((i) => i.productId === productId),
      lastAddedId,
    }),
    [items, request, saved, hydrated, restored, restoredDismissed, isOpen, addProduct, ensureReference, lastAddedId],
  );

  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>;
}

export function useQuote(): QuoteContextValue {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error("useQuote must be used inside <QuoteProvider>");
  return ctx;
}
