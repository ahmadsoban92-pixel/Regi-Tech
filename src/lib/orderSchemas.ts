import { z } from "zod";
import {
  CHECKOUT_ADDRESS_MAX,
  CHECKOUT_COUNTRY_MAX,
  CHECKOUT_EMAIL_MAX,
  CHECKOUT_NAME_MAX,
  CHECKOUT_POSTCODE_MAX,
  CHECKOUT_TELEPHONE_MAX,
  CHECKOUT_TOWN_MAX,
  CUSTOM_DIMENSION_MAX,
  ORDER_NOTES_MAX,
  ORDER_QUANTITY_MAX,
  PRODUCT_LABEL_MAX,
  REGISTRATION_MAX,
  ROAD_LEGAL_REGISTRATION_MAX,
  SLOGAN_MAX,
  SPECIAL_REQUIREMENTS_MAX,
  UPLOADED_FILE_NAME_MAX,
} from "@/lib/formLimits";
import type { PlateUseType } from "@/types/order";

const showRegistrationSchema = z.string().max(REGISTRATION_MAX, `Registration must be ${REGISTRATION_MAX} characters or fewer.`).refine((value) => value.trim().length > 0, "Enter your registration.").transform((value) => value.toUpperCase());
const roadLegalRegistrationSchema = z.string().trim().min(1, "Enter your registration.").transform((value) => value.replace(/\s+/g, "").toUpperCase()).refine((value) => /^[A-Z0-9]+$/.test(value), "Use letters and numbers only.").refine((value) => value.length <= ROAD_LEGAL_REGISTRATION_MAX, `Road-legal registration must be ${ROAD_LEGAL_REGISTRATION_MAX} characters or fewer.`);

export function createConfiguratorSchema(useType: PlateUseType) {
  return z.object({
    registration: useType === "road-legal" ? roadLegalRegistrationSchema : showRegistrationSchema,
    customWidth: z.string().max(CUSTOM_DIMENSION_MAX, `Width must be ${CUSTOM_DIMENSION_MAX} characters or fewer.`),
    customHeight: z.string().max(CUSTOM_DIMENSION_MAX, `Height must be ${CUSTOM_DIMENSION_MAX} characters or fewer.`),
    customDimensionUnit: z.enum(["in", "cm"]),
    uploadedLogoName: z.string().max(UPLOADED_FILE_NAME_MAX, `File name must be ${UPLOADED_FILE_NAME_MAX} characters or fewer.`),
    sloganText: z.string().max(SLOGAN_MAX, `Slogan must be ${SLOGAN_MAX} characters or fewer.`),
    specialRequirements: z.string().max(SPECIAL_REQUIREMENTS_MAX, `Special requirements must be ${SPECIAL_REQUIREMENTS_MAX} characters or fewer.`),
  });
}

export const configuratorSchema = createConfiguratorSchema("show");

export const reviewSchema = z.object({
  orderNotes: z.string().max(ORDER_NOTES_MAX, `Order notes must be ${ORDER_NOTES_MAX} characters or fewer.`),
  confirmed: z.boolean().refine(Boolean, "Confirm that you have checked your order details."),
});

const requiredAddressSchema = z.object({
  addressLine1: z.string().trim().min(1, "Enter the first address line.").max(CHECKOUT_ADDRESS_MAX, `Address must be ${CHECKOUT_ADDRESS_MAX} characters or fewer.`),
  addressLine2: z.string().max(CHECKOUT_ADDRESS_MAX, `Address must be ${CHECKOUT_ADDRESS_MAX} characters or fewer.`),
  town: z.string().trim().min(1, "Enter your town or city.").max(CHECKOUT_TOWN_MAX, `Town or city must be ${CHECKOUT_TOWN_MAX} characters or fewer.`),
  county: z.string().max(CHECKOUT_TOWN_MAX, `County must be ${CHECKOUT_TOWN_MAX} characters or fewer.`),
  postcode: z.string().trim().min(1, "Enter your postcode.").max(CHECKOUT_POSTCODE_MAX, `Postcode must be ${CHECKOUT_POSTCODE_MAX} characters or fewer.`),
  country: z.string().trim().min(1, "Enter your country.").max(CHECKOUT_COUNTRY_MAX, `Country must be ${CHECKOUT_COUNTRY_MAX} characters or fewer.`),
});

