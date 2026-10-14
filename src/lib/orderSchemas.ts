import { z } from "zod";
import {
  CHECKOUT_ADDRESS_MAX,
  CHECKOUT_EMAIL_MAX,
  CHECKOUT_NAME_MAX,
  CHECKOUT_POSTCODE_MAX,
  CHECKOUT_TELEPHONE_MAX,
  CHECKOUT_TOWN_MAX,
  CUSTOM_DIMENSION_MAX,
  ORDER_NOTES_MAX,
  REGISTRATION_MAX,
  SLOGAN_MAX,
  SPECIAL_REQUIREMENTS_MAX,
} from "@/lib/formLimits";

export const configuratorSchema = z.object({
  registration: z.string().trim().min(1, "Enter your registration.").max(REGISTRATION_MAX, `Registration must be ${REGISTRATION_MAX} characters or fewer.`),
  customWidth: z.string().max(CUSTOM_DIMENSION_MAX, `Width must be ${CUSTOM_DIMENSION_MAX} characters or fewer.`),
  customHeight: z.string().max(CUSTOM_DIMENSION_MAX, `Height must be ${CUSTOM_DIMENSION_MAX} characters or fewer.`),
  uploadedLogoName: z.string().max(255, "File name must be 255 characters or fewer."),
  sloganText: z.string().max(SLOGAN_MAX, `Slogan must be ${SLOGAN_MAX} characters or fewer.`),
  specialRequirements: z.string().max(SPECIAL_REQUIREMENTS_MAX, `Special requirements must be ${SPECIAL_REQUIREMENTS_MAX} characters or fewer.`),
});

export const reviewSchema = z.object({
  orderNotes: z.string().max(ORDER_NOTES_MAX, `Order notes must be ${ORDER_NOTES_MAX} characters or fewer.`),
  confirmed: z.boolean().refine(Boolean, "Confirm that you have checked your order details."),
});

export const checkoutSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name.").max(CHECKOUT_NAME_MAX, `First name must be ${CHECKOUT_NAME_MAX} characters or fewer.`),
  lastName: z.string().trim().min(1, "Enter your last name.").max(CHECKOUT_NAME_MAX, `Last name must be ${CHECKOUT_NAME_MAX} characters or fewer.`),
  email: z.string().trim().min(1, "Enter your email address.").max(CHECKOUT_EMAIL_MAX, `Email must be ${CHECKOUT_EMAIL_MAX} characters or fewer.`).email("Enter a valid email address."),
  telephone: z.string().trim().min(1, "Enter your telephone number.").max(CHECKOUT_TELEPHONE_MAX, `Telephone must be ${CHECKOUT_TELEPHONE_MAX} characters or fewer.`),
  addressLine1: z.string().trim().min(1, "Enter your delivery address.").max(CHECKOUT_ADDRESS_MAX, `Address must be ${CHECKOUT_ADDRESS_MAX} characters or fewer.`),
  addressLine2: z.string().max(CHECKOUT_ADDRESS_MAX, `Address must be ${CHECKOUT_ADDRESS_MAX} characters or fewer.`),
  town: z.string().trim().min(1, "Enter your town or city.").max(CHECKOUT_TOWN_MAX, `Town or city must be ${CHECKOUT_TOWN_MAX} characters or fewer.`),
  postcode: z.string().trim().min(1, "Enter your postcode.").max(CHECKOUT_POSTCODE_MAX, `Postcode must be ${CHECKOUT_POSTCODE_MAX} characters or fewer.`),
  country: z.string().max(80, "Country must be 80 characters or fewer."),
  billingSameAsDelivery: z.boolean(),
  additionalNotes: z.string().max(ORDER_NOTES_MAX, `Additional notes must be ${ORDER_NOTES_MAX} characters or fewer.`),
});

export type ConfiguratorFormValues = z.infer<typeof configuratorSchema>;
export type ReviewFormValues = z.infer<typeof reviewSchema>;
export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
