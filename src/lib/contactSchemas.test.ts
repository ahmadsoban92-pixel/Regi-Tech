import { describe, expect, it } from "vitest";
import { contactSubmissionSchema } from "@/lib/contactSchemas";

describe("contactSubmissionSchema", () => {
  it("normalizes email and order references", () => {
    const result = contactSubmissionSchema.parse({
      name: "  Alex Rider  ",
      email: "  ALEX@EXAMPLE.COM ",
      reference: " rt-26123456 ",
      message: " Please call me. ",
      website: "",
    });
    expect(result).toMatchObject({ name: "Alex Rider", email: "alex@example.com", reference: "RT-26123456", message: "Please call me." });
  });

  it("retains a filled honeypot so the API can absorb bot submissions", () => {
    const result = contactSubmissionSchema.parse({ name: "Alex", email: "alex@example.com", reference: "", message: "Hello", website: "spam.example" });
    expect(result.website).toBe("spam.example");
  });
});
