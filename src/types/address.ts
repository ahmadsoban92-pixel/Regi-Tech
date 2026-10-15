export type NormalizedAddress = {
  id: string;
  label: string;
  addressLine1: string;
  addressLine2: string;
  town: string;
  county: string;
  postcode: string;
  country: string;
};

export type AddressLookupData = {
  postcode: string;
  addresses: NormalizedAddress[];
  suggestions: string[];
  page: number;
  total: number;
  hasMore: boolean;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  message: string;
  errors?: Record<string, string[]>;
};
