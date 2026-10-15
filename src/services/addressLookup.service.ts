import { createIdpcClient, lookupPostcode } from "@ideal-postcodes/sdk";
import { getServerEnv } from "@/lib/env";
import type { AddressLookupData, NormalizedAddress } from "@/types/address";

export class AddressLookupConfigurationError extends Error {}

function normalizeLabel(parts: string[]) {
  return parts.filter(Boolean).join(", ");
}

export async function findAddressesByPostcode(postcode: string, page: number): Promise<AddressLookupData> {
  const { idealPostcodesApiKey } = getServerEnv();
  if (!idealPostcodesApiKey) throw new AddressLookupConfigurationError("Address lookup is not configured.");

  const client = createIdpcClient({ apiKey: idealPostcodesApiKey, timeoutMs: 8_000 });
  const result = await lookupPostcode({ client, postcode, page });
  const addresses: NormalizedAddress[] = result.addresses.map((address) => {
    const addressLine2 = [address.line_2, address.line_3].filter(Boolean).join(", ");
    return {
      id: String(address.id),
      label: normalizeLabel([address.line_1, addressLine2, address.post_town, address.postcode]),
      addressLine1: address.line_1,
      addressLine2,
      town: address.post_town,
      county: address.county,
      postcode: address.postcode,
      country: address.country || "United Kingdom",
    };
  });

  return {
    postcode: addresses[0]?.postcode ?? postcode.trim().toUpperCase(),
    addresses,
    suggestions: result.suggestions,
    page,
    total: result.total,
    hasMore: (page + 1) * 100 < result.total,
  };
}
