export type ProductId = "hand-crafted-show-plate" | "2d-road-legal" | "2d-show-plate" | "crystal-3d" | "black-4d";
export type PlateUseType = "show" | "road-legal";
export type PlateSize = "3×7″" | "4×6″" | "5×7″" | "6×8″" | "7×9″" | "Custom";
export type BorderOption = "None" | "Black" | "Mirror Silver";
export type LogoOption = "No Logo" | "BMW" | "Ducati" | "Harley-Davidson" | "Honda" | "Kawasaki" | "Triumph" | "KTM" | "Other Logo";
export type SloganFont = "The Boss" | "The Scribbler" | "Rebel";
export type SloganMode = "none" | "custom";
export type CountryFlag = "None" | "Union Jack" | "England" | "Scotland" | "Wales";
export type FixingOption = "No Fixing" | "Nylon Fixing Set" | "3M Adhesive Tape";
export type ConfiguratorStepKey = "registration" | "size" | "borders" | "logo" | "slogan" | "countryFlag" | "fixings";

export type LogoPosition = {
  x: number;
  y: number;
};

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
  fixings: FixingOption[];
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
  innerBorder: BorderOption;
  outerBorder: BorderOption;
  logo: LogoOption;
  logoPosition: LogoPosition;
  uploadedLogoName: string;
  uploadedLogoPreviewUrl: string;
  uploadedLogoMimeType: string;
  sloganMode: SloganMode;
  sloganText: string;
  sloganFont: SloganFont;
  countryFlag: CountryFlag;
  fixing: FixingOption;
  specialRequirements: string;
  orderNotes: string;
  basePrice: number;
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
