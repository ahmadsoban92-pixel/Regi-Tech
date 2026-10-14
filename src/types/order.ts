export type PlateSize = "3×7″" | "4×6″" | "5×7″" | "6×8″" | "Custom";
export type BorderOption = "None" | "Black" | "Mirror Silver";
export type LogoOption = "No Logo" | "BMW" | "Ducati" | "Harley-Davidson" | "Honda" | "KTM" | "Other Logo";
export type SloganFont = "The Boss" | "The Scribbler" | "Rebel";
export type FixingOption = "No Fixing" | "Nylon Screws + Nylon Nuts" | "3M VHB Adhesive Tape" | "Complete Fixing Kit";

export type PlateConfiguration = {
  productId: string;
  productName: string;
  badge: string;
  registration: string;
  size: PlateSize;
  customWidth: string;
  customHeight: string;
  innerBorder: BorderOption;
  outerBorder: BorderOption;
  logo: LogoOption;
  uploadedLogoName: string;
  sloganEnabled: boolean;
  sloganText: string;
  sloganFont: SloganFont;
  fixing: FixingOption;
  specialRequirements: string;
  orderNotes: string;
  basePrice: number;
};

export type CustomerDetails = {
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  addressLine1: string;
  addressLine2: string;
  town: string;
  postcode: string;
  country: string;
  billingSameAsDelivery: boolean;
  additionalNotes: string;
};

export type PriceLine = {
  label: string;
  amount: number;
};
