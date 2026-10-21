import { z } from "zod";
import { CONTACT_EMAIL_MAX, CONTACT_MESSAGE_MAX, CONTACT_NAME_MAX, CONTACT_REFERENCE_MAX } from "@/lib/formLimits";

export const contactSubmissionSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(CONTACT_NAME_MAX, `Name must be ${CONTACT_NAME_MAX} characters or fewer.`),
  email: z.string().trim().min(1, "Enter your email address.").max(CONTACT_EMAIL_MAX, `Email must be ${CONTACT_EMAIL_MAX} characters or fewer.`).email("Enter a valid email address.").transform((value) => value.toLocaleLowerCase("en-GB")),
  reference: z.string().trim().max(CONTACT_REFERENCE_MAX, `Order reference must be ${CONTACT_REFERENCE_MAX} characters or fewer.`).transform((value) => value.toUpperCase()),
  message: z.string().trim().min(1, "Enter your message.").max(CONTACT_MESSAGE_MAX, `Message must be ${CONTACT_MESSAGE_MAX} characters or fewer.`),
  website: z.string().max(200).optional().default(""),
});

export type ContactSubmissionValues = z.input<typeof contactSubmissionSchema>;
