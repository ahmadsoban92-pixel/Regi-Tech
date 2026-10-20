import { checkoutSubmissionSchema, createConfiguratorSchema } from "@/lib/orderSchemas";
import { getOrderTotalPence, getPriceBreakdown } from "@/lib/orderPricing";
import { getProductRule } from "@/lib/productCatalog";
import type { CheckoutSubmissionValues } from "@/lib/orderSchemas";
import type { PlateConfiguration } from "@/types/order";
import type { ValidatedOrderFile } from "@/lib/orderFiles";

export type OrderItemFiles = { artwork: ValidatedOrderFile | null; v5c: ValidatedOrderFile | null };

export class OrderValidationError extends Error {
  constructor(message: string, public readonly errors?: Record<string, string[]>) {
    super(message);
    this.name = "OrderValidationError";
  }
}

function reject(message: string, field = "items") {
  throw new OrderValidationError(message, { [field]: [message] });
}

export function parseCheckoutSubmission(value: unknown): CheckoutSubmissionValues {
  const result = checkoutSubmissionSchema.safeParse(value);
  if (!result.success) throw new OrderValidationError("Check the order details and try again.", result.error.flatten().fieldErrors as Record<string, string[]>);
  if (new Set(result.data.items.map((item) => item.id)).size !== result.data.items.length) reject("Each cart line must have a unique identifier.");
  return result.data;
}

function canonicalizeItem(item: CheckoutSubmissionValues["items"][number], files: OrderItemFiles) {
  const rule = getProductRule(item.config.productId);
  const config = item.config;
  if (config.productName !== rule.name || config.badge !== rule.badge || config.basePrice !== rule.basePrice) reject("The submitted product pricing does not match the current catalogue.", `items.${item.id}.basePrice`);
  if (config.useType !== rule.useType) reject("The selected plate use type is not valid for this product.");
  if (!rule.sizes.includes(config.size)) reject("The selected plate size is not available for this product.", `items.${item.id}.size`);
  if (!rule.innerBorders.includes(config.innerBorder)) reject("The selected inner border is not available for this product.", `items.${item.id}.innerBorder`);
  if (!rule.outerBorders.includes(config.outerBorder)) reject("The selected outer border is not available for this product.", `items.${item.id}.outerBorder`);
  if (!rule.logos.includes(config.logo)) reject("The selected logo is not available for this product.", `items.${item.id}.logo`);
  if (!rule.countryFlags.includes(config.countryFlag)) reject("The selected country flag is not available for this product.", `items.${item.id}.countryFlag`);
  if (!rule.fixings.includes(config.fixing)) reject("The selected fixing is not available for this product.", `items.${item.id}.fixing`);
  if (!rule.slogan && config.sloganMode !== "none") reject("A slogan is not available for this product.", `items.${item.id}.sloganMode`);

  const configuratorResult = createConfiguratorSchema(rule.useType).safeParse({
    registration: config.registration,
    customWidth: config.customWidth,
    customHeight: config.customHeight,
    customDimensionUnit: config.customDimensionUnit,
    uploadedLogoName: config.uploadedLogoName,
    sloganText: config.sloganText,
    specialRequirements: config.specialRequirements,
  });
  if (!configuratorResult.success) throw new OrderValidationError("Check the plate configuration and try again.", configuratorResult.error.flatten().fieldErrors as Record<string, string[]>);

  if (config.size === "Custom") {
    const width = Number(config.customWidth);
    const height = Number(config.customHeight);
    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) reject("Enter valid positive custom dimensions.", `items.${item.id}.size`);
  }
  if (rule.useType === "road-legal" && !files.v5c) reject("Upload a clear PDF, JPG or PNG copy of the V5C document for every road-legal plate.", `v5c-${item.id}`);
  if (rule.useType !== "road-legal" && files.v5c) reject("V5C documents can only be attached to road-legal plates.", `v5c-${item.id}`);
  if (config.logo === "Other Logo" && !files.artwork) reject("Upload the Other Logo artwork for every applicable plate.", `artwork-${item.id}`);
  if (config.logo !== "Other Logo" && files.artwork) reject("Uploaded artwork is only accepted when Other Logo is selected.", `artwork-${item.id}`);

  const canonicalConfig: PlateConfiguration = {
    ...config,
    productName: rule.name,
    badge: rule.badge,
    useType: rule.useType,
    basePrice: rule.basePrice,
    registration: configuratorResult.data.registration,
    customWidth: configuratorResult.data.customWidth,
    customHeight: configuratorResult.data.customHeight,
    customDimensionUnit: configuratorResult.data.customDimensionUnit,
    uploadedLogoName: files.artwork?.originalName ?? "",
    uploadedLogoMimeType: files.artwork?.mimeType ?? "",
    uploadedLogoPreviewUrl: "",
    sloganMode: rule.slogan ? config.sloganMode : "none",
    sloganText: rule.slogan && config.sloganMode === "custom" ? configuratorResult.data.sloganText : "",
    countryFlag: rule.countryFlags.includes(config.countryFlag) ? config.countryFlag : "none",
    specialRequirements: configuratorResult.data.specialRequirements,
  };
  const priceBreakdown = getPriceBreakdown(canonicalConfig);
  const unitTotalPence = getOrderTotalPence(canonicalConfig);
  return { id: item.id, config: canonicalConfig, quantity: item.quantity, priceBreakdown, unitTotalPence, lineTotalPence: unitTotalPence * item.quantity, files };
}

export function canonicalizeCheckoutSubmission(submission: CheckoutSubmissionValues, filesByItemId: Record<string, OrderItemFiles>) {
  const items = submission.items.map((item) => canonicalizeItem(item, filesByItemId[item.id] ?? { artwork: null, v5c: null }));
  const customer = { ...submission.customer, billingAddress: submission.customer.billingSameAsDelivery ? submission.customer.deliveryAddress : submission.customer.billingAddress };
  const subtotalPence = items.reduce((total, item) => total + item.lineTotalPence, 0);
  return { items, customer, orderNotes: submission.orderNotes, subtotalPence, deliveryPence: 0, totalPence: subtotalPence };
}
