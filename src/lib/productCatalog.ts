import type {
  BorderOption,
  CountryFlagDefinition,
  CountryFlag,
  FixingId,
  LogoOption,
  PlateConfiguration,
  PlateSize,
  ProductId,
  ProductRule,
} from "@/types/order";

const STANDARD_SIZES: PlateSize[] = ["3×7″", "4×6″", "5×7″", "6×8″"];
const SHOW_SIZES: PlateSize[] = [...STANDARD_SIZES, "Custom"];
const SHOW_BORDERS: BorderOption[] = ["None", "Black", "Mirror Silver"];
const ALL_LOGOS: LogoOption[] = ["No Logo", "BMW", "Ducati", "Harley-Davidson", "Honda", "Kawasaki", "Triumph", "KTM", "Other Logo"];
const ALL_FLAGS: CountryFlag[] = ["none", "uk", "eng", "cymru", "sco"];
const ALL_FIXINGS: FixingId[] = ["none", "fixing-kit", "adhesive-kit", "complete-bundle"];

export const FIXING_OPTIONS: Record<FixingId, { label: string; description: string; price: number }> = {
  none: { label: "No Fixing", description: "Use your existing motorcycle bracket or hardware.", price: 0 },
  "fixing-kit": { label: "Fixing Kit Included", description: "Four nylon screws, two black and two yellow, plus stainless-steel Nyloc nuts.", price: 1 },
  "adhesive-kit": { label: "Adhesive Fixing Kit Included", description: "Four 3M VHB double-sided adhesive strips.", price: 1 },
  "complete-bundle": { label: "Complete Fixing Bundle", description: "Nylon screws, stainless-steel Nyloc nuts, and four 3M VHB adhesive strips.", price: 2 },
};

export const PRODUCT_RULES: Record<ProductId, ProductRule> = {
  "hand-crafted-show-plate": {
    id: "hand-crafted-show-plate",
    name: "Hand Crafted SHOW PLATE",
    badge: "Show plate",
    useType: "show",
    basePrice: 17.99,
    steps: ["registration", "size", "borders", "logo", "slogan", "fixings"],
    sizes: SHOW_SIZES,
    defaultSize: "6×8″",
    innerBorders: SHOW_BORDERS,
    outerBorders: SHOW_BORDERS,
    logos: ALL_LOGOS,
    slogan: true,
    countryFlags: ["none"],
    fixings: ALL_FIXINGS,
  },
  "2d-road-legal": {
    id: "2d-road-legal",
    name: "2D Printed Road-Legal Number Plate",
    badge: "Road-legal",
    useType: "road-legal",
    basePrice: 13.99,
    steps: ["registration", "borders", "countryFlag", "fixings"],
    sizes: ["7×9″"],
    defaultSize: "7×9″",
    innerBorders: ["None", "Black"],
    outerBorders: ["None"],
    logos: ["No Logo"],
    slogan: false,
    countryFlags: ALL_FLAGS,
    fixings: ALL_FIXINGS,
  },
  "2d-show-plate": {
    id: "2d-show-plate",
    name: "2D Printed Show Plate",
    badge: "Show plate",
    useType: "show",
    basePrice: 14.99,
    steps: ["registration", "size", "borders", "logo", "slogan", "fixings"],
    sizes: STANDARD_SIZES,
    defaultSize: "6×8″",
    innerBorders: ["None", "Black"],
    outerBorders: ["None"],
    logos: ALL_LOGOS,
    slogan: true,
    countryFlags: ["none"],
    fixings: ALL_FIXINGS,
  },
  "crystal-3d": {
    id: "crystal-3d",
    name: "Regi-Tech Crystal 3D™",
    badge: "Show plate",
    useType: "show",
    basePrice: 21.99,
    steps: ["registration", "size", "borders", "logo", "slogan", "fixings"],
    sizes: SHOW_SIZES,
    defaultSize: "6×8″",
    innerBorders: SHOW_BORDERS,
    outerBorders: SHOW_BORDERS,
    logos: ALL_LOGOS,
    slogan: true,
    countryFlags: ["none"],
    fixings: ALL_FIXINGS,
  },
  "black-4d": {
    id: "black-4d",
    name: "Black 4D Motorbike Plate",
    badge: "Show plate",
    useType: "show",
    basePrice: 18.99,
    steps: ["registration", "size", "borders", "logo", "slogan", "fixings"],
    sizes: SHOW_SIZES,
    defaultSize: "6×8″",
    innerBorders: SHOW_BORDERS,
    outerBorders: SHOW_BORDERS,
    logos: ALL_LOGOS,
    slogan: true,
    countryFlags: ["none"],
    fixings: ALL_FIXINGS,
  },
};

