import adminContent from "@/content/admin.json";
import { FIXING_OPTIONS, formatPlateSize, getCountryFlagDefinition } from "@/lib/productCatalog";
import type { AddressDetails, PlateConfiguration } from "@/types/order";
import type { PaymentStatus, VerificationStatus } from "@/types/orderApi";
import type { AdminFulfilmentStatus } from "@/types/admin";

export function formatAdminMoney(pence: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}

export function formatAdminDate(value: string, includeTime = false) {
  return new Intl.DateTimeFormat("en-GB", includeTime
    ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/London" }
    : { day: "2-digit", month: "short", year: "numeric", timeZone: "Europe/London" }).format(new Date(value));
}

export function formatAdminAddress(address: AddressDetails) {
  return [address.addressLine1, address.addressLine2, address.town, address.county, address.postcode, address.country].filter(Boolean).join(", ");
}

export function getAdminStatusLabel(status: PaymentStatus | VerificationStatus | AdminFulfilmentStatus) {
  return adminContent.statuses[status as keyof typeof adminContent.statuses];
}

export function getAdminPlateDetails(config: PlateConfiguration) {
  return {
    size: formatPlateSize(config),
    flag: config.countryFlag === "none" ? "None" : getCountryFlagDefinition(config.countryFlag).label,
    logo: config.logo,
    slogan: config.sloganMode === "custom" && config.sloganText ? config.sloganText : "None",
    fixing: FIXING_OPTIONS[config.fixing].label
  };
}

export function summarizeRegistrations(configurations: PlateConfiguration[]) {
  const values = configurations.map((config) => config.registration || "YOUR REJ");
  return values.length > 1 ? `${values[0]} +${values.length - 1}` : values[0];
}

export function summarizeProducts(configurations: PlateConfiguration[]) {
  const values = configurations.map((config) => config.productName);
  return values.length > 1 ? `${values[0]} +${values.length - 1}` : values[0];
}
