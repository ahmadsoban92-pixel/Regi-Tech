"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";
import { clearOrderDraft, getOrderDraftServerSnapshot, getOrderDraftSnapshot, subscribeToOrderDraft, updateOrderDraft } from "@/lib/orderDraftStore";
import { createDefaultConfiguration } from "@/lib/productCatalog";
import { getCartQuantity } from "@/lib/orderPricing";
import type { CartItem, CustomerDetails, PlateConfiguration } from "@/types/order";

const emptyAddress = { addressLine1: "", addressLine2: "", town: "", county: "", postcode: "", country: "United Kingdom" };
const defaultCustomer: CustomerDetails = {
  firstName: "", lastName: "", email: "", telephone: "", deliveryAddress: emptyAddress,
  billingSameAsDelivery: true, billingAddress: emptyAddress, additionalNotes: "",
};

type OrderFlowContextValue = {
  config: PlateConfiguration;
  setConfig: React.Dispatch<React.SetStateAction<PlateConfiguration>>;
  items: CartItem[];
  editingItemId: string | null;
  totalQuantity: number;
  orderNotes: string;
  setOrderNotes: (value: string) => void;
  customer: CustomerDetails;
  setCustomer: React.Dispatch<React.SetStateAction<CustomerDetails>>;
  cartOpen: boolean;
  setCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
  uploadedLogoFile: File | null;
  setUploadedLogoFile: React.Dispatch<React.SetStateAction<File | null>>;
  artworkFiles: Record<string, File>;
  setArtworkFileForItem: (itemId: string, file: File | null) => void;
  selectProduct: (productId: string) => void;
  addOrUpdateCartItem: (config: PlateConfiguration) => boolean;
  editCartItem: (itemId: string) => void;
  removeCartItem: (itemId: string) => void;
  setItemQuantity: (itemId: string, quantity: number) => void;
  startAnotherPlate: () => void;
  resetOrder: () => void;
};

const OrderFlowContext = createContext<OrderFlowContextValue | null>(null);

export function OrderFlowProvider({ children }: { children: React.ReactNode }) {
  const draft = useSyncExternalStore(subscribeToOrderDraft, getOrderDraftSnapshot, getOrderDraftServerSnapshot);
  const [customer, setCustomer] = useState(defaultCustomer);
  const [cartOpen, setCartOpen] = useState(false);
  const [uploadedLogoFile, setUploadedLogoFile] = useState<File | null>(null);
  const [artworkFiles, setArtworkFiles] = useState<Record<string, File>>({});

  const setConfig = useCallback<React.Dispatch<React.SetStateAction<PlateConfiguration>>>((action) => {
    updateOrderDraft((current) => ({
      ...current,
      activeConfig: typeof action === "function" ? action(current.activeConfig) : action,
    }));
  }, []);

  const setOrderNotes = useCallback((value: string) => {
    updateOrderDraft((current) => ({ ...current, orderNotes: value.slice(0, 1000) }));
  }, []);

  const selectProduct = useCallback((productId: string) => {
    updateOrderDraft((current) => ({
      ...current,
      activeConfig: current.activeConfig.productId === productId
        ? current.activeConfig
        : createDefaultConfiguration(productId, current.activeConfig.registration),
    }));
    setUploadedLogoFile(null);
  }, []);

  const addOrUpdateCartItem = useCallback((config: PlateConfiguration) => {
    let accepted = false;
    let targetId = "";
    updateOrderDraft((current) => {
      const existing = current.editingItemId ? current.items.find((item) => item.id === current.editingItemId) : null;
      const quantity = existing?.quantity ?? 1;
      const quantityWithoutExisting = getCartQuantity(current.items) - (existing?.quantity ?? 0);
      if (quantityWithoutExisting + quantity > 20) return current;
      accepted = true;
      targetId = existing?.id ?? crypto.randomUUID();
      const item: CartItem = { id: targetId, config, quantity };
      return {
        ...current,
        activeConfig: config,
        editingItemId: null,
        items: existing ? current.items.map((entry) => entry.id === existing.id ? item : entry) : [...current.items, item],
      };
    });
    if (accepted && targetId) {
      setArtworkFiles((current) => {
        const next = { ...current };
        if (config.logo === "Other Logo" && uploadedLogoFile) next[targetId] = uploadedLogoFile;
        else delete next[targetId];
        return next;
      });
    }
    return accepted;
  }, [uploadedLogoFile]);

  const editCartItem = useCallback((itemId: string) => {
    updateOrderDraft((current) => {
      const item = current.items.find((entry) => entry.id === itemId);
      return item ? { ...current, activeConfig: item.config, editingItemId: itemId } : current;
    });
    setUploadedLogoFile(artworkFiles[itemId] ?? null);
    setCartOpen(false);
  }, [artworkFiles]);

  const removeCartItem = useCallback((itemId: string) => {
    updateOrderDraft((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== itemId),
      editingItemId: current.editingItemId === itemId ? null : current.editingItemId,
    }));
    setArtworkFiles((current) => {
      const next = { ...current };
      delete next[itemId];
      return next;
    });
  }, []);

  const setItemQuantity = useCallback((itemId: string, quantity: number) => {
    updateOrderDraft((current) => {
      const currentItem = current.items.find((item) => item.id === itemId);
      if (!currentItem) return current;
      const otherQuantity = getCartQuantity(current.items) - currentItem.quantity;
      const nextQuantity = Math.max(1, Math.min(quantity, 20 - otherQuantity));
      return { ...current, items: current.items.map((item) => item.id === itemId ? { ...item, quantity: nextQuantity } : item) };
    });
  }, []);

  const startAnotherPlate = useCallback(() => {
    updateOrderDraft((current) => ({ ...current, activeConfig: createDefaultConfiguration("hand-crafted-show-plate"), editingItemId: null }));
    setUploadedLogoFile(null);
    setCartOpen(false);
  }, []);

  const setArtworkFileForItem = useCallback((itemId: string, file: File | null) => {
    setArtworkFiles((current) => {
      const next = { ...current };
      if (file) next[itemId] = file;
      else delete next[itemId];
      return next;
    });
  }, []);

  const resetOrder = useCallback(() => {
    clearOrderDraft();
    setCustomer(defaultCustomer);
    setUploadedLogoFile(null);
    setArtworkFiles({});
  }, []);

  const value = useMemo<OrderFlowContextValue>(() => ({
    config: draft.activeConfig, setConfig, items: draft.items, editingItemId: draft.editingItemId,
    totalQuantity: getCartQuantity(draft.items), orderNotes: draft.orderNotes, setOrderNotes,
    customer, setCustomer, cartOpen, setCartOpen, uploadedLogoFile, setUploadedLogoFile,
    artworkFiles, setArtworkFileForItem, selectProduct, addOrUpdateCartItem, editCartItem,
    removeCartItem, setItemQuantity, startAnotherPlate, resetOrder,
  }), [addOrUpdateCartItem, artworkFiles, cartOpen, customer, draft, editCartItem, removeCartItem, resetOrder, selectProduct, setArtworkFileForItem, setConfig, setItemQuantity, setOrderNotes, startAnotherPlate, uploadedLogoFile]);

  return <OrderFlowContext.Provider value={value}>{children}</OrderFlowContext.Provider>;
}

export function useOrderFlow(): OrderFlowContextValue {
  const context = useContext(OrderFlowContext);
  if (!context) throw new Error("useOrderFlow must be used inside OrderFlowProvider");
  return context;
}
