export type ProductId = "hand-crafted-show-plate" | "2d-road-legal" | "2d-show-plate" | "crystal-3d" | "black-4d";
export type PlateUseType = "show" | "road-legal";
export type PlateSize = "3×7″" | "4×6″" | "5×7″" | "6×8″" | "7×9″" | "Custom";
export type BorderOption = "None" | "Black" | "Mirror Silver";
export type LogoOption = "No Logo" | "BMW" | "Ducati" | "Harley-Davidson" | "Honda" | "Kawasaki" | "Triumph" | "KTM" | "Other Logo";
export type SloganFont = "The Boss" | "The Scribbler" | "Rebel";
export type SloganMode = "none" | "custom";
export type CountryFlag = "none" | "uk" | "eng" | "cymru" | "sco";
export type CountryFlagOrientation = "stacked";
export type CountryFlagPrintableRegion = {
  left: number;
  top: number;
  width: number;
  height: number;
};
export type CountryFlagDefinition = {
  value: CountryFlag;
  label: string;
  code: string;
  assetPath: string | null;
  orientation: CountryFlagOrientation;
  printableRegion: CountryFlagPrintableRegion;
};
export type CustomDimensionUnit = "in" | "cm";
export type FixingId = "none" | "fixing-kit" | "adhesive-kit" | "complete-bundle";
export type ConfiguratorStepKey = "registration" | "size" | "borders" | "logo" | "slogan" | "countryFlag" | "fixings";

export type LogoPosition = {
  x: number;
  y: number;
};

export type SloganPlacement = "plate" | "border";

export type ProductRule = {
  id: ProductId;
  name: string;
  badge: string;
  useType: PlateUseType;
  basePrice: number;
  steps: ConfiguratorStepKey[];
  sizes: PlateSize[];
  defaultSize: PlateSize;
  innerBorders: BorderOption[];
  outerBorders: BorderOption[];
  logos: LogoOption[];
  slogan: boolean;
  countryFlags: CountryFlag[];
  fixings: FixingId[];
};

export type PlateConfiguration = {
  productId: ProductId;
  productName: string;
  badge: string;
  useType: PlateUseType;
  registration: string;
  size: PlateSize;
  customWidth: string;
  customHeight: string;
  customDimensionUnit: CustomDimensionUnit;
  innerBorder: BorderOption;
  outerBorder: BorderOption;
  logo: LogoOption;
  logoPosition: LogoPosition;
  uploadedLogoName: string;
  uploadedLogoPreviewUrl: string;
  uploadedLogoMimeType: string;
  sloganMode: SloganMode;
  sloganPlacement: SloganPlacement;
  sloganText: string;
  sloganFont: SloganFont;
  countryFlag: CountryFlag;
  fixing: FixingId;
  specialRequirements: string;
  basePrice: number;
};

export type CartItem = {
  id: string;
  config: PlateConfiguration;
  quantity: number;
};

export type AddressDetails = {
  addressLine1: string;
  addressLine2: string;
  town: string;
  county: string;
  postcode: string;
  country: string;
};

export type CustomerDetails = {
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  deliveryAddress: AddressDetails;
  billingSameAsDelivery: boolean;
  billingAddress: AddressDetails;
  additionalNotes: string;
};

export type PriceLine = {
  label: string;
  amount: number;
};
