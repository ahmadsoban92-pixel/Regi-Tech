import { describe, expect, it } from "vitest";
import { checkoutSubmissionSchema, orderUploadRequestSchema } from "@/lib/orderSchemas";

describe("order upload validation", () => {
  it("accepts supported V5C metadata", () => {
    expect(orderUploadRequestSchema.safeParse({ cartItemId: "line-1", kind: "v5c", filename: "v5c.pdf", mimeType: "application/pdf", size: 1024 }).success).toBe(true);
  });

  it("rejects SVG V5C documents and oversized files", () => {
    expect(orderUploadRequestSchema.safeParse({ cartItemId: "line-1", kind: "v5c", filename: "v5c.svg", mimeType: "image/svg+xml", size: 1024 }).success).toBe(false);
    expect(orderUploadRequestSchema.safeParse({ cartItemId: "line-1", kind: "artwork", filename: "logo.png", mimeType: "image/png", size: 10 * 1024 * 1024 + 1 }).success).toBe(false);
  });
});

describe("checkout order limits", () => {
  it("rejects an empty cart", () => {
    const result = checkoutSubmissionSchema.safeParse({ items: [], customer: {}, orderNotes: "" });
    expect(result.success).toBe(false);
  });
});