const optionalAddressSchema = z.object({
  addressLine1: z.string().max(CHECKOUT_ADDRESS_MAX, `Address must be ${CHECKOUT_ADDRESS_MAX} characters or fewer.`),
  addressLine2: z.string().max(CHECKOUT_ADDRESS_MAX, `Address must be ${CHECKOUT_ADDRESS_MAX} characters or fewer.`),
  town: z.string().max(CHECKOUT_TOWN_MAX, `Town or city must be ${CHECKOUT_TOWN_MAX} characters or fewer.`),
  county: z.string().max(CHECKOUT_TOWN_MAX, `County must be ${CHECKOUT_TOWN_MAX} characters or fewer.`),
  postcode: z.string().max(CHECKOUT_POSTCODE_MAX, `Postcode must be ${CHECKOUT_POSTCODE_MAX} characters or fewer.`),
  country: z.string().max(CHECKOUT_COUNTRY_MAX, `Country must be ${CHECKOUT_COUNTRY_MAX} characters or fewer.`),
});

const checkoutCustomerBaseSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name.").max(CHECKOUT_NAME_MAX, `First name must be ${CHECKOUT_NAME_MAX} characters or fewer.`),
  lastName: z.string().trim().min(1, "Enter your last name.").max(CHECKOUT_NAME_MAX, `Last name must be ${CHECKOUT_NAME_MAX} characters or fewer.`),
  email: z.string().trim().min(1, "Enter your email address.").max(CHECKOUT_EMAIL_MAX, `Email must be ${CHECKOUT_EMAIL_MAX} characters or fewer.`).email("Enter a valid email address."),
  telephone: z.string().trim().min(1, "Enter your telephone number.").max(CHECKOUT_TELEPHONE_MAX, `Telephone must be ${CHECKOUT_TELEPHONE_MAX} characters or fewer.`),
  deliveryAddress: requiredAddressSchema,
  billingSameAsDelivery: z.boolean(),
  billingAddress: optionalAddressSchema,
  additionalNotes: z.string().max(ORDER_NOTES_MAX, `Additional notes must be ${ORDER_NOTES_MAX} characters or fewer.`),
});

function validateBillingAddress(
  values: z.infer<typeof checkoutCustomerBaseSchema>,
  context: z.RefinementCtx,
) {
  if (values.billingSameAsDelivery) return;
  const result = requiredAddressSchema.safeParse(values.billingAddress);
  if (result.success) return;
  result.error.issues.forEach((issue) => context.addIssue({ ...issue, path: ["billingAddress", ...issue.path] }));
}

export const customerDetailsSchema = checkoutCustomerBaseSchema.superRefine(validateBillingAddress);

export function createCheckoutSchema() {
  return checkoutCustomerBaseSchema.superRefine(validateBillingAddress);
}

export const checkoutSchema = createCheckoutSchema();

const productIdSchema = z.enum(["hand-crafted-show-plate", "2d-road-legal", "2d-show-plate", "crystal-3d", "black-4d"]);
const plateSizeSchema = z.enum(["3×7″", "4×6″", "5×7″", "6×8″", "7×9″", "Custom"]);
const borderOptionSchema = z.enum(["None", "Black", "Mirror Silver"]);
const logoOptionSchema = z.enum(["No Logo", "BMW", "Ducati", "Harley-Davidson", "Honda", "Kawasaki", "Triumph", "KTM", "Other Logo"]);
const sloganFontSchema = z.enum(["The Boss", "The Scribbler", "Rebel"]);
const countryFlagSchema = z.enum(["none", "uk", "eng", "cymru", "sco"]);
const fixingOptionSchema = z.enum(["none", "fixing-kit", "adhesive-kit", "complete-bundle"]);

