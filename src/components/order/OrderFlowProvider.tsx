"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import products from "@/content/products.json";
import type { CustomerDetails, PlateConfiguration } from "@/types/order";

const firstProduct = products[0];

const defaultConfiguration: PlateConfiguration = {
  productId: firstProduct.id,
  productName: firstProduct.name,
  badge: firstProduct.badge,
  registration: "",
  size: "6×8″",
  customWidth: "",
  customHeight: "",
  innerBorder: "None",
  outerBorder: "None",
  logo: "No Logo",
  uploadedLogoName: "",
  sloganEnabled: false,
  sloganText: "Ride with passion",
  sloganFont: "The Boss",
  fixing: "No Fixing",
  specialRequirements: "",
  orderNotes: "",
  basePrice: Number(firstProduct.price.replace(/[^0-9.]/g, "")),
};

const defaultCustomer: CustomerDetails = {
  firstName: "",
  lastName: "",
  email: "",
  telephone: "",
  addressLine1: "",
  addressLine2: "",
  town: "",
  postcode: "",
  country: "United Kingdom",
  billingSameAsDelivery: true,
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
    const product = products.find((item) => item.id === productId) ?? firstProduct;
    setConfig((current) => ({
      ...defaultConfiguration,
      productId: product.id,
      productName: product.name,
      badge: product.badge,
      registration: current.registration,
      basePrice: Number(product.price.replace(/[^0-9.]/g, "")),
    }));
  }, []);

  const resetOrder = useCallback(() => {
    setConfig(defaultConfiguration);
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
