"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { createDefaultConfiguration } from "@/lib/productCatalog";
import type { CustomerDetails, PlateConfiguration } from "@/types/order";

const defaultConfiguration = createDefaultConfiguration("hand-crafted-show-plate");

const emptyAddress = {
  addressLine1: "",
  addressLine2: "",
  town: "",
  county: "",
  postcode: "",
  country: "United Kingdom",
};

const defaultCustomer: CustomerDetails = {
  firstName: "",
  lastName: "",
  email: "",
  telephone: "",
  deliveryAddress: emptyAddress,
  billingSameAsDelivery: true,
  billingAddress: emptyAddress,
  additionalNotes: "",
};

type OrderFlowContextValue = {
  config: PlateConfiguration;
  setConfig: React.Dispatch<React.SetStateAction<PlateConfiguration>>;
  customer: CustomerDetails;
  setCustomer: React.Dispatch<React.SetStateAction<CustomerDetails>>;
  hasCartItem: boolean;
  setHasCartItem: React.Dispatch<React.SetStateAction<boolean>>;
  cartOpen: boolean;
  setCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
  selectProduct: (productId: string) => void;
  resetOrder: () => void;
};

const OrderFlowContext = createContext<OrderFlowContextValue | null>(null);

export function OrderFlowProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState(defaultConfiguration);
  const [customer, setCustomer] = useState(defaultCustomer);
  const [hasCartItem, setHasCartItem] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const selectProduct = useCallback((productId: string) => {
    setConfig((current) => current.productId === productId ? current : createDefaultConfiguration(productId, current.registration));
  }, []);

  const resetOrder = useCallback(() => {
    setConfig(createDefaultConfiguration("hand-crafted-show-plate"));
    setCustomer(defaultCustomer);
    setHasCartItem(false);
    setQuantity(1);
  }, []);

  const value = useMemo<OrderFlowContextValue>(() => ({
    config,
    setConfig,
    customer,
    setCustomer,
    hasCartItem,
    setHasCartItem,
    cartOpen,
    setCartOpen,
    quantity,
    setQuantity,
    selectProduct,
    resetOrder,
  }), [cartOpen, config, customer, hasCartItem, quantity, resetOrder, selectProduct]);

  return <OrderFlowContext.Provider value={value}>{children}</OrderFlowContext.Provider>;
}

export function useOrderFlow(): OrderFlowContextValue {
  const context = useContext(OrderFlowContext);
  if (!context) throw new Error("useOrderFlow must be used inside OrderFlowProvider");
  return context;
}
