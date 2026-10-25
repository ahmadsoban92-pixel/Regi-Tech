"use client";

import { plateConfigurationSchema } from "@/lib/orderSchemas";
import { createDefaultConfiguration, isProductId, normalizePlateConfiguration } from "@/lib/productCatalog";
import type { CartItem, FixingId, PlateConfiguration } from "@/types/order";

const STORAGE_KEY = "regitech-order-draft";
const CHANGE_EVENT = "regitech-order-draft-change";
const CURRENT_VERSION = 2;

export type OrderDraftSnapshot = {
  version: 2;
  activeConfig: PlateConfiguration;
  items: CartItem[];
  editingItemId: string | null;
  orderNotes: string;
};

export const DEFAULT_ORDER_DRAFT: OrderDraftSnapshot = Object.freeze({
  version: CURRENT_VERSION,
  activeConfig: createDefaultConfiguration("hand-crafted-show-plate"),
  items: [],
  editingItemId: null,
  orderNotes: "",
});

let cachedRaw: string | null | undefined;
let cachedSnapshot: OrderDraftSnapshot = DEFAULT_ORDER_DRAFT;

function migrateFixing(value: unknown): FixingId {
  if (value === "fixing-kit" || value === "adhesive-kit" || value === "complete-bundle" || value === "none") return value;
  if (value === "Nylon Fixing Set") return "fixing-kit";
  if (value === "3M Adhesive Tape") return "adhesive-kit";
  return "none";
}

function parseConfig(value: unknown): PlateConfiguration | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<PlateConfiguration>;
  const productId = typeof raw.productId === "string" && isProductId(raw.productId) ? raw.productId : "hand-crafted-show-plate";
  const candidate = {
    ...createDefaultConfiguration(productId),
    ...raw,
    customDimensionUnit: raw.customDimensionUnit === "cm" ? "cm" : "in",
    fixing: migrateFixing(raw.fixing),
    uploadedLogoPreviewUrl: "",
  };
  const result = plateConfigurationSchema.safeParse(candidate);
  return result.success ? normalizePlateConfiguration(result.data) : null;
}

function sanitizeItem(value: unknown, index: number): CartItem | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<CartItem>;
  const config = parseConfig(raw.config);
  if (!config) return null;
  const id = typeof raw.id === "string" && /^[A-Za-z0-9-]{1,64}$/.test(raw.id) ? raw.id : `migrated-${index + 1}`;
  const quantity = Math.min(20, Math.max(1, Number.isInteger(raw.quantity) ? raw.quantity! : 1));
  return { id, config, quantity };
}

function parseDraft(raw: string | null): OrderDraftSnapshot {
  if (!raw) return DEFAULT_ORDER_DRAFT;
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (value.version === CURRENT_VERSION) {
      const activeConfig = parseConfig(value.activeConfig) ?? DEFAULT_ORDER_DRAFT.activeConfig;
      const items = Array.isArray(value.items) ? value.items.map(sanitizeItem).filter((item): item is CartItem => Boolean(item)) : [];
      const editingItemId = typeof value.editingItemId === "string" && items.some((item) => item.id === value.editingItemId) ? value.editingItemId : null;
      return {
        version: CURRENT_VERSION,
        activeConfig,
        items,
        editingItemId,
        orderNotes: typeof value.orderNotes === "string" ? value.orderNotes.slice(0, 1000) : "",
      };
    }

    const legacyConfig = parseConfig(value.config);
    if (!legacyConfig) return DEFAULT_ORDER_DRAFT;
    const hasCartItem = Boolean(value.hasCartItem);
    const quantity = Math.min(20, Math.max(1, Number.isInteger(value.quantity) ? Number(value.quantity) : 1));
    const legacyNotes = typeof (value.config as { orderNotes?: unknown } | undefined)?.orderNotes === "string"
      ? (value.config as { orderNotes: string }).orderNotes.slice(0, 1000)
      : "";
    return {
      version: CURRENT_VERSION,
      activeConfig: legacyConfig,
      items: hasCartItem ? [{ id: "legacy-cart-item", config: legacyConfig, quantity }] : [],
      editingItemId: null,
      orderNotes: legacyNotes,
    };
  } catch {
    return DEFAULT_ORDER_DRAFT;
  }
}

export function getOrderDraftSnapshot(): OrderDraftSnapshot {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSnapshot = parseDraft(raw);
  }
  return cachedSnapshot;
}

export function getOrderDraftServerSnapshot(): OrderDraftSnapshot {
  return DEFAULT_ORDER_DRAFT;
}

export function subscribeToOrderDraft(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cachedRaw = undefined;
    onStoreChange();
  };
  const handleLocalChange = () => onStoreChange();
  window.addEventListener("storage", handleStorage);
  window.addEventListener(CHANGE_EVENT, handleLocalChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CHANGE_EVENT, handleLocalChange);
  };
}

export function updateOrderDraft(update: (current: OrderDraftSnapshot) => OrderDraftSnapshot) {
  const next = update(getOrderDraftSnapshot());
  const stripPreview = (config: PlateConfiguration) => ({ ...config, uploadedLogoPreviewUrl: "" });
  const persistable: OrderDraftSnapshot = {
    ...next,
    activeConfig: stripPreview(next.activeConfig),
    items: next.items.map((item) => ({ ...item, config: stripPreview(item.config) })),
  };
  const raw = JSON.stringify(persistable);
  window.localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedSnapshot = next;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function clearOrderDraft() {
  window.localStorage.removeItem(STORAGE_KEY);
  cachedRaw = null;
  cachedSnapshot = DEFAULT_ORDER_DRAFT;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
