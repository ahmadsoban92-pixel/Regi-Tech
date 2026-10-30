import { describe, expect, it } from "vitest";
import processStory from "@/content/manufacturing-process.json";
import products from "@/content/products.json";

describe("product media content", () => {
  it("uses the supplied road-legal gallery without a manufacturing story", () => {
    const roadLegal = products.find((product) => product.id === "2d-road-legal");

    expect(roadLegal?.image).toBe("/assets/product-photos/road-legal/ab88cde7x9roadlegal1.webp");
    expect(roadLegal?.gallery).toHaveLength(2);
    expect("processStoryId" in (roadLegal ?? {})).toBe(false);
  });

  it("offers the shared manufacturing story on every show-plate product", () => {
    const showProducts = products.filter((product) => product.id !== "2d-road-legal");

    expect(showProducts).toHaveLength(4);
    expect(showProducts.every((product) => product.processStoryId === processStory.id)).toBe(true);
  });

  it("contains five local manufacturing steps in the supplied order", () => {
    expect(processStory.steps.map((step) => step.title)).toEqual([
      "Precision laser cutting",
      "Masking removal",
      "Glossy black finishing",
      "Mirror Silver finishing",
      "Reflective layer and inspection",
    ]);
    expect(processStory.steps.every((step) => step.image.startsWith("/assets/how-we-make/"))).toBe(true);
    expect(processStory.steps.every((step) => !step.image.startsWith("http"))).toBe(true);
  });
});
