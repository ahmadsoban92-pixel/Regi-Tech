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

export const checkoutSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name.").max(CHECKOUT_NAME_MAX, `First name must be ${CHECKOUT_NAME_MAX} characters or fewer.`),
  lastName: z.string().trim().min(1, "Enter your last name.").max(CHECKOUT_NAME_MAX, `Last name must be ${CHECKOUT_NAME_MAX} characters or fewer.`),
  email: z.string().trim().min(1, "Enter your email address.").max(CHECKOUT_EMAIL_MAX, `Email must be ${CHECKOUT_EMAIL_MAX} characters or fewer.`).email("Enter a valid email address."),
  telephone: z.string().trim().min(1, "Enter your telephone number.").max(CHECKOUT_TELEPHONE_MAX, `Telephone must be ${CHECKOUT_TELEPHONE_MAX} characters or fewer.`),
  deliveryAddress: requiredAddressSchema,
  billingSameAsDelivery: z.boolean(),
  billingAddress: optionalAddressSchema,
  additionalNotes: z.string().max(ORDER_NOTES_MAX, `Additional notes must be ${ORDER_NOTES_MAX} characters or fewer.`),
}).superRefine((values, context) => {
  if (values.billingSameAsDelivery) return;
  const result = requiredAddressSchema.safeParse(values.billingAddress);
  if (result.success) return;
  result.error.issues.forEach((issue) => context.addIssue({ ...issue, path: ["billingAddress", ...issue.path] }));
});

export const addressLookupQuerySchema = z.object({
  postcode: z.string().trim().min(2, "Enter a UK postcode.").max(CHECKOUT_POSTCODE_MAX, `Postcode must be ${CHECKOUT_POSTCODE_MAX} characters or fewer.`),
  page: z.coerce.number().int().min(0).max(50).default(0),
});

export type ConfiguratorFormValues = z.infer<ReturnType<typeof createConfiguratorSchema>>;
export type ReviewFormValues = z.infer<typeof reviewSchema>;
export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
