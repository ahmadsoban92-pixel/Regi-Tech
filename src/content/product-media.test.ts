import { describe, expect, it } from "vitest";
import processStory from "@/content/manufacturing-process.json";
import products from "@/content/products.json";

describe("product media content", () => {
  it("uses the supplied road-legal gallery without a manufacturing story", () => {
    const roadLegal = products.find((product) => product.id === "2d-road-legal");

    expect(roadLegal?.image).toBe("/assets/product-photos/final/road-legal/7x9.jpg");
    expect(roadLegal?.gallery).toHaveLength(1);
    expect("processStoryId" in (roadLegal ?? {})).toBe(false);
  });

  it("omits the manufacturing button from both 2D printed cards", () => {
    const showProducts = products.filter((product) => product.id !== "2d-road-legal" && product.id !== "2d-show-plate");

    expect(showProducts).toHaveLength(3);
    expect(showProducts.every((product) => product.processStoryId === processStory.id)).toBe(true);
    expect("processStoryId" in (products.find((product) => product.id === "2d-show-plate") ?? {})).toBe(false);
  });

  it("contains five local manufacturing steps in the supplied order", () => {
    expect(processStory.steps.map((step) => step.title)).toEqual([
      "Precision laser cutting",
      "Masking removal",
      "Glossy black finishing",
      "Mirror Silver finishing",
      "Reflective layer and inspection",
    ]);
    expect(processStory.steps.every((step) => step.image.startsWith("/assets/product-photos/final/"))).toBe(true);
    expect(processStory.steps.every((step) => !step.image.startsWith("http"))).toBe(true);
  });
});