export const OPTION_PRICES = {
  sizes: { Custom: 3 } as Partial<Record<PlateSize, number>>,
  borders: { Black: 2, "Mirror Silver": 5 } as Partial<Record<BorderOption, number>>,
  logos: Object.fromEntries(ALL_LOGOS.filter((logo) => logo !== "No Logo").map((logo) => [logo, 2])) as Partial<Record<LogoOption, number>>,
  slogan: 2,
  countryFlags: Object.fromEntries(ALL_FLAGS.filter((flag) => flag !== "none").map((flag) => [flag, 2])) as Partial<Record<CountryFlag, number>>,
  fixings: Object.fromEntries(Object.entries(FIXING_OPTIONS).map(([id, option]) => [id, option.price])) as Record<FixingId, number>,
};

export const LOGO_ASSETS: Partial<Record<LogoOption, string>> = {
  BMW: "/assets/regitech/logo-brand-bmw.png",
  Ducati: "/assets/regitech/logo-brand-ducati.png",
  "Harley-Davidson": "/assets/regitech/logo-brand-harley-davidson.png",
  Honda: "/assets/regitech/logo-brand-honda.png",
  Kawasaki: "/assets/regitech/logo-brand-kawasaki.png",
  Triumph: "/assets/regitech/logo-brand-triumph.png",
  KTM: "/assets/regitech/logo-brand-ktm.png",
};

export const COUNTRY_FLAG_DEFINITIONS: Record<CountryFlag, CountryFlagDefinition> = {
  none: { value: "none", label: "None", code: "", assetPath: null, orientation: "stacked", printableRegion: { left: 0, top: 0, width: 0, height: 0 } },
  uk: { value: "uk", label: "United Kingdom — UK", code: "UK", assetPath: "/assets/regitech/country-flags/uk.png", orientation: "stacked", printableRegion: { left: 5.4, top: 59, width: 11, height: 27 } },
  eng: { value: "eng", label: "England — ENG", code: "ENG", assetPath: "/assets/regitech/country-flags/eng.png", orientation: "stacked", printableRegion: { left: 5.4, top: 59, width: 11, height: 27 } },
  cymru: { value: "cymru", label: "Wales — CYMRU", code: "CYMRU", assetPath: "/assets/regitech/country-flags/cymru.png", orientation: "stacked", printableRegion: { left: 5.7, top: 53, width: 10, height: 35 } },
  sco: { value: "sco", label: "Scotland — SCO", code: "SCO", assetPath: "/assets/regitech/country-flags/sco.png", orientation: "stacked", printableRegion: { left: 6.4, top: 59, width: 11, height: 27 } },
};

export function getCountryFlagDefinition(flag: CountryFlag): CountryFlagDefinition {
  return COUNTRY_FLAG_DEFINITIONS[flag];
}

export function isProductId(value: string): value is ProductId {
  return value in PRODUCT_RULES;
}

export function getProductRule(productId: string): ProductRule {
  return PRODUCT_RULES[isProductId(productId) ? productId : "hand-crafted-show-plate"];
}

export function createDefaultConfiguration(productId: string, registration = ""): PlateConfiguration {
  const rule = getProductRule(productId);
  const safeRegistration = rule.useType === "road-legal" ? registration.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 7) : registration.toUpperCase().slice(0, 12);
  return {
    productId: rule.id,
    productName: rule.name,
    badge: rule.badge,
    useType: rule.useType,
    registration: safeRegistration,
    size: rule.defaultSize,
    customWidth: "",
    customHeight: "",
    customDimensionUnit: "in",
    innerBorder: "None",
    outerBorder: "None",
    logo: "No Logo",
    logoPosition: { x: 50, y: 12 },
    uploadedLogoName: "",
    uploadedLogoPreviewUrl: "",
    uploadedLogoMimeType: "",
    sloganMode: "none",
    sloganText: "Ride with passion",
    sloganFont: "Rebel",
    countryFlag: "none",
    fixing: "none",
    specialRequirements: "",
    basePrice: rule.basePrice,
  };
}

export function formatPlateSize(config: PlateConfiguration): string {
  if (config.size !== "Custom") return config.size;
  const unit = config.customDimensionUnit === "cm" ? "cm" : "in";
  return `Custom: ${config.customWidth} × ${config.customHeight} ${unit}`;
}

export function getPlateAspectRatio(config: PlateConfiguration): number {
  if (config.size === "Custom") {
    const width = Number(config.customWidth);
    const height = Number(config.customHeight);
    return width > 0 && height > 0 ? width / height : 8 / 6;
  }
  const dimensions: Record<Exclude<PlateSize, "Custom">, [number, number]> = {
    "3×7″": [7, 3],
    "4×6″": [6, 4],
    "5×7″": [7, 5],
    "6×8″": [8, 6],
    "7×9″": [9, 7],
  };
  const [width, height] = dimensions[config.size];
  return width / height;
}