export const plateConfigurationSchema = z.object({
  productId: productIdSchema,
  productName: z.string().max(PRODUCT_LABEL_MAX, `Product name must be ${PRODUCT_LABEL_MAX} characters or fewer.`),
  badge: z.string().max(PRODUCT_LABEL_MAX, `Badge must be ${PRODUCT_LABEL_MAX} characters or fewer.`),
  useType: z.enum(["show", "road-legal"]),
  registration: z.string().max(REGISTRATION_MAX, `Registration must be ${REGISTRATION_MAX} characters or fewer.`),
  size: plateSizeSchema,
  customWidth: z.string().max(CUSTOM_DIMENSION_MAX, `Width must be ${CUSTOM_DIMENSION_MAX} characters or fewer.`),
  customHeight: z.string().max(CUSTOM_DIMENSION_MAX, `Height must be ${CUSTOM_DIMENSION_MAX} characters or fewer.`),
  customDimensionUnit: z.enum(["in", "cm"]),
  innerBorder: borderOptionSchema,
  outerBorder: borderOptionSchema,
  logo: logoOptionSchema,
  logoPosition: z.object({ x: z.number().finite().min(0).max(100), y: z.number().finite().min(0).max(100) }),
  uploadedLogoName: z.string().max(UPLOADED_FILE_NAME_MAX, `File name must be ${UPLOADED_FILE_NAME_MAX} characters or fewer.`),
  uploadedLogoPreviewUrl: z.string().max(2048, "Artwork preview URL is too long."),
  uploadedLogoMimeType: z.string().max(120, "Artwork MIME type is too long."),
  sloganMode: z.enum(["none", "custom"]),
  sloganText: z.string().max(SLOGAN_MAX, `Slogan must be ${SLOGAN_MAX} characters or fewer.`),
  sloganFont: sloganFontSchema,
  countryFlag: countryFlagSchema,
  fixing: fixingOptionSchema,
  specialRequirements: z.string().max(SPECIAL_REQUIREMENTS_MAX, `Special requirements must be ${SPECIAL_REQUIREMENTS_MAX} characters or fewer.`),
  basePrice: z.number().finite().nonnegative(),
});

export const cartItemSchema = z.object({
  id: z.string().min(1).max(64).regex(/^[A-Za-z0-9-]+$/, "Cart item identifier is invalid."),
  config: plateConfigurationSchema,
  quantity: z.number().int().min(1).max(ORDER_QUANTITY_MAX),
});

const uploadIdSchema = z.string().uuid("The upload identifier is invalid.").optional();
export const checkoutItemSchema = cartItemSchema.extend({
  v5cUploadId: uploadIdSchema,
  artworkUploadId: uploadIdSchema,
});

export const checkoutSubmissionSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, "Add at least one plate to the cart.").max(ORDER_QUANTITY_MAX),
  customer: customerDetailsSchema,
  orderNotes: z.string().max(ORDER_NOTES_MAX, `Order notes must be ${ORDER_NOTES_MAX} characters or fewer.`),
}).superRefine((value, context) => {
  const totalQuantity = value.items.reduce((total, item) => total + item.quantity, 0);
  if (totalQuantity > ORDER_QUANTITY_MAX) {
    context.addIssue({ code: "custom", message: `An order can contain at most ${ORDER_QUANTITY_MAX} plates.`, path: ["items"] });
  }
});

export const orderUploadRequestSchema = z.object({
  cartItemId: z.string().min(1).max(64).regex(/^[A-Za-z0-9-]+$/, "Cart item identifier is invalid."),
  kind: z.enum(["v5c", "artwork"]),
  filename: z.string().trim().min(1).max(UPLOADED_FILE_NAME_MAX),
  mimeType: z.enum(["application/pdf", "image/jpeg", "image/png", "image/svg+xml"]),
  size: z.number().int().min(1).max(10 * 1024 * 1024),
}).superRefine((value, context) => {
  if (value.kind === "v5c" && value.mimeType === "image/svg+xml") context.addIssue({ code: "custom", path: ["mimeType"], message: "V5C documents must be PDF, JPG or PNG." });
});

export const addressLookupQuerySchema = z.object({
  postcode: z.string().trim().min(2, "Enter a UK postcode.").max(CHECKOUT_POSTCODE_MAX, `Postcode must be ${CHECKOUT_POSTCODE_MAX} characters or fewer.`),
  page: z.coerce.number().int().min(0).max(50).default(0),
});

export type ConfiguratorFormValues = z.infer<ReturnType<typeof createConfiguratorSchema>>;
export type ReviewFormValues = z.infer<typeof reviewSchema>;
export type CheckoutFormValues = z.infer<ReturnType<typeof createCheckoutSchema>>;
export type CheckoutSubmissionValues = z.infer<typeof checkoutSubmissionSchema>;
export type OrderUploadRequestValues = z.infer<typeof orderUploadRequestSchema>;
