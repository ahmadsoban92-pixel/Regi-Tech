import type {
  BorderOption,
  CountryFlag,
  FixingOption,
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
const ALL_FLAGS: CountryFlag[] = ["None", "Union Jack", "England", "Scotland", "Wales"];
const ALL_FIXINGS: FixingOption[] = ["No Fixing", "Nylon Fixing Set", "3M Adhesive Tape"];

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
    countryFlags: ["None"],
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
    countryFlags: ["None"],
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
    countryFlags: ["None"],
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
    countryFlags: ["None"],
    fixings: ALL_FIXINGS,
  },
};

export const OPTION_PRICES = {
  sizes: { Custom: 3 } as Partial<Record<PlateSize, number>>,
  borders: { Black: 2, "Mirror Silver": 5 } as Partial<Record<BorderOption, number>>,
  logos: Object.fromEntries(ALL_LOGOS.filter((logo) => logo !== "No Logo").map((logo) => [logo, 2])) as Partial<Record<LogoOption, number>>,
  slogan: 2,
  countryFlags: Object.fromEntries(ALL_FLAGS.filter((flag) => flag !== "None").map((flag) => [flag, 2])) as Partial<Record<CountryFlag, number>>,
  fixings: { "Nylon Fixing Set": 1, "3M Adhesive Tape": 1 } as Partial<Record<FixingOption, number>>,
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

export const FLAG_ASSETS: Partial<Record<CountryFlag, string>> = {
  "Union Jack": "/assets/regitech/flag-union-jack.png",
  England: "/assets/regitech/flag-england.png",
  Scotland: "/assets/regitech/flag-scotland.png",
  Wales: "/assets/regitech/flag-wales.png",
};

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
    countryFlag: "None",
    fixing: "No Fixing",
    specialRequirements: "",
    orderNotes: "",
    basePrice: rule.basePrice,
  };
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
